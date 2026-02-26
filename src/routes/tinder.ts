import { Router, Request, Response } from 'express';
import { getSupabase } from '../db/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

type AppRole = 'MENTORADO' | 'LIDERANCA' | 'PRESTADOR';

function cleanString(value: unknown, max = 5000): string {
  return String(value ?? '').trim().slice(0, max);
}

function cleanOptionalString(value: unknown, max = 5000): string | null {
  const v = cleanString(value, max);
  return v ? v : null;
}

function toPositiveInt(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function isValidUUID(value: unknown): string | null {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const str = String(value ?? '').trim();
  return uuidRegex.test(str) ? str : null;
}

function toRating(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n < 1 || n > 5) return null;
  return Math.round(n);
}

function normalizeMatchPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function ensureRoles(req: Request, res: Response, roles: AppRole[]): boolean {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado' });
    return false;
  }
  if (!roles.includes(req.user.role as AppRole)) {
    res.status(403).json({ error: 'Sem permissão' });
    return false;
  }
  return true;
}

async function logAction(actorUserId: string | null, action: string, meta: Record<string, unknown> = {}): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase.from('tinder_do_fluxo_logs').insert({
      actor_user_id: actorUserId,
      action,
      meta
    });
  } catch {
    // Não bloqueia fluxo por falha de log.
  }
}

router.use(requireAuth);

// Tutorial status
router.get('/tutorial-status', async (req: Request, res: Response): Promise<void> => {
  res.json({ hasSeen: !!req.user?.has_seen_tinder_do_fluxo_tutorial });
});

router.post('/tutorial-status', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();
    await supabase
      .from('user_roles')
      .update({ has_seen_tinder_do_fluxo_tutorial: true })
      .eq('user_id', req.user!.id);

    await logAction(req.user!.id, 'TINDER_TUTORIAL_SEEN', { userId: req.user!.id });
    res.json({ ok: true });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Erro ao atualizar status do tutorial.' });
  }
});

// Mentor profile
router.get('/mentor-profile', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  
  // Garantir que userId vem da sessão
  const userId = req.user!.id;
  if (!userId) {
    res.status(401).json({ error: 'Usuário não autenticado.' });
    return;
  }
  
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tinder_mentor_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('[GET /mentor-profile] Erro:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil de mentorado.' });
    return;
  }
  
  // Retornar perfil ou objeto vazio com defaults
  res.json({ profile: data || null });
});

router.post('/mentor-profile', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  
  // Garantir que userId vem da sessão, não do body
  const userId = req.user!.id;
  if (!userId) {
    res.status(401).json({ error: 'Usuário não autenticado.' });
    return;
  }
  
  const supabase = getSupabase();
  
  // Verificar se a tabela existe, se não, tentar criar
  const { error: tableCheckError } = await supabase
    .from('tinder_mentor_profiles')
    .select('id')
    .limit(1);
  
  if (tableCheckError && tableCheckError.message?.includes('does not exist')) {
    console.error('[POST /mentor-profile] Tabela não existe. Execute a migration SQL no Supabase.');
    res.status(500).json({ 
      error: 'Tabela não encontrada. Por favor, execute a migration SQL no Supabase Dashboard. Verifique o arquivo supabase-migration.sql' 
    });
    return;
  }
  
  const payload = {
    user_id: userId, // Sempre da sessão
    photo_url: cleanString(req.body.photoUrl || '', 1000),
    city: cleanString(req.body.city || '', 120),
    instagram: cleanString(req.body.instagram || '', 120),
    niche: cleanString(req.body.niche || '', 120),
    nivel_fluxo: cleanString(req.body.nivelFluxo || '', 50),
    bio: cleanString(req.body.bio || '', 2000),
    whatsapp: cleanString(req.body.whatsapp || '', 40),
    updated_at: new Date().toISOString()
  };
  
  console.log('[POST /mentor-profile] Payload:', payload);
  const { data, error } = await supabase
    .from('tinder_mentor_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single();
  
  if (error) {
    console.error('[POST /mentor-profile] Erro Supabase:', error);
    console.error('[POST /mentor-profile] Detalhes:', JSON.stringify(error, null, 2));
    res.status(500).json({ error: 'Erro ao salvar perfil: ' + (error.message || 'Erro desconhecido') });
    return;
  }
  
  if (!data) {
    console.error('[POST /mentor-profile] Nenhum dado retornado após upsert');
    res.status(500).json({ error: 'Erro ao salvar perfil: nenhum dado retornado' });
    return;
  }
  
  console.log('[POST /mentor-profile] Perfil salvo com sucesso:', data.id);
  await logAction(userId, 'TINDER_MENTOR_PROFILE_UPSERT', { userId });
  res.json({ profile: data });
});

// Expert profile
router.get('/expert-profile', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  
  // Garantir que userId vem da sessão
  const userId = req.user!.id;
  if (!userId) {
    res.status(401).json({ error: 'Usuário não autenticado.' });
    return;
  }
  
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tinder_expert_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('[GET /expert-profile] Erro:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil expert/coprodutor.' });
    return;
  }
  
  // Retornar perfil ou objeto vazio
  res.json({ profile: data || null });
});

router.post('/expert-profile', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  
  // Garantir que userId vem da sessão
  const userId = req.user!.id;
  if (!userId) {
    res.status(401).json({ error: 'Usuário não autenticado.' });
    return;
  }
  
  // Validação: prestador não pode ser expert/coprodutor
  if (req.user!.role === 'PRESTADOR') {
    res.status(403).json({ error: 'Prestadores de serviço não podem ser experts/coprodutores.' });
    return;
  }
  
  const supabase = getSupabase();
  const payload = {
    user_id: userId, // Sempre da sessão
    is_expert: !!req.body.isExpert,
    is_coproducer: !!req.body.isCoproducer,
    goal_text: cleanString(req.body.goalText || '', 400),
    search_bio: cleanString(req.body.searchBio || '', 2000),
    preferences_json: req.body.preferencesJson && typeof req.body.preferencesJson === 'object' ? req.body.preferencesJson : {},
    updated_at: new Date().toISOString()
  };
  
  console.log('[POST /expert-profile] Payload:', payload);
  const { data, error } = await supabase
    .from('tinder_expert_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single();
  
  if (error) {
    console.error('[POST /expert-profile] Erro Supabase:', error);
    console.error('[POST /expert-profile] Detalhes:', JSON.stringify(error, null, 2));
    res.status(500).json({ error: 'Erro ao salvar perfil expert/coprodutor: ' + (error.message || 'Erro desconhecido') });
    return;
  }
  
  if (!data) {
    console.error('[POST /expert-profile] Nenhum dado retornado após upsert');
    res.status(500).json({ error: 'Erro ao salvar perfil expert/coprodutor: nenhum dado retornado' });
    return;
  }
  
  console.log('[POST /expert-profile] Perfil salvo com sucesso:', data.id);
  await logAction(userId, 'TINDER_EXPERT_PROFILE_UPSERT', { userId });
  res.json({ profile: data });
});

// Service profile
router.get('/service-profile', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['PRESTADOR', 'LIDERANCA'])) return;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tinder_service_profiles')
    .select('*')
    .eq('user_id', req.user!.id)
    .maybeSingle();
  if (error) {
    res.status(500).json({ error: 'Erro ao buscar perfil de prestador.' });
    return;
  }
  res.json({ profile: data });
});

router.post('/service-profile', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['PRESTADOR', 'LIDERANCA'])) return;
  
  // Garantir que userId vem da sessão
  const userId = req.user!.id;
  if (!userId) {
    res.status(401).json({ error: 'Usuário não autenticado.' });
    return;
  }
  
  // Validação: expert/coprodutor não pode ser prestador
  const supabase = getSupabase();
  const { data: expertProfile } = await supabase
    .from('tinder_expert_profiles')
    .select('is_expert, is_coproducer')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (expertProfile && (expertProfile.is_expert || expertProfile.is_coproducer)) {
    res.status(403).json({ error: 'Experts/coprodutores não podem ser prestadores de serviço.' });
    return;
  }
  
  const payload = {
    user_id: userId, // Sempre da sessão
    photo_url: cleanString(req.body.photoUrl || '', 1000),
    city: cleanString(req.body.city || '', 120),
    instagram: cleanString(req.body.instagram || '', 120),
    whatsapp: cleanString(req.body.whatsapp || '', 40),
    specialty: cleanString(req.body.specialty || '', 60),
    certification: cleanString(req.body.certification || '', 100),
    portfolio: cleanString(req.body.portfolio || '', 1000),
    experience: cleanString(req.body.experience || '', 2000),
    bio: cleanString(req.body.bio || '', 2000),
    updated_at: new Date().toISOString()
  };
  console.log('[POST /service-profile] Payload:', payload);
  const { data, error } = await supabase
    .from('tinder_service_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single();
  
  if (error) {
    console.error('[POST /service-profile] Erro Supabase:', error);
    console.error('[POST /service-profile] Detalhes:', JSON.stringify(error, null, 2));
    res.status(500).json({ error: 'Erro ao salvar perfil de prestador: ' + (error.message || 'Erro desconhecido') });
    return;
  }
  
  if (!data) {
    console.error('[POST /service-profile] Nenhum dado retornado após upsert');
    res.status(500).json({ error: 'Erro ao salvar perfil de prestador: nenhum dado retornado' });
    return;
  }
  
  console.log('[POST /service-profile] Perfil salvo com sucesso:', data.id);
  await logAction(userId, 'TINDER_SERVICE_PROFILE_UPSERT', { userId });
  res.json({ profile: data });
});

// Feeds
router.get('/feed/comunidade', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('user_roles')
    .select('user_id, name, role, created_at, tinder_mentor_profiles(*)')
    .eq('role', 'MENTORADO')
    .neq('user_id', req.user!.id)
    .order('created_at', { ascending: false })
    .limit(80);
  if (error) {
    res.status(500).json({ error: 'Erro ao buscar comunidade.' });
    return;
  }
  // Buscar emails do auth.users
  const userIds = (data || []).map(u => u.user_id);
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const emailMap = new Map(authUsers?.users?.map(u => [u.id, u.email]) || []);
  
  const users = (data || []).map(u => ({
    id: u.user_id,
    name: u.name,
    email: emailMap.get(u.user_id) || '',
    role: u.role,
    created_at: u.created_at,
    tinder_mentor_profiles: u.tinder_mentor_profiles
  }));
  
  res.json({ users });
});

router.get('/feed/expert', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('user_roles')
    .select('user_id, name, role, created_at, tinder_mentor_profiles(*), tinder_expert_profiles(*)')
    .eq('role', 'MENTORADO')
    .neq('user_id', req.user!.id)
    .order('created_at', { ascending: false })
    .limit(80);
  if (error) {
    res.status(500).json({ error: 'Erro ao buscar feed expert/coprodutor.' });
    return;
  }
  const filtered = (data || []).filter((u: any) => {
    const e = Array.isArray(u.tinder_expert_profiles) ? u.tinder_expert_profiles[0] : u.tinder_expert_profiles;
    return !!(e?.is_expert || e?.is_coproducer);
  });
  res.json({ users: filtered });
});

// Services
router.get('/services', async (req: Request, res: Response): Promise<void> => {
  const supabase = getSupabase();
  const { specialty, certification, city, query } = req.query;
  let q = supabase
    .from('tinder_service_profiles')
    .select('*, users(id, name, email, role)')
    .order('rating_avg', { ascending: false })
    .order('rating_count', { ascending: false });

  if (specialty) q = q.eq('specialty', cleanString(specialty, 60));
  if (certification) q = q.eq('certification', cleanString(certification, 100));
  if (city) q = q.ilike('city', `%${cleanString(city, 120)}%`);
  if (query) q = q.or(`bio.ilike.%${cleanString(query, 120)}%,experience.ilike.%${cleanString(query, 120)}%`);

  const { data, error } = await q.limit(120);
  if (error) {
    res.status(500).json({ error: 'Erro ao buscar prestadores.' });
    return;
  }
  res.json({ services: data || [] });
});

router.get('/services/:id', async (req: Request, res: Response): Promise<void> => {
  const profileId = toPositiveInt(req.params.id);
  if (!profileId) {
    res.status(400).json({ error: 'ID inválido.' });
    return;
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tinder_service_profiles')
    .select('*, users(id, name, email, role)')
    .eq('id', profileId)
    .single();
  if (error || !data) {
    res.status(404).json({ error: 'Prestador não encontrado.' });
    return;
  }
  res.json({ service: data });
});

router.get('/services/:id/reviews', async (req: Request, res: Response): Promise<void> => {
  const profileId = toPositiveInt(req.params.id);
  if (!profileId) {
    res.status(400).json({ error: 'ID inválido.' });
    return;
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tinder_reviews')
    .select('*, users!tinder_reviews_reviewer_id_fkey(id, name)')
    .eq('service_profile_id', profileId)
    .order('created_at', { ascending: false });
  if (error) {
    res.status(500).json({ error: 'Erro ao buscar avaliações.' });
    return;
  }
  res.json({ reviews: data || [] });
});

router.post('/services/:id/reviews', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  const profileId = toPositiveInt(req.params.id);
  const rating = toRating(req.body.rating);
  if (!profileId || !rating) {
    res.status(400).json({ error: 'Dados inválidos para avaliação.' });
    return;
  }
  const supabase = getSupabase();
  const payload = {
    reviewer_id: req.user!.id,
    service_profile_id: profileId,
    rating,
    comment: cleanString(req.body.comment, 2000)
  };
  const { error } = await supabase.from('tinder_reviews').insert(payload);
  if (error) {
    res.status(500).json({ error: 'Erro ao salvar avaliação.' });
    return;
  }
  const { data: agg } = await supabase
    .from('tinder_reviews')
    .select('rating')
    .eq('service_profile_id', profileId);
  const ratings = (agg || []).map((r: any) => Number(r.rating)).filter((n: number) => Number.isFinite(n));
  const avg = ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
  await supabase
    .from('tinder_service_profiles')
    .update({ rating_avg: avg, rating_count: ratings.length, updated_at: new Date().toISOString() })
    .eq('id', profileId);

  await logAction(req.user!.id, 'TINDER_REVIEW_CREATED', { profileId, rating });
  res.json({ ok: true });
});

// Interest / match
router.post('/interest', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  const toUserId = isValidUUID(req.body.toUserId);
  const type = cleanString(req.body.type, 40) || 'COMUNIDADE';
  if (!toUserId || toUserId === req.user!.id) {
    res.status(400).json({ error: 'Destinatário inválido.' });
    return;
  }
  const supabase = getSupabase();
  const { error: insertError } = await supabase.from('tinder_interests').upsert({
    from_user_id: req.user!.id,
    to_user_id: toUserId,
    type
  }, { onConflict: 'from_user_id,to_user_id,type' });
  if (insertError) {
    res.status(500).json({ error: 'Erro ao registrar interesse.' });
    return;
  }

  const { data: reverse } = await supabase
    .from('tinder_interests')
    .select('id')
    .eq('from_user_id', toUserId)
    .eq('to_user_id', req.user!.id)
    .eq('type', type)
    .maybeSingle();

  let matched = false;
  let matchId: number | null = null;
  if (reverse) {
    const [u1, u2] = normalizeMatchPair(req.user!.id, toUserId);
    const { data: matchData } = await supabase
      .from('tinder_matches')
      .upsert({ user1_id: u1, user2_id: u2, type }, { onConflict: 'user1_id,user2_id,type' })
      .select('id')
      .single();
    matched = true;
    matchId = matchData?.id ?? null;
    await logAction(req.user!.id, 'TINDER_MATCH_CREATED', { user1Id: u1, user2Id: u2, type, matchId });
  }

  await logAction(req.user!.id, 'TINDER_INTEREST_CREATED', { fromUserId: req.user!.id, toUserId, type, matched });
  res.json({ ok: true, matched, matchId });
});

router.get('/matches', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  const type = cleanOptionalString(req.query.type, 40);
  const supabase = getSupabase();
  let q = supabase
    .from('tinder_matches')
    .select('*')
    .or(`user1_id.eq.${req.user!.id},user2_id.eq.${req.user!.id}`)
    .order('created_at', { ascending: false });
  if (type) q = q.eq('type', type);
  const { data, error } = await q;
  if (error) {
    res.status(500).json({ error: 'Erro ao buscar matches.' });
    return;
  }
  res.json({ matches: data || [] });
});

router.post('/favorite', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  const targetUserId = isValidUUID(req.body.targetUserId);
  const type = cleanString(req.body.type, 40) || 'COMUNIDADE';
  if (!targetUserId || targetUserId === req.user!.id) {
    res.status(400).json({ error: 'Favorito inválido.' });
    return;
  }
  const supabase = getSupabase();
  const { error } = await supabase.from('tinder_favorites').upsert({
    user_id: req.user!.id,
    target_user_id: targetUserId,
    type
  }, { onConflict: 'user_id,target_user_id,type' });
  if (error) {
    res.status(500).json({ error: 'Erro ao favoritar.' });
    return;
  }
  await logAction(req.user!.id, 'TINDER_FAVORITE_CREATED', { userId: req.user!.id, targetUserId, type });
  res.json({ ok: true });
});

router.get('/favorites', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  const type = cleanOptionalString(req.query.type, 40);
  const supabase = getSupabase();
  let q = supabase
    .from('tinder_favorites')
    .select('*, users!tinder_favorites_target_user_id_fkey(id,name,email,role)')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false });
  if (type) q = q.eq('type', type);
  const { data, error } = await q;
  if (error) {
    res.status(500).json({ error: 'Erro ao buscar favoritos.' });
    return;
  }
  res.json({ favorites: data || [] });
});

router.delete('/favorite', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  const targetUserId = isValidUUID(req.body.targetUserId ?? req.query.targetUserId);
  const type = cleanString(req.body.type ?? req.query.type, 40) || 'COMUNIDADE';
  if (!targetUserId) {
    res.status(400).json({ error: 'Dados inválidos.' });
    return;
  }
  const supabase = getSupabase();
  await supabase
    .from('tinder_favorites')
    .delete()
    .eq('user_id', req.user!.id)
    .eq('target_user_id', targetUserId)
    .eq('type', type);
  await logAction(req.user!.id, 'TINDER_FAVORITE_REMOVED', { userId: req.user!.id, targetUserId, type });
  res.json({ ok: true });
});

// Public profile
router.get('/users/:id', async (req: Request, res: Response): Promise<void> => {
  const targetId = isValidUUID(req.params.id);
  if (!targetId) {
    res.status(400).json({ error: 'ID inválido. Deve ser um UUID.' });
    return;
  }
  const supabase = getSupabase();
  
  // Buscar role do usuário
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('user_id, name, role, created_at')
    .eq('user_id', targetId)
    .single();
  
  if (roleError || !roleData) {
    res.status(404).json({ error: 'Usuário não encontrado.' });
    return;
  }
  
  // Buscar email do auth.users
  const { data: authUser } = await supabase.auth.admin.getUserById(targetId);
  const user = {
    id: roleData.user_id,
    name: roleData.name || '',
    email: authUser?.user?.email || '',
    role: roleData.role,
    created_at: roleData.created_at
  };
  
  const { data: mentorProfile } = await supabase
    .from('tinder_mentor_profiles')
    .select('*')
    .eq('user_id', targetId)
    .maybeSingle();
  const { data: expertProfile } = await supabase
    .from('tinder_expert_profiles')
    .select('*')
    .eq('user_id', targetId)
    .maybeSingle();
  const { data: serviceProfile } = await supabase
    .from('tinder_service_profiles')
    .select('*')
    .eq('user_id', targetId)
    .maybeSingle();

  const { data: matchRow } = await supabase
    .from('tinder_matches')
    .select('id')
    .or(`and(user1_id.eq.${req.user!.id},user2_id.eq.${targetId}),and(user1_id.eq.${targetId},user2_id.eq.${req.user!.id})`)
    .maybeSingle();

  res.json({
    user,
    mentorProfile,
    expertProfile,
    serviceProfile,
    canSeeWhatsapp: !!matchRow || user.role === 'PRESTADOR'
  });
});

// Jobs - Buscar vagas com filtros
router.get('/jobs', async (req: Request, res: Response): Promise<void> => {
  const supabase = getSupabase();
  const {
    q, // busca textual
    tipo_vaga,
    pretensao_min,
    pretensao_max,
    tipo_contratacao,
    modelo_trabalho,
    habilidades, // JSON string
    page = '1',
    per_page = '20'
  } = req.query;

  let query = supabase
    .from('tinder_jobs')
    .select('*', { count: 'exact' })
    .eq('status', 'OPEN')
    .order('created_at', { ascending: false });

  // Busca textual (nome da vaga, empresa, cidade, descrição)
  if (q) {
    const searchTerm = cleanString(q as string, 200);
    query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
  }

  // Filtro tipo_vaga
  if (tipo_vaga) {
    query = query.eq('model', cleanString(tipo_vaga as string, 60));
  }

  // Filtro pretensão salarial
  if (pretensao_min) {
    const min = Number(pretensao_min);
    if (!isNaN(min)) {
      query = query.gte('value', min);
    }
  }
  if (pretensao_max) {
    const max = Number(pretensao_max);
    if (!isNaN(max)) {
      query = query.lte('value', max);
    }
  }

  // Filtro tipo_contratacao (mapear para campo existente ou adicionar)
  // Por enquanto, vamos usar o campo 'model' se existir, ou criar lógica customizada
  if (tipo_contratacao) {
    // Assumindo que tipo_contratacao pode estar em um campo JSON ou separado
    // Por enquanto, vamos ignorar se não existir na tabela
  }

  // Filtro modelo_trabalho
  if (modelo_trabalho) {
    query = query.ilike('location', `%${cleanString(modelo_trabalho as string, 60)}%`);
  }

  // Filtro habilidades (JSON)
  if (habilidades) {
    try {
      const habilidadesObj = typeof habilidades === 'string' ? JSON.parse(habilidades) : habilidades;
      const specialtyFilters: string[] = [];
      
      // Se copywriter está selecionado, filtrar por specialty = 'COPY'
      if (habilidadesObj.copywriter) {
        specialtyFilters.push('COPY');
      }
      
      // Se trafego_pago tem subcategorias, filtrar por specialty = 'TRAFEGO'
      if (habilidadesObj.trafego_pago && Array.isArray(habilidadesObj.trafego_pago) && habilidadesObj.trafego_pago.length > 0) {
        specialtyFilters.push('TRAFEGO');
      }
      
      // Se automacao_ia está selecionado, filtrar por specialty = 'AUTOMACAO'
      if (habilidadesObj.automacao_ia) {
        specialtyFilters.push('AUTOMACAO');
      }
      
      // Aplicar filtro de specialty se houver habilidades selecionadas
      if (specialtyFilters.length > 0) {
        query = query.in('specialty', specialtyFilters);
      }
    } catch (err) {
      // Ignorar erro de parse JSON
    }
  }

  // Paginação
  const pageNum = Math.max(1, Number(page) || 1);
  const perPageNum = Math.min(100, Math.max(1, Number(per_page) || 20));
  const from = (pageNum - 1) * perPageNum;
  const to = from + perPageNum - 1;

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('[GET /jobs] Erro:', error);
    res.status(500).json({ error: 'Erro ao listar vagas.' });
    return;
  }

  // Buscar nomes dos criadores
  const creatorIds = [...new Set((data || []).map((j: any) => j.creator_id))];
  const creatorMap = new Map<string, string>();
  
  if (creatorIds.length > 0) {
    const { data: creators } = await supabase
      .from('user_roles')
      .select('user_id, name')
      .in('user_id', creatorIds);
    
    (creators || []).forEach((c: any) => {
      creatorMap.set(c.user_id, c.name);
    });
  }

  // Formatar resposta
  const formattedJobs = (data || []).map((job: any) => {
    const creatorName = creatorMap.get(job.creator_id) || 'Não especificado';
    return {
      id: job.id,
      titulo: job.title,
      empresa: creatorName,
      localizacao: job.location || '',
      valor: job.value,
      descricao_resumida: job.description ? job.description.substring(0, 240) : '',
      data_publicacao: job.created_at,
      tipo_contratacao: job.model || '',
      modelo_trabalho: job.location || '',
      beneficios: job.beneficios || '',
      specialty: job.specialty,
      creator_name: creatorName,
      // Campos adicionais para compatibilidade
      title: job.title,
      description: job.description,
      created_at: job.created_at
    };
  });

  res.json({
    jobs: formattedJobs,
    total_vagas: count || 0,
    page: pageNum,
    per_page: perPageNum
  });
});

router.post('/jobs', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  
  // Garantir que userId vem da sessão
  const userId = req.user!.id;
  if (!userId) {
    res.status(401).json({ error: 'Usuário não autenticado.' });
    return;
  }
  
  // Buscar expert_profile automaticamente pelo userId
  const supabase = getSupabase();
  const { data: expertProfile, error: expertError } = await supabase
    .from('tinder_expert_profiles')
    .select('id, is_expert, is_coproducer')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (expertError) {
    console.error('[POST /jobs] Erro ao buscar expert profile:', expertError);
    res.status(500).json({ error: 'Erro ao verificar perfil de expert/coprodutor.' });
    return;
  }
  
  if (!expertProfile || (!expertProfile.is_expert && !expertProfile.is_coproducer)) {
    res.status(400).json({ error: 'Você precisa ser Expert ou Coprodutor para criar vagas. Configure seu perfil primeiro.' });
    return;
  }
  
  const title = cleanString(req.body.title, 180);
  const description = cleanString(req.body.description, 5000);
  if (!title || !description) {
    res.status(400).json({ error: 'Título e descrição são obrigatórios.' });
    return;
  }
  
  // Criar vaga com creator_id da sessão
  const payload = {
    creator_id: userId, // Sempre da sessão
    title,
    description,
    specialty: cleanString(req.body.specialty || '', 60),
    model: cleanString(req.body.model || '', 60),
    value: req.body.value ? Number(req.body.value) : null,
    deadline: cleanOptionalString(req.body.deadline, 20),
    location: cleanString(req.body.location || '', 120),
    status: 'OPEN'
  };
  
  const { data, error } = await supabase.from('tinder_jobs').insert(payload).select('*').single();
  if (error || !data) {
    console.error('[POST /jobs] Erro ao criar vaga:', error);
    res.status(500).json({ error: 'Erro ao criar vaga: ' + (error?.message || 'desconhecido') });
    return;
  }
  await logAction(userId, 'TINDER_JOB_CREATED', { jobId: data.id });
  res.json({ job: data });
});

router.get('/jobs/:id', async (req: Request, res: Response): Promise<void> => {
  const jobId = toPositiveInt(req.params.id);
  if (!jobId) {
    res.status(400).json({ error: 'ID inválido.' });
    return;
  }
  const supabase = getSupabase();
  const { data, error } = await supabase.from('tinder_jobs').select('*').eq('id', jobId).single();
  if (error || !data) {
    res.status(404).json({ error: 'Vaga não encontrada.' });
    return;
  }
  res.json({ job: data });
});

router.post('/jobs/:id/apply', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'PRESTADOR', 'LIDERANCA'])) return;
  const jobId = toPositiveInt(req.params.id);
  if (!jobId) {
    res.status(400).json({ error: 'ID inválido.' });
    return;
  }
  const supabase = getSupabase();
  const payload = {
    job_id: jobId,
    candidate_id: req.user!.id,
    message: cleanString(req.body.message, 2000),
    portfolio_link: cleanString(req.body.portfolioLink, 1000)
  };
  const { error } = await supabase
    .from('tinder_applications')
    .upsert(payload, { onConflict: 'job_id,candidate_id' });
  if (error) {
    res.status(500).json({ error: 'Erro ao candidatar-se.' });
    return;
  }
  await logAction(req.user!.id, 'TINDER_JOB_APPLIED', { jobId });
  res.json({ ok: true });
});

// Admin - Criar tabelas do Tinder do Fluxo
router.post('/admin/create-tables', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['LIDERANCA'])) return;
  
  const supabase = getSupabase();
  const results: any[] = [];
  
  try {
    // Criar tinder_mentor_profiles
    const mentorTableSQL = `
      CREATE TABLE IF NOT EXISTS tinder_mentor_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        photo_url TEXT DEFAULT '',
        city TEXT DEFAULT '',
        instagram TEXT DEFAULT '',
        niche TEXT DEFAULT '',
        nivel_fluxo TEXT DEFAULT '',
        bio TEXT DEFAULT '',
        whatsapp TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    const { error: mentorError } = await supabase.rpc('exec_sql', { sql: mentorTableSQL });
    if (mentorError) {
      // Tentar verificar se a tabela já existe
      const { error: checkError } = await supabase.from('tinder_mentor_profiles').select('id').limit(1);
      if (checkError && checkError.message?.includes('does not exist')) {
        results.push({ table: 'tinder_mentor_profiles', status: 'error', message: mentorError.message });
      } else {
        results.push({ table: 'tinder_mentor_profiles', status: 'exists' });
      }
    } else {
      results.push({ table: 'tinder_mentor_profiles', status: 'created' });
    }
    
    // Criar tinder_expert_profiles
    const expertTableSQL = `
      CREATE TABLE IF NOT EXISTS tinder_expert_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        is_expert BOOLEAN DEFAULT FALSE,
        is_coproducer BOOLEAN DEFAULT FALSE,
        goal_text TEXT DEFAULT '',
        search_bio TEXT DEFAULT '',
        preferences_json JSONB DEFAULT '{}'::JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    const { error: expertError } = await supabase.rpc('exec_sql', { sql: expertTableSQL });
    if (expertError) {
      const { error: checkError } = await supabase.from('tinder_expert_profiles').select('id').limit(1);
      if (checkError && checkError.message?.includes('does not exist')) {
        results.push({ table: 'tinder_expert_profiles', status: 'error', message: expertError.message });
      } else {
        results.push({ table: 'tinder_expert_profiles', status: 'exists' });
      }
    } else {
      results.push({ table: 'tinder_expert_profiles', status: 'created' });
    }
    
    // Criar tinder_service_profiles
    const serviceTableSQL = `
      CREATE TABLE IF NOT EXISTS tinder_service_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        photo_url TEXT DEFAULT '',
        city TEXT DEFAULT '',
        instagram TEXT DEFAULT '',
        whatsapp TEXT DEFAULT '',
        specialty TEXT DEFAULT '',
        certification TEXT DEFAULT '',
        portfolio TEXT DEFAULT '',
        experience TEXT DEFAULT '',
        bio TEXT DEFAULT '',
        rating_avg REAL DEFAULT 0,
        rating_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    const { error: serviceError } = await supabase.rpc('exec_sql', { sql: serviceTableSQL });
    if (serviceError) {
      const { error: checkError } = await supabase.from('tinder_service_profiles').select('id').limit(1);
      if (checkError && checkError.message?.includes('does not exist')) {
        results.push({ table: 'tinder_service_profiles', status: 'error', message: serviceError.message });
      } else {
        results.push({ table: 'tinder_service_profiles', status: 'exists' });
      }
    } else {
      results.push({ table: 'tinder_service_profiles', status: 'created' });
    }
    
    // Como o Supabase não permite execução direta de SQL via RPC sem função customizada,
    // vamos tentar uma abordagem diferente: verificar e criar via queries diretas
    // Se as tabelas não existem, vamos retornar instruções
    
    const allExist = results.every(r => r.status === 'exists' || r.status === 'created');
    
    if (!allExist) {
      res.status(200).json({
        success: false,
        message: 'Não foi possível criar as tabelas automaticamente. Execute o script SQL manualmente no Supabase Dashboard.',
        results,
        instructions: 'Acesse o Supabase Dashboard > SQL Editor e execute o conteúdo do arquivo create-tinder-tables.sql'
      });
    } else {
      res.json({
        success: true,
        message: 'Tabelas verificadas/criadas com sucesso',
        results
      });
    }
  } catch (err: any) {
    console.error('[POST /admin/create-tables] Erro:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Erro ao criar tabelas',
      results,
      instructions: 'Execute o script SQL manualmente no Supabase Dashboard usando o arquivo create-tinder-tables.sql'
    });
  }
});

// Admin
router.get('/admin/dashboard', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['LIDERANCA'])) return;
  const supabase = getSupabase();
  const [
    mentorProfiles,
    serviceProfiles,
    interests,
    matches,
    jobs,
    applications,
    reviews
  ] = await Promise.all([
    supabase.from('tinder_mentor_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('tinder_service_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('tinder_interests').select('id', { count: 'exact', head: true }),
    supabase.from('tinder_matches').select('id', { count: 'exact', head: true }),
    supabase.from('tinder_jobs').select('id,status'),
    supabase.from('tinder_applications').select('id', { count: 'exact', head: true }),
    supabase.from('tinder_reviews').select('id', { count: 'exact', head: true })
  ]);

  const jobRows = jobs.data || [];
  res.json({
    kpis: {
      mentorProfiles: mentorProfiles.count || 0,
      serviceProfiles: serviceProfiles.count || 0,
      interests: interests.count || 0,
      matches: matches.count || 0,
      jobsOpen: jobRows.filter((j: any) => j.status === 'OPEN').length,
      jobsClosed: jobRows.filter((j: any) => j.status === 'CLOSED').length,
      applications: applications.count || 0,
      reviews: reviews.count || 0
    }
  });
});

router.get('/admin/users', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['LIDERANCA'])) return;
  const q = cleanOptionalString(req.query.q, 120);
  const role = cleanOptionalString(req.query.role, 20);
  const supabase = getSupabase();
  let query = supabase.from('user_roles').select('user_id,name,role,created_at').order('created_at', { ascending: false });
  if (q) query = query.ilike('name', `%${q}%`);
  if (role) query = query.eq('role', role);
  const { data, error } = await query.limit(200);
  if (error) {
    res.status(500).json({ error: 'Erro ao listar usuários.' });
    return;
  }
  
  // Buscar emails do auth.users
  const userIds = (data || []).map((u: any) => u.user_id);
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const emailMap = new Map(authUsers?.users?.map((u: any) => [u.id, u.email]) || []);
  
  const users = (data || []).map((u: any) => ({
    id: u.user_id,
    name: u.name,
    email: emailMap.get(u.user_id) || '',
    role: u.role,
    created_at: u.created_at
  }));
  
  res.json({ users });
});

router.post('/admin/ban', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['LIDERANCA'])) return;
  const userId = isValidUUID(req.body.userId);
  const banned = !!req.body.banned;
  if (!userId) {
    res.status(400).json({ error: 'ID inválido.' });
    return;
  }
  // Neste projeto ainda não existe coluna de bloqueio dedicada.
  // Persistimos evento para trilha administrativa sem alterar role global.
  await logAction(req.user!.id, 'TINDER_ADMIN_BAN_TOGGLE', { userId, banned });
  res.json({ ok: true, warning: 'Ação registrada em log. Bloqueio persistente requer coluna/fluxo de banimento global.' });
});

router.get('/admin/jobs', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['LIDERANCA'])) return;
  const supabase = getSupabase();
  const { data, error } = await supabase.from('tinder_jobs').select('*').order('created_at', { ascending: false }).limit(300);
  if (error) {
    res.status(500).json({ error: 'Erro ao listar vagas.' });
    return;
  }
  res.json({ jobs: data || [] });
});

router.post('/admin/jobs/close', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['LIDERANCA'])) return;
  const jobId = toPositiveInt(req.body.jobId);
  if (!jobId) {
    res.status(400).json({ error: 'ID inválido.' });
    return;
  }
  const supabase = getSupabase();
  await supabase.from('tinder_jobs').update({ status: 'CLOSED' }).eq('id', jobId);
  await logAction(req.user!.id, 'TINDER_JOB_CLOSED', { jobId });
  res.json({ ok: true });
});

router.get('/admin/reviews', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['LIDERANCA'])) return;
  const supabase = getSupabase();
  const { data, error } = await supabase.from('tinder_reviews').select('*').order('created_at', { ascending: false }).limit(300);
  if (error) {
    res.status(500).json({ error: 'Erro ao listar avaliações.' });
    return;
  }
  res.json({ reviews: data || [] });
});

router.delete('/admin/reviews/:id', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['LIDERANCA'])) return;
  const reviewId = toPositiveInt(req.params.id);
  if (!reviewId) {
    res.status(400).json({ error: 'ID inválido.' });
    return;
  }
  const supabase = getSupabase();
  await supabase.from('tinder_reviews').delete().eq('id', reviewId);
  await logAction(req.user!.id, 'TINDER_REVIEW_DELETED', { reviewId });
  res.json({ ok: true });
});

router.get('/admin/logs', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['LIDERANCA'])) return;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tinder_do_fluxo_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) {
    res.status(500).json({ error: 'Erro ao listar logs.' });
    return;
  }
  res.json({ logs: data || [] });
});

export default router;
