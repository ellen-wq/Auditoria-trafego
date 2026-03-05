import { Router, Request, Response } from 'express';
import { getSupabase } from '../db/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import type { Campaign } from '../types.js';

const router = Router();

router.get('/campaigns/:auditId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();

    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('*')
      .eq('id', req.params.auditId)
      .single();

    if (auditError || !audit) {
      res.status(404).json({ error: 'Auditoria não encontrada.' });
      return;
    }
    if (audit.user_id !== req.user!.id && req.user!.role !== 'LIDERANCA') {
      res.status(403).json({ error: 'Sem permissão.' });
      return;
    }

    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('*, recommendations(title, steps_json)')
      .eq('audit_id', req.params.auditId)
      .eq('scenario', 1)
      .order('spend', { ascending: false });

    const mapped = (campaigns || []).map(c => {
      const rec = c.recommendations as unknown as { title: string; steps_json: string }[] | null;
      return {
        ...c,
        recommendations: undefined,
        rec_title: rec && rec.length > 0 ? rec[0].title : null,
        steps_json: rec && rec.length > 0 ? rec[0].steps_json : null
      };
    });

    res.json({ audit, campaigns: mapped });
  } catch (err) {
    console.error('Creatives campaigns error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();
    const { audit_id, items } = req.body;

    if (!audit_id || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Dados inválidos.' });
      return;
    }

    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('*')
      .eq('id', audit_id)
      .single();

    if (auditError || !audit) {
      res.status(404).json({ error: 'Auditoria não encontrada.' });
      return;
    }
    if (audit.user_id !== req.user!.id) {
      res.status(403).json({ error: 'Sem permissão.' });
      return;
    }

    const results: Record<string, unknown>[] = [];

    for (const item of items as { campaign_id: number; copy_text?: string; video_link?: string }[]) {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', item.campaign_id)
        .eq('audit_id', audit_id)
        .single();

      if (!campaign) continue;

      const analysis = generateCreativeAnalysis(campaign as Campaign, item.copy_text || '', item.video_link || '', audit.product_price);

      const { data: inserted } = await supabase
        .from('creatives')
        .insert({
          user_id: req.user!.id,
          audit_id,
          campaign_id: item.campaign_id,
          copy_text: item.copy_text || '',
          video_link: item.video_link || '',
          analysis_result: analysis
        })
        .select('id')
        .single();

      results.push({
        id: inserted?.id,
        campaign_id: item.campaign_id,
        campaign_name: campaign.campaign_name,
        copy_text: item.copy_text,
        video_link: item.video_link,
        analysis,
        campaign
      });
    }

    res.json({ creatives: results });
  } catch (err: unknown) {
    console.error('Creatives create error:', err);
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Erro ao salvar criativos: ' + message });
  }
});

router.get('/my', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();

    const { data: creativesRaw } = await supabase
      .from('creatives')
      .select('*, campaigns!inner(campaign_name, spend, ctr_link, link_clicks, impressions, lp_views, purchases, cpa, scenario), audits!inner(product_price, product_type, created_at)')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    const creatives = (creativesRaw || []).map(cr => {
      const c = cr.campaigns as unknown as Record<string, unknown>;
      const a = cr.audits as unknown as Record<string, unknown>;
      return {
        ...cr,
        campaigns: undefined,
        audits: undefined,
        campaign_name: c?.campaign_name,
        spend: c?.spend,
        ctr_link: c?.ctr_link,
        link_clicks: c?.link_clicks,
        impressions: c?.impressions,
        lp_views: c?.lp_views,
        purchases: c?.purchases,
        cpa: c?.cpa,
        scenario: c?.scenario,
        product_price: a?.product_price,
        product_type: a?.product_type,
        audit_date: a?.created_at
      };
    });

    res.json({ creatives });
  } catch (err) {
    console.error('Creatives list error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.get('/all', requireAuth, requireRole('LIDERANCA'), async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();
    const { from, to, product_type } = req.query as { from?: string; to?: string; product_type?: string };

    let query = supabase
      .from('creatives')
      .select('*, campaigns!inner(campaign_name, spend, ctr_link, link_clicks, impressions, lp_views, purchases, cpa, scenario), audits!inner(product_price, product_type, created_at), users!inner(name, email)')
      .order('created_at', { ascending: false });

    if (from) query = query.gte('audits.created_at', from);
    if (to) query = query.lte('audits.created_at', to);
    if (product_type) query = query.eq('audits.product_type', product_type);

    const { data: creativesRaw } = await query;

    const creatives = (creativesRaw || []).map(cr => {
      const c = cr.campaigns as unknown as Record<string, unknown>;
      const a = cr.audits as unknown as Record<string, unknown>;
      const u = cr.users as unknown as { name: string; email: string };
      return {
        ...cr,
        campaigns: undefined,
        audits: undefined,
        users: undefined,
        campaign_name: c?.campaign_name,
        spend: c?.spend,
        ctr_link: c?.ctr_link as number,
        link_clicks: c?.link_clicks,
        impressions: c?.impressions,
        lp_views: c?.lp_views as number,
        purchases: c?.purchases as number,
        cpa: c?.cpa as number,
        scenario: c?.scenario,
        product_price: a?.product_price as number,
        product_type: a?.product_type,
        audit_date: a?.created_at,
        user_name: u?.name || '',
        user_email: u?.email || '',
        copy_text: cr.copy_text as string
      };
    });

    const strengths = generateOverallStrengths(creatives as CreativeRow[]);

    res.json({ creatives, strengths });
  } catch (err) {
    console.error('Creatives all error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

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
  let highCtrCount = 0, lowCpaCount = 0, highConvCount = 0;
  let totalCtr = 0, totalConv = 0, count = 0;

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

  if (proofCount > creatives.length * 0.3) patterns.push('Prova social é o gatilho mais usado nos melhores criativos.');
  if (offerCount > creatives.length * 0.3) patterns.push('Ofertas e incentivos aparecem frequentemente nos melhores criativos.');
  if (curiosityCount > creatives.length * 0.3) patterns.push('Curiosidade e método são abordagens recorrentes nos melhores criativos.');

  return {
    summary: 'Análise geral de ' + creatives.length + ' criativos dos mentorados.',
    patterns: patterns
  };
}

export default router;
