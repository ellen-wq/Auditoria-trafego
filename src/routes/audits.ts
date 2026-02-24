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

router.post('/preview-campaigns', requireAuth, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Arquivo da planilha é obrigatório (.xlsx ou .csv).' });
      return;
    }

    const parsed = parseSpreadsheetBuffer(req.file.buffer, req.file.originalname);
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

router.post('/', requireAuth, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
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

    const price = parseFloat(product_price);
    const pType = product_type || 'low_ticket';
    const preCheckout = has_pre_checkout === 'true' || has_pre_checkout === '1';
    const hasMoreThan50Sales28d = has_more_than_50_sales_28d === 'true' || has_more_than_50_sales_28d === '1';
    const hasAnyAdvantagePlus = has_any_advantage_plus === 'true' || has_any_advantage_plus === '1';
    const advantagePlusCampaigns = parseAdvantagePlusCampaigns(advantage_plus_campaigns);

    const parsed = parseSpreadsheetBuffer(req.file.buffer, req.file.originalname);
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
      .upload(storagePath, req.file.buffer, {
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
      res.status(500).json({ error: 'Erro ao criar auditoria.' });
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

export default router;
