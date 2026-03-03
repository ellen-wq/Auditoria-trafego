import { Router, Request, Response } from 'express';
import path from 'path';
import { getSupabase, STORAGE_BUCKET_NAME } from '../db/database';
import { requireAuth } from '../middleware/auth';
import upload from '../middleware/upload';
import { parseSpreadsheetBuffer } from '../utils/parser';
import { analyzeAllCampaigns } from '../engine/rules';

const router = Router();

function parseAdvantagePlusCampaigns(rawValue: unknown): string[] {
  if (!rawValue) return [];
  if (Array.isArray(rawValue)) {
    return rawValue.map((v) => String(v || '').trim()).filter(Boolean);
  }
  if (typeof rawValue === 'string') {
    try {
      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v || '').trim()).filter(Boolean);
      }
    } catch {
      return [];
    }
  }
  return [];
}

function getFileBuffer(file: Express.Multer.File): Buffer | null {
  if (!file || (file as any).buffer === undefined) return null;
  const buf = (file as any).buffer;
  if (Buffer.isBuffer(buf)) return buf;
  try {
    if (buf instanceof Uint8Array) return Buffer.from(buf);
    if (Array.isArray(buf)) return Buffer.from(buf as number[]);
    return Buffer.from(buf);
  } catch {
    return null;
  }
}

function handleMulterError(err: any, _req: Request, res: Response, next: () => void): void {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'Arquivo muito grande. Use um arquivo de até 4 MB (recomendado para evitar falhas).' });
      return;
    }
    res.status(400).json({ error: err.message || 'Erro no envio do arquivo.' });
    return;
  }
  next();
}

router.post('/preview-campaigns', requireAuth, (req: Request, res: Response, next: () => void) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      handleMulterError(err, req, res, next);
      return;
    }
    next();
  });
}, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Arquivo da planilha é obrigatório (.xlsx ou .csv).' });
      return;
    }
    const buffer = getFileBuffer(req.file);
    if (!buffer || buffer.length === 0) {
      res.status(400).json({ error: 'O arquivo está vazio ou não pôde ser lido. Tente enviar novamente (máx. 4 MB recomendado).' });
      return;
    }

    const parsed = parseSpreadsheetBuffer(buffer, req.file.originalname);
    if (parsed.error) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const uniqueCampaigns = Array.from(new Set((parsed.campaigns || []).map((c) => c.campaign_name).filter(Boolean)));
    res.json({ campaigns: uniqueCampaigns });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Erro ao ler campanhas da planilha: ' + message });
  }
});

router.post('/', requireAuth, (req: Request, res: Response, next: () => void) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      handleMulterError(err, req, res, next);
      return;
    }
    next();
  });
}, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      product_price,
      product_type,
      has_pre_checkout,
      has_more_than_50_sales_28d,
      has_any_advantage_plus,
      advantage_plus_campaigns
    } = req.body;

    if (!product_price || parseFloat(product_price) <= 0) {
      res.status(400).json({ error: 'Valor do produto é obrigatório e deve ser maior que zero.' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'Arquivo da planilha é obrigatório (.xlsx ou .csv).' });
      return;
    }
    const buffer = getFileBuffer(req.file);
    if (!buffer || buffer.length === 0) {
      res.status(400).json({ error: 'O arquivo está vazio ou não pôde ser lido. Tente enviar novamente (máx. 4 MB recomendado).' });
      return;
    }

    const price = parseFloat(product_price);
    const pType = product_type || 'low_ticket';
    const preCheckout = has_pre_checkout === 'true' || has_pre_checkout === '1';
    const hasMoreThan50Sales28d = has_more_than_50_sales_28d === 'true' || has_more_than_50_sales_28d === '1';
    const hasAnyAdvantagePlus = has_any_advantage_plus === 'true' || has_any_advantage_plus === '1';
    const advantagePlusCampaigns = parseAdvantagePlusCampaigns(advantage_plus_campaigns);

    let parsed;
    try {
      parsed = parseSpreadsheetBuffer(buffer, req.file.originalname);
    } catch (parseErr: unknown) {
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      res.status(400).json({ error: 'Planilha inválida ou formato não reconhecido. Verifique se é uma exportação do Gerenciador de Anúncios (.xlsx ou .csv). ' + msg });
      return;
    }
    if (parsed.error) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    if (!parsed.hasPurchases) {
      res.status(400).json({
        error: 'Para calcular CPA e classificar cenário 1/2, preciso da métrica COMPRAS (Purchases). Reexporte a planilha no Gerenciador de Anúncios incluindo a coluna Compras.'
      });
      return;
    }

    const analyzed = analyzeAllCampaigns(parsed.campaigns!, price, {
      productType: pType,
      hasPreCheckout: preCheckout,
      hasMoreThan50Sales28d,
      hasAnyAdvantagePlus,
      advantagePlusCampaigns
    });
    const supabase = getSupabase();
    const uploadExt = path.extname(req.file.originalname).toLowerCase();
    const storagePath = `${req.user!.id}/${Date.now()}-${Math.round(Math.random() * 1e9)}${uploadExt}`;
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: req.file.mimetype || undefined,
        upsert: false
      });

    if (storageError) {
      res.status(500).json({ error: `Erro ao salvar arquivo no Supabase Storage: ${storageError.message}` });
      return;
    }

    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .insert({
        user_id: req.user!.id,
        product_price: price,
        product_type: pType,
        has_pre_checkout: preCheckout ? 1 : 0,
        filename: req.file.originalname
      })
      .select('id')
      .single();

    if (auditError || !audit) {
      console.error('[Audits] Erro ao inserir auditoria:', auditError);
      const rawMsg =
        (auditError && typeof auditError === 'object' && 'message' in auditError && String((auditError as any).message)) ||
        (auditError && typeof auditError === 'object' && 'error' in auditError && String((auditError as any).error)) ||
        (auditError ? String(auditError) : '') ||
        'Erro desconhecido ao inserir na tabela audits.';
      const msg = rawMsg.trim();
      const hint =
        /integer|uuid|type|invalid|syntax|column|does not exist|relation/i.test(msg)
          ? ' Solução: execute o script migrate-audits-to-uuid.sql no Supabase (Dashboard > SQL Editor).'
          : '';
      const fullError = msg ? `Erro ao criar auditoria: ${msg}${hint}` : `Erro ao criar auditoria.${hint}`;
      res.status(500).json({ error: fullError });
      return;
    }

    const auditId = audit.id;

    for (const c of analyzed) {
      const { data: campaign, error: campError } = await supabase
        .from('campaigns')
        .insert({
          audit_id: auditId,
          campaign_name: c.campaign_name,
          spend: c.spend,
          ctr_link: c.ctr_link,
          link_clicks: c.link_clicks,
          lp_views: c.lp_views,
          lp_rate: c.lp_rate,
          checkouts: c.checkouts,
          purchases: c.purchases,
          cpa: c.cpa,
          cpc: c.cpc || 0,
          impressions: c.impressions || 0,
          reach: c.reach || 0,
          scenario: c.scenario,
          hook_rate: c.hook_rate || 0
        })
        .select('id')
        .single();

      if (campError || !campaign) continue;

      if (c.recommendation) {
        await supabase.from('recommendations').insert({
          campaign_id: campaign.id,
          title: c.recommendation.title,
          message: c.recommendation.message,
          steps_json: JSON.stringify(c.recommendation.steps)
        });
      }
    }

    res.json({ id: auditId, message: 'Auditoria criada com sucesso!' });
  } catch (err: unknown) {
    console.error('Audit create error:', err);
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Erro ao processar auditoria: ' + message });
  }
});

router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();

    const { data: audits, error } = await supabase
      .from('audits')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: 'Erro interno.' });
      return;
    }

    const auditIds = (audits || []).map(a => a.id);

    let campaignCounts: Record<number, { total: number; s1: number; s2: number; s3: number }> = {};

    if (auditIds.length > 0) {
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('audit_id, scenario')
        .in('audit_id', auditIds);

      if (campaigns) {
        for (const c of campaigns) {
          if (!campaignCounts[c.audit_id]) {
            campaignCounts[c.audit_id] = { total: 0, s1: 0, s2: 0, s3: 0 };
          }
          campaignCounts[c.audit_id].total++;
          if (c.scenario === 1) campaignCounts[c.audit_id].s1++;
          if (c.scenario === 2) campaignCounts[c.audit_id].s2++;
          if (c.scenario === 3) campaignCounts[c.audit_id].s3++;
        }
      }
    }

    const enriched = (audits || []).map(a => ({
      ...a,
      campaign_count: campaignCounts[a.id]?.total || 0,
      scenario1_count: campaignCounts[a.id]?.s1 || 0,
      scenario2_count: campaignCounts[a.id]?.s2 || 0,
      scenario3_count: campaignCounts[a.id]?.s3 || 0
    }));

    res.json({ audits: enriched });
  } catch (err) {
    console.error('Audit list error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();

    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('*')
      .eq('id', req.params.id)
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
      .select('*')
      .eq('audit_id', audit.id)
      .order('spend', { ascending: false });

    const campaignIds = (campaigns || []).map(c => c.id);

    let recsMap: Record<number, unknown[]> = {};
    if (campaignIds.length > 0) {
      const { data: recs } = await supabase
        .from('recommendations')
        .select('*')
        .in('campaign_id', campaignIds);

      if (recs) {
        for (const r of recs) {
          if (!recsMap[r.campaign_id]) recsMap[r.campaign_id] = [];
          recsMap[r.campaign_id].push(r);
        }
      }
    }

    const campaignsWithRecs = (campaigns || []).map(c => ({
      ...c,
      recommendations: recsMap[c.id] || []
    }));

    res.json({ audit, campaigns: campaignsWithRecs });
  } catch (err) {
    console.error('Audit detail error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// Migração: recria tabelas audits/campaigns/recommendations/creatives com user_id UUID
const MIGRATE_AUDITS_SQL_STEPS = [
  `DROP TABLE IF EXISTS creatives CASCADE`,
  `DROP TABLE IF EXISTS recommendations CASCADE`,
  `DROP TABLE IF EXISTS campaigns CASCADE`,
  `DROP TABLE IF EXISTS audits CASCADE`,
  `CREATE TABLE public.audits (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_price REAL NOT NULL,
    product_type TEXT DEFAULT 'low_ticket',
    has_pre_checkout INTEGER NOT NULL DEFAULT 0,
    filename TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_audits_user_id ON public.audits(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_audits_created_at ON public.audits(created_at)`,
  `CREATE TABLE public.campaigns (
    id SERIAL PRIMARY KEY,
    audit_id INTEGER NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
    campaign_name TEXT NOT NULL,
    spend REAL DEFAULT 0,
    ctr_link REAL DEFAULT 0,
    link_clicks INTEGER DEFAULT 0,
    lp_views INTEGER DEFAULT 0,
    lp_rate REAL DEFAULT 0,
    checkouts INTEGER DEFAULT 0,
    purchases INTEGER DEFAULT 0,
    cpa REAL DEFAULT 0,
    cpc REAL DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    scenario INTEGER DEFAULT 0,
    hook_rate REAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_campaigns_audit_id ON public.campaigns(audit_id)`,
  `CREATE INDEX IF NOT EXISTS idx_campaigns_scenario ON public.campaigns(scenario)`,
  `CREATE TABLE public.recommendations (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    steps_json TEXT DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_recommendations_campaign_id ON public.recommendations(campaign_id)`,
  `CREATE TABLE public.creatives (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    audit_id INTEGER NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
    campaign_id INTEGER NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    copy_text TEXT DEFAULT '',
    video_link TEXT DEFAULT '',
    analysis_result TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_creatives_user_id ON public.creatives(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_creatives_audit_id ON public.creatives(audit_id)`
];

router.post('/migrate-to-uuid', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();
    for (let i = 0; i < MIGRATE_AUDITS_SQL_STEPS.length; i++) {
      const { error } = await supabase.rpc('exec_sql', { sql: MIGRATE_AUDITS_SQL_STEPS[i] });
      if (error) {
        console.error('[Audits migrate] Step failed:', i, MIGRATE_AUDITS_SQL_STEPS[i].slice(0, 50), error);
        res.status(500).json({
          error: 'Migração falhou no passo ' + (i + 1) + '. ' + (error.message || String(error)) +
            ' Se o Supabase não tiver a função exec_sql, execute o arquivo migrate-audits-to-uuid.sql no SQL Editor do Dashboard.'
        });
        return;
      }
    }
    res.json({ ok: true, message: 'Migração concluída. Tente criar a auditoria novamente.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: 'Erro ao executar migração: ' + msg +
        ' Execute o arquivo migrate-audits-to-uuid.sql no Supabase (Dashboard > SQL Editor).'
    });
  }
});

export default router;
