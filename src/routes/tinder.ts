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

function toRating(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n < 1 || n > 5) return null;
  return Math.round(n);
}

function normalizeMatchPair(a: number, b: number): [number, number] {
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

async function logAction(actorUserId: number | null, action: string, meta: Record<string, unknown> = {}): Promise<void> {
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
      .from('users')
      .update({ has_seen_tinder_do_fluxo_tutorial: true })
      .eq('id', req.user!.id);

    await logAction(req.user!.id, 'TINDER_TUTORIAL_SEEN', { userId: req.user!.id });
    res.json({ ok: true });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Erro ao atualizar status do tutorial.' });
  }
});

// Mentor profile
router.get('/mentor-profile', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tinder_mentor_profiles')
    .select('*')
    .eq('user_id', req.user!.id)
    .maybeSingle();
  if (error) {
    res.status(500).json({ error: 'Erro ao buscar perfil.' });
    return;
  }
  res.json({ profile: data });
});

router.post('/mentor-profile', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  const supabase = getSupabase();
  const payload = {
    user_id: req.user!.id,
    photo_url: cleanString(req.body.photoUrl, 1000),
    city: cleanString(req.body.city, 120),
    instagram: cleanString(req.body.instagram, 120),
    niche: cleanString(req.body.niche, 120),
    nivel_fluxo: cleanString(req.body.nivelFluxo, 50),
    bio: cleanString(req.body.bio, 2000),
    whatsapp: cleanString(req.body.whatsapp, 40),
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase
    .from('tinder_mentor_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single();
  if (error) {
    res.status(500).json({ error: 'Erro ao salvar perfil.' });
    return;
  }
  await logAction(req.user!.id, 'TINDER_MENTOR_PROFILE_UPSERT', { userId: req.user!.id });
  res.json({ profile: data });
});

// Expert profile
router.get('/expert-profile', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tinder_expert_profiles')
    .select('*')
    .eq('user_id', req.user!.id)
    .maybeSingle();
  if (error) {
    res.status(500).json({ error: 'Erro ao buscar perfil expert/coprodutor.' });
    return;
  }
  res.json({ profile: data });
});

router.post('/expert-profile', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  
  // Validação: prestador não pode ser expert/coprodutor
  if (req.user!.role === 'PRESTADOR') {
    res.status(403).json({ error: 'Prestadores de serviço não podem ser experts/coprodutores.' });
    return;
  }
  
  const supabase = getSupabase();
  const payload = {
    user_id: req.user!.id,
    is_expert: !!req.body.isExpert,
    is_coproducer: !!req.body.isCoproducer,
    goal_text: cleanString(req.body.goalText, 400),
    search_bio: cleanString(req.body.searchBio, 2000),
    preferences_json: req.body.preferencesJson && typeof req.body.preferencesJson === 'object' ? req.body.preferencesJson : {},
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase
    .from('tinder_expert_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single();
  if (error) {
    res.status(500).json({ error: 'Erro ao salvar perfil expert/coprodutor.' });
    return;
  }
  await logAction(req.user!.id, 'TINDER_EXPERT_PROFILE_UPSERT', { userId: req.user!.id });
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
  
  // Validação: expert/coprodutor não pode ser prestador
  const supabase = getSupabase();
  const { data: expertProfile } = await supabase
    .from('tinder_expert_profiles')
    .select('is_expert, is_coproducer')
    .eq('user_id', req.user!.id)
    .maybeSingle();
  
  if (expertProfile && (expertProfile.is_expert || expertProfile.is_coproducer)) {
    res.status(403).json({ error: 'Experts/coprodutores não podem ser prestadores de serviço.' });
    return;
  }
  
  const payload = {
    user_id: req.user!.id,
    photo_url: cleanString(req.body.photoUrl, 1000),
    city: cleanString(req.body.city, 120),
    instagram: cleanString(req.body.instagram, 120),
    whatsapp: cleanString(req.body.whatsapp, 40),
    specialty: cleanString(req.body.specialty, 60),
    certification: cleanString(req.body.certification, 100),
    portfolio: cleanString(req.body.portfolio, 1000),
    experience: cleanString(req.body.experience, 2000),
    bio: cleanString(req.body.bio, 2000),
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase
    .from('tinder_service_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single();
  if (error) {
    res.status(500).json({ error: 'Erro ao salvar perfil de prestador.' });
    return;
  }
  await logAction(req.user!.id, 'TINDER_SERVICE_PROFILE_UPSERT', { userId: req.user!.id });
  res.json({ profile: data });
});

// Feeds
router.get('/feed/comunidade', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, created_at, tinder_mentor_profiles(*)')
    .eq('role', 'MENTORADO')
    .neq('id', req.user!.id)
    .order('id', { ascending: false })
    .limit(80);
  if (error) {
    res.status(500).json({ error: 'Erro ao buscar comunidade.' });
    return;
  }
  res.json({ users: data || [] });
});

router.get('/feed/expert', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, created_at, tinder_mentor_profiles(*), tinder_expert_profiles(*)')
    .eq('role', 'MENTORADO')
    .neq('id', req.user!.id)
    .order('id', { ascending: false })
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
  const toUserId = toPositiveInt(req.body.toUserId);
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
  const targetUserId = toPositiveInt(req.body.targetUserId);
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
  const targetUserId = toPositiveInt(req.body.targetUserId ?? req.query.targetUserId);
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
  const targetId = toPositiveInt(req.params.id);
  if (!targetId) {
    res.status(400).json({ error: 'ID inválido.' });
    return;
  }
  const supabase = getSupabase();
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, role, created_at')
    .eq('id', targetId)
    .single();
  if (error || !user) {
    res.status(404).json({ error: 'Usuário não encontrado.' });
    return;
  }
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

// Jobs
router.get('/jobs', async (req: Request, res: Response): Promise<void> => {
  const supabase = getSupabase();
  const { specialty, query } = req.query;
  let q = supabase
    .from('tinder_jobs')
    .select('*')
    .order('created_at', { ascending: false });
  if (specialty) q = q.eq('specialty', cleanString(specialty, 60));
  if (query) q = q.or(`title.ilike.%${cleanString(query, 120)}%,description.ilike.%${cleanString(query, 120)}%`);
  const { data, error } = await q.limit(120);
  if (error) {
    res.status(500).json({ error: 'Erro ao listar vagas.' });
    return;
  }
  res.json({ jobs: data || [] });
});

router.post('/jobs', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  
  // Verificar se o usuário é expert/coprodutor
  const supabase = getSupabase();
  const { data: expertProfile } = await supabase
    .from('tinder_expert_profiles')
    .select('is_expert, is_coproducer')
    .eq('user_id', req.user!.id)
    .maybeSingle();
  
  if (!expertProfile || (!expertProfile.is_expert && !expertProfile.is_coproducer)) {
    res.status(403).json({ error: 'Apenas experts e coprodutores podem criar vagas.' });
    return;
  }
  
  const title = cleanString(req.body.title, 180);
  const description = cleanString(req.body.description, 5000);
  if (!title || !description) {
    res.status(400).json({ error: 'Título e descrição são obrigatórios.' });
    return;
  }
  const payload = {
    creator_id: req.user!.id,
    title,
    description,
    specialty: cleanString(req.body.specialty, 60),
    model: cleanString(req.body.model, 60),
    value: req.body.value ? Number(req.body.value) : null,
    deadline: cleanOptionalString(req.body.deadline, 20),
    location: cleanString(req.body.location, 120),
    status: 'OPEN'
  };
  const { data, error } = await supabase.from('tinder_jobs').insert(payload).select('*').single();
  if (error || !data) {
    res.status(500).json({ error: 'Erro ao criar vaga.' });
    return;
  }
  await logAction(req.user!.id, 'TINDER_JOB_CREATED', { jobId: data.id });
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
  let query = supabase.from('users').select('id,name,email,role,created_at').order('created_at', { ascending: false });
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
  if (role) query = query.eq('role', role);
  const { data, error } = await query.limit(200);
  if (error) {
    res.status(500).json({ error: 'Erro ao listar usuários.' });
    return;
  }
  res.json({ users: data || [] });
});

router.post('/admin/ban', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['LIDERANCA'])) return;
  const userId = toPositiveInt(req.body.userId);
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
