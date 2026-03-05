import { Router, Request, Response } from 'express';
import { getSupabase } from '../db/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('LIDERANCA'));

router.get('/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();
    const { from, to, product_type } = req.query as { from?: string; to?: string; product_type?: string };

    const { count: totalUsers, error: usersError } = await supabase
      .from('user_roles')
      .select('user_id', { count: 'exact', head: true })
      .eq('role', 'MENTORADO');
    
    if (usersError) {
      console.error('[Admin Summary] Erro ao buscar user_roles:', usersError);
    }

    let auditsQuery = supabase.from('audits').select('id', { count: 'exact', head: true });
    if (from) auditsQuery = auditsQuery.gte('created_at', from);
    if (to) auditsQuery = auditsQuery.lte('created_at', to);
    if (product_type) auditsQuery = auditsQuery.eq('product_type', product_type);
    const { count: totalAudits, error: auditsError } = await auditsQuery;
    
    if (auditsError) {
      console.error('[Admin Summary] Erro ao buscar audits:', auditsError);
    }

    let campaignsQuery = supabase
      .from('campaigns')
      .select('spend, cpa, ctr_link, purchases, scenario, audit_id, audits!inner(created_at, product_price, product_type, user_id)');
    if (from) campaignsQuery = campaignsQuery.gte('audits.created_at', from);
    if (to) campaignsQuery = campaignsQuery.lte('audits.created_at', to);
    if (product_type) campaignsQuery = campaignsQuery.eq('audits.product_type', product_type);
    const { data: allCampaigns, error: campaignsError } = await campaignsQuery;
    
    if (campaignsError) {
      console.error('[Admin Summary] Erro ao buscar campaigns:', campaignsError);
    }

    const campaigns = allCampaigns || [];
    let s1 = 0, s2 = 0, s3 = 0, totalSpend = 0, totalPurchases = 0, totalCpa = 0, totalCtr = 0;
    campaigns.forEach(c => {
      if (c.scenario === 1) s1++;
      if (c.scenario === 2) s2++;
      if (c.scenario === 3) s3++;
      totalSpend += c.spend || 0;
      totalPurchases += c.purchases || 0;
      totalCpa += c.cpa || 0;
      totalCtr += c.ctr_link || 0;
    });
    const total = campaigns.length;
    const scenarioCounts = {
      s1, s2, s3, total,
      avg_spend: total > 0 ? totalSpend / total : 0,
      avg_cpa: total > 0 ? totalCpa / total : 0,
      avg_ctr: total > 0 ? totalCtr / total : 0,
      total_spend: totalSpend,
      total_purchases: totalPurchases
    };

    const rpcParams: Record<string, string | null> = {
      p_from: from || null,
      p_to: to || null,
      p_product_type: product_type || null
    };

    const { data: perUserAvgData } = await supabase.rpc('admin_per_user_avg', rpcParams);
    const perUserAvg = perUserAvgData && perUserAvgData.length > 0 ? perUserAvgData[0] : {
      avg_spend_per_user: 0, avg_purchases_per_user: 0, avg_cpa_per_user: 0, avg_revenue_per_user: 0
    };

    let recentQuery = supabase
      .from('audits')
      .select('*, users!inner(name, email)')
      .order('created_at', { ascending: false })
      .limit(10);
    if (from) recentQuery = recentQuery.gte('created_at', from);
    if (to) recentQuery = recentQuery.lte('created_at', to);
    if (product_type) recentQuery = recentQuery.eq('product_type', product_type);
    const { data: recentRaw } = await recentQuery;

    const recentAuditIds = (recentRaw || []).map(a => a.id);
    let recentCampCounts: Record<number, number> = {};
    if (recentAuditIds.length > 0) {
      const { data: rcamps } = await supabase
        .from('campaigns')
        .select('audit_id')
        .in('audit_id', recentAuditIds);
      if (rcamps) {
        rcamps.forEach(c => { recentCampCounts[c.audit_id] = (recentCampCounts[c.audit_id] || 0) + 1; });
      }
    }

    const recentAudits = (recentRaw || []).map(a => {
      const u = a.users as unknown as { name: string; email: string };
      return {
        ...a,
        users: undefined,
        user_name: u?.name || '',
        user_email: u?.email || '',
        campaign_count: recentCampCounts[a.id] || 0
      };
    });

    const { data: roasRanking } = await supabase.rpc('admin_roas_ranking', rpcParams);
    const roasAll = roasRanking || [];
    const halfRoas = Math.ceil(roasAll.length / 2);
    const bestRoas = roasAll.slice(0, Math.min(3, halfRoas));
    const worstRoas = roasAll.slice(Math.max(roasAll.length - 3, halfRoas)).reverse();

    const { data: ctrRanking } = await supabase.rpc('admin_ctr_ranking', rpcParams);
    const ctrAll = ctrRanking || [];
    const halfCtr = Math.ceil(ctrAll.length / 2);
    const bestCtr = ctrAll.slice(0, Math.min(3, halfCtr));
    const worstCtr = ctrAll.slice(Math.max(ctrAll.length - 3, halfCtr)).reverse();

    const { data: convRanking } = await supabase.rpc('admin_conv_ranking', rpcParams);
    const convAll = convRanking || [];
    const halfConv = Math.ceil(convAll.length / 2);
    const bestConv = convAll.slice(0, Math.min(3, halfConv));
    const worstConv = convAll.slice(Math.max(convAll.length - 3, halfConv)).reverse();

    res.json({
      totalUsers: totalUsers || 0,
      totalAudits: totalAudits || 0,
      scenarios: scenarioCounts,
      avgPerUser: perUserAvg,
      bestRoas, worstRoas,
      bestCtr, worstCtr,
      bestConv, worstConv,
      recentAudits
    });
  } catch (err) {
    console.error('Admin summary error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.get('/users', async (_req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();

    console.log('[Admin /users] Iniciando busca de MENTORADOS...');

    // Teste de query simples primeiro
    const { data: testData, error: testError } = await supabase
      .from('user_roles')
      .select('user_id, name, role, created_at')
      .limit(5);

    console.log('[Admin /users] Teste de query:', { 
      dataCount: testData?.length || 0, 
      error: testError,
      errorCode: testError?.code,
      errorMessage: testError?.message
    });

    if (testError) {
      console.error('[Admin /users] Erro no teste:', testError);
      res.status(500).json({ 
        error: 'Erro ao buscar usuários.',
        details: process.env.NODE_ENV === 'development' ? testError.message : undefined,
        code: testError.code
      });
      return;
    }

    const { data: usersRaw, error: usersError } = await supabase
      .from('user_roles')
      .select('user_id, name, role, created_at')
      .eq('role', 'MENTORADO')
      .order('name');

    console.log('[Admin /users] Query MENTORADOS:', { 
      dataCount: usersRaw?.length || 0, 
      error: usersError,
      errorCode: usersError?.code,
      errorMessage: usersError?.message
    });

    if (usersError) {
      console.error('[Admin /users] Erro ao buscar MENTORADOS:', usersError);
      res.status(500).json({ 
        error: 'Erro ao buscar usuários.',
        details: process.env.NODE_ENV === 'development' ? usersError.message : undefined,
        code: usersError.code
      });
      return;
    }

    const userIds = (usersRaw || []).map((u: any) => u.user_id);
    let auditStats: Record<string, { count: number; last: string | null }> = {};

    if (userIds.length > 0) {
      const { data: audits, error: auditsError } = await supabase
        .from('audits')
        .select('user_id, created_at')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      if (auditsError) {
        console.error('[Admin /users] Erro ao buscar audits:', auditsError);
      }

      if (audits) {
        audits.forEach(a => {
          if (!auditStats[a.user_id]) {
            auditStats[a.user_id] = { count: 0, last: a.created_at };
          }
          auditStats[a.user_id].count++;
        });
      }
    }

    // Buscar emails do auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('[Admin /users] Erro ao buscar auth.users:', authError);
    }
    
    const emailMap = new Map(authUsers?.users?.map(u => [u.id, u.email]) || []);
    
    const users = (usersRaw || []).map((u: any) => {
      const userId = u.user_id;
      return {
        id: userId,
        name: u.name,
        email: emailMap.get(userId) || '',
        role: u.role,
        created_at: u.created_at,
        audit_count: auditStats[userId]?.count || 0,
        last_audit: auditStats[userId]?.last || null
      };
    });

    console.log('[Admin /users] Retornando', users.length, 'usuários MENTORADOS');
    res.json({ users });
  } catch (err: any) {
    console.error('[Admin /users] Erro geral:', err);
    console.error('[Admin /users] Stack:', err?.stack);
    res.status(500).json({ 
      error: 'Erro interno.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

router.get('/users/:id/audits', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!userId || !uuidRegex.test(userId)) {
      res.status(400).json({ error: 'ID inválido. Deve ser um UUID.' });
      return;
    }

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id, name, role, created_at')
      .eq('user_id', userId)
      .single();
    
    if (roleError || !roleData) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }
    
    // Buscar email do auth.users
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const user = {
      id: roleData.user_id,
      name: roleData.name || '',
      email: authUser?.user?.email || '',
      role: roleData.role,
      created_at: roleData.created_at
    };


    const { data: auditsRaw } = await supabase
      .from('audits')
      .select('*')
      .eq('user_id', req.params.id)
      .order('created_at', { ascending: false });

    const auditIds = (auditsRaw || []).map(a => a.id);
    let campaignCounts: Record<number, { total: number; s1: number; s2: number; s3: number }> = {};

    if (auditIds.length > 0) {
      const { data: camps } = await supabase
        .from('campaigns')
        .select('audit_id, scenario')
        .in('audit_id', auditIds);

      if (camps) {
        camps.forEach(c => {
          if (!campaignCounts[c.audit_id]) campaignCounts[c.audit_id] = { total: 0, s1: 0, s2: 0, s3: 0 };
          campaignCounts[c.audit_id].total++;
          if (c.scenario === 1) campaignCounts[c.audit_id].s1++;
          if (c.scenario === 2) campaignCounts[c.audit_id].s2++;
          if (c.scenario === 3) campaignCounts[c.audit_id].s3++;
        });
      }
    }

    const audits = (auditsRaw || []).map(a => ({
      ...a,
      campaign_count: campaignCounts[a.id]?.total || 0,
      scenario1_count: campaignCounts[a.id]?.s1 || 0,
      scenario2_count: campaignCounts[a.id]?.s2 || 0,
      scenario3_count: campaignCounts[a.id]?.s3 || 0
    }));

    res.json({ user, audits });
  } catch (err) {
    console.error('Admin user audits error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.get('/audits/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();

    const { data: auditRaw, error: auditError } = await supabase
      .from('audits')
      .select('*, users!inner(name, email)')
      .eq('id', req.params.id)
      .single();

    if (auditError || !auditRaw) {
      res.status(404).json({ error: 'Auditoria não encontrada.' });
      return;
    }

    const u = auditRaw.users as unknown as { name: string; email: string };
    const audit = { ...auditRaw, users: undefined, user_name: u?.name || '', user_email: u?.email || '' };

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
        recs.forEach(r => {
          if (!recsMap[r.campaign_id]) recsMap[r.campaign_id] = [];
          recsMap[r.campaign_id].push(r);
        });
      }
    }

    const campaignsWithRecs = (campaigns || []).map(c => ({
      ...c,
      recommendations: recsMap[c.id] || []
    }));

    res.json({ audit, campaigns: campaignsWithRecs });
  } catch (err) {
    console.error('Admin audit detail error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

export default router;
