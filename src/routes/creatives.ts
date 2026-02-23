import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { requireAuth, requireRole } from '../middleware/auth';
import type { Audit, Campaign } from '../types';

const router = Router();

router.get('/campaigns/:auditId', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const audit = db.prepare('SELECT * FROM audits WHERE id = ?').get(req.params.auditId) as Audit | null;
    if (!audit) {
      res.status(404).json({ error: 'Auditoria não encontrada.' });
      return;
    }
    if (audit.user_id !== req.user!.id && req.user!.role !== 'LIDERANCA') {
      res.status(403).json({ error: 'Sem permissão.' });
      return;
    }

    const campaigns = db.prepare(`
      SELECT c.*, r.title as rec_title, r.steps_json
      FROM campaigns c
      LEFT JOIN recommendations r ON r.campaign_id = c.id
      WHERE c.audit_id = ?
      ORDER BY c.spend DESC
    `).all(req.params.auditId);

    res.json({ audit, campaigns });
  } catch (err) {
    console.error('Creatives campaigns error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const { audit_id, items } = req.body;

    if (!audit_id || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Dados inválidos.' });
      return;
    }

    const audit = db.prepare('SELECT * FROM audits WHERE id = ?').get(audit_id) as Audit | null;
    if (!audit) {
      res.status(404).json({ error: 'Auditoria não encontrada.' });
      return;
    }
    if (audit.user_id !== req.user!.id) {
      res.status(403).json({ error: 'Sem permissão.' });
      return;
    }

    const insert = db.prepare(
      'INSERT INTO creatives (user_id, audit_id, campaign_id, copy_text, video_link, analysis_result) VALUES (?, ?, ?, ?, ?, ?)'
    );

    const results: Record<string, unknown>[] = [];

    const transaction = db.transaction(() => {
      for (const item of items as { campaign_id: number; copy_text?: string; video_link?: string }[]) {
        const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ? AND audit_id = ?').get(item.campaign_id, audit_id) as Campaign | null;
        if (!campaign) continue;

        const analysis = generateCreativeAnalysis(campaign, item.copy_text || '', item.video_link || '', audit.product_price);

        const result = insert.run(req.user!.id, audit_id, item.campaign_id, item.copy_text || '', item.video_link || '', analysis);

        results.push({
          id: result.lastInsertRowid,
          campaign_id: item.campaign_id,
          campaign_name: campaign.campaign_name,
          copy_text: item.copy_text,
          video_link: item.video_link,
          analysis,
          campaign
        });
      }
    });

    transaction();

    res.json({ creatives: results });
  } catch (err: unknown) {
    console.error('Creatives create error:', err);
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Erro ao salvar criativos: ' + message });
  }
});

router.get('/my', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const creatives = db.prepare(`
      SELECT cr.*, c.campaign_name, c.spend, c.ctr_link, c.link_clicks,
        c.impressions, c.lp_views, c.purchases, c.cpa, c.scenario,
        a.product_price, a.product_type, a.created_at as audit_date
      FROM creatives cr
      JOIN campaigns c ON cr.campaign_id = c.id
      JOIN audits a ON cr.audit_id = a.id
      WHERE cr.user_id = ?
      ORDER BY cr.created_at DESC
    `).all(req.user!.id);

    res.json({ creatives });
  } catch (err) {
    console.error('Creatives list error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.get('/all', requireAuth, requireRole('LIDERANCA'), (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const { from, to, product_type } = req.query;

    let filters = '';
    const params: unknown[] = [];
    if (from) { filters += ' AND a.created_at >= ?'; params.push(from); }
    if (to) { filters += ' AND a.created_at <= ?'; params.push(to); }
    if (product_type) { filters += ' AND a.product_type = ?'; params.push(product_type); }

    const creatives = db.prepare(`
      SELECT cr.*, c.campaign_name, c.spend, c.ctr_link, c.link_clicks,
        c.impressions, c.lp_views, c.purchases, c.cpa, c.scenario,
        a.product_price, a.product_type, a.created_at as audit_date,
        u.name as user_name, u.email as user_email
      FROM creatives cr
      JOIN campaigns c ON cr.campaign_id = c.id
      JOIN audits a ON cr.audit_id = a.id
      JOIN users u ON cr.user_id = u.id
      WHERE 1=1 ${filters}
      ORDER BY cr.created_at DESC
    `).all(...params) as (Record<string, unknown> & { ctr_link: number; purchases: number; lp_views: number; cpa: number; product_price: number; copy_text: string })[];

    const strengths = generateOverallStrengths(creatives);

    res.json({ creatives, strengths });
  } catch (err) {
    console.error('Creatives all error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

interface CreativeAnalysisOutput {
  points: string[];
  replication: string[];
}

function generateCreativeAnalysis(campaign: Campaign, copyText: string, videoLink: string, productPrice: number): string {
  const points: string[] = [];
  const replication: string[] = [];

  if (campaign.ctr_link >= 0.02) {
    points.push('CTR acima de 2% indica que o criativo chama muita atenção e gera cliques consistentes.');
    replication.push('Mantenha o gancho inicial (primeiros 3 segundos do vídeo ou headline da copy). Esse é o principal fator de clique.');
  } else if (campaign.ctr_link >= 0.01) {
    points.push('CTR entre 1% e 2% está na média. Há espaço para melhorar o gancho.');
    replication.push('Teste variações do gancho inicial mantendo a mesma promessa central.');
  }

  if (campaign.purchases > 0 && campaign.cpa <= productPrice * 0.5) {
    points.push('CPA excelente — o criativo converte bem e o custo por venda está saudável.');
    replication.push('Esse criativo provou que vende. Crie 2-3 variações com ângulos diferentes mas mantendo a mesma estrutura de oferta.');
  } else if (campaign.purchases > 0) {
    points.push('O criativo gera vendas, mas o CPA pode ser otimizado.');
    replication.push('Teste novos públicos com este criativo para encontrar combinações com CPA menor.');
  }

  const convRate = campaign.lp_views > 0 ? campaign.purchases / campaign.lp_views : 0;
  if (convRate >= 0.05) {
    points.push('Taxa de conversão da página acima de 5% — a mensagem do criativo está alinhada com a página de vendas.');
    replication.push('A conexão entre o criativo e a página está forte. Ao criar variações, mantenha a mesma promessa que a página entrega.');
  } else if (convRate >= 0.02) {
    points.push('Taxa de conversão entre 2% e 5% — boa, mas pode melhorar.');
    replication.push('Teste alinhar melhor a expectativa criada no anúncio com o que a página entrega.');
  }

  if (campaign.impressions > 0 && campaign.link_clicks > 0) {
    const hookRate = campaign.link_clicks / campaign.impressions;
    if (hookRate > 0.03) {
      points.push('O criativo tem um poder de retenção muito alto — as pessoas param para assistir e clicam.');
      replication.push('O elemento visual ou a frase inicial é muito forte. Use a mesma abordagem em novos criativos.');
    }
  }

  if (copyText && copyText.length > 50) {
    points.push('Copy detalhada fornecida — isso ajuda a entender a abordagem de comunicação.');
    if (copyText.toLowerCase().includes('resultado') || copyText.toLowerCase().includes('prova') || copyText.toLowerCase().includes('depoimento')) {
      replication.push('A copy usa prova social, que é um dos gatilhos mais fortes. Mantenha essa abordagem em novos criativos.');
    }
    if (copyText.toLowerCase().includes('grátis') || copyText.toLowerCase().includes('desconto') || copyText.toLowerCase().includes('bônus')) {
      replication.push('A copy usa incentivo de oferta. Continue testando variações com diferentes tipos de incentivo.');
    }
    if (copyText.toLowerCase().includes('como') || copyText.toLowerCase().includes('passo') || copyText.toLowerCase().includes('método')) {
      replication.push('A copy usa curiosidade/método, que gera engajamento. Teste variações com diferentes ângulos de curiosidade.');
    }
  }

  if (videoLink && videoLink.trim().length > 0) {
    points.push('Link do vídeo fornecido — permite análise visual do criativo.');
    replication.push('Ao criar novos vídeos, mantenha o mesmo estilo visual e tom de voz dos primeiros 5 segundos.');
  }

  if (points.length === 0) {
    points.push('Dados insuficientes para uma análise completa. Preencha mais informações do criativo.');
  }
  if (replication.length === 0) {
    replication.push('Teste novos formatos de criativo mantendo a mesma oferta.');
  }

  return JSON.stringify({ points, replication });
}

interface CreativeRow {
  ctr_link: number;
  purchases: number;
  lp_views: number;
  cpa: number;
  product_price: number;
  copy_text: string;
  [key: string]: unknown;
}

function generateOverallStrengths(creatives: CreativeRow[]): { summary: string; patterns: string[] } {
  if (!creatives || creatives.length === 0) {
    return { summary: 'Nenhum criativo cadastrado ainda.', patterns: [] };
  }

  const patterns: string[] = [];
  let highCtrCount = 0;
  let lowCpaCount = 0;
  let highConvCount = 0;
  let totalCtr = 0;
  let totalConv = 0;
  let count = 0;

  creatives.forEach(cr => {
    count++;
    totalCtr += cr.ctr_link || 0;
    const conv = cr.lp_views > 0 ? cr.purchases / cr.lp_views : 0;
    totalConv += conv;
    if (cr.ctr_link >= 0.02) highCtrCount++;
    if (cr.purchases > 0 && cr.cpa <= cr.product_price * 0.5) lowCpaCount++;
    if (conv >= 0.05) highConvCount++;
  });

  const avgCtr = count > 0 ? totalCtr / count : 0;
  const avgConv = count > 0 ? totalConv / count : 0;

  if (highCtrCount > creatives.length * 0.5) {
    patterns.push('A maioria dos melhores criativos tem CTR acima de 2% — os ganchos estão funcionando bem de forma geral.');
  }
  if (lowCpaCount > creatives.length * 0.5) {
    patterns.push('Mais da metade dos criativos têm CPA saudável — a qualidade dos criativos está boa.');
  }
  if (highConvCount > creatives.length * 0.3) {
    patterns.push('Boa taxa de conversão na página — os criativos estão atraindo tráfego qualificado.');
  }

  patterns.push('CTR médio dos melhores criativos: ' + (avgCtr * 100).toFixed(2).replace('.', ',') + '%');
  patterns.push('Taxa de conversão média: ' + (avgConv * 100).toFixed(2).replace('.', ',') + '%');

  let proofCount = 0, offerCount = 0, curiosityCount = 0;
  creatives.forEach(cr => {
    const copy = (cr.copy_text || '').toLowerCase();
    if (copy.includes('resultado') || copy.includes('prova') || copy.includes('depoimento')) proofCount++;
    if (copy.includes('grátis') || copy.includes('desconto') || copy.includes('bônus')) offerCount++;
    if (copy.includes('como') || copy.includes('passo') || copy.includes('método')) curiosityCount++;
  });

  const copyPatterns: string[] = [];
  if (proofCount > creatives.length * 0.3) copyPatterns.push('Prova social é o gatilho mais usado nos melhores criativos.');
  if (offerCount > creatives.length * 0.3) copyPatterns.push('Ofertas e incentivos aparecem frequentemente nos melhores criativos.');
  if (curiosityCount > creatives.length * 0.3) copyPatterns.push('Curiosidade e método são abordagens recorrentes nos melhores criativos.');

  return {
    summary: 'Análise geral de ' + creatives.length + ' criativos dos mentorados.',
    patterns: patterns.concat(copyPatterns)
  };
}

export default router;
