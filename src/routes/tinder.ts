import { Router, Request, Response } from 'express';
import multer from 'multer';
import { getSupabase } from '../db/database';
import { requireAuth } from '../middleware/auth';
import { ProfileService } from '../services/profile.service';

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

// Configurar multer para upload de arquivos (temporário, será usado quando implementar upload)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

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

// Check if profile exists (for MENTORADO and PRESTADOR)
router.get('/profile-check', async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }

  try {
  const userId = req.user.id;
  const role = req.user.role;
  const supabase = getSupabase();

  // LIDERANCA doesn't need a profile
  if (role === 'LIDERANCA') {
    res.json({ hasProfile: true, profileRequired: false });
    return;
  }

  // MENTORADO needs tinder_mentor_profiles
  if (role === 'MENTORADO') {
    const { data, error } = await supabase
      .from('tinder_mentor_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('[GET /profile-check] Erro ao verificar perfil mentor:', error);
        res.status(500).json({ 
          error: 'Erro ao verificar perfil.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      return;
    }
    
    res.json({ hasProfile: !!data, profileRequired: true });
    return;
  }

  // PRESTADOR needs tinder_service_profiles
  if (role === 'PRESTADOR') {
    const { data, error } = await supabase
      .from('tinder_service_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('[GET /profile-check] Erro ao verificar perfil prestador:', error);
        res.status(500).json({ 
          error: 'Erro ao verificar perfil.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      return;
    }
    
    res.json({ hasProfile: !!data, profileRequired: true });
    return;
  }

  res.json({ hasProfile: false, profileRequired: false });
  } catch (err: any) {
    console.error('[GET /profile-check] Erro geral:', err);
    res.status(500).json({ 
      error: 'Erro ao verificar perfil.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
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
    headline: cleanString(req.body.headline || '', 200),
    anos_experiencia: req.body.anosExperiencia ? parseInt(req.body.anosExperiencia, 10) : 0,
    horas_semanais: req.body.horasSemanais ? parseInt(req.body.horasSemanais, 10) : 0,
    disponivel: req.body.disponivel !== undefined ? !!req.body.disponivel : true,
    idiomas: Array.isArray(req.body.idiomas) ? req.body.idiomas : [],
    modelo_trabalho: ['remoto', 'hibrido', 'presencial'].includes(req.body.modeloTrabalho) ? req.body.modeloTrabalho : 'remoto',
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
  
  // Se for MENTORADO, garantir que tem perfil expert (criar padrão se não existir)
  if (req.user!.role === 'MENTORADO') {
    // Verificar se já tem campos de Expert/Coprodutor em tinder_mentor_profiles
    const { data: existingMentor } = await supabase
      .from('tinder_mentor_profiles')
      .select('is_expert, is_coproducer')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!existingMentor || (existingMentor.is_expert === null && existingMentor.is_coproducer === null)) {
      console.log('[POST /mentor-profile] Criando perfil expert padrão para MENTORADO');
      await supabase.from('tinder_mentor_profiles').update({
        is_expert: true,
        is_coproducer: true,
        goal_text: 'Objetivo: escalar meu negócio e criar parcerias estratégicas',
        search_bio: 'Busco parcerias estratégicas e oportunidades de coprodução para escalar.',
        preferences_json: {},
        updated_at: new Date().toISOString()
      }).eq('user_id', userId);
    }
  }
  
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
  // Buscar campos de Expert/Coprodutor de tinder_mentor_profiles
  const { data, error } = await supabase
    .from('tinder_mentor_profiles')
    .select('is_expert, is_coproducer, goal_text, search_bio, preferences_json')
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
  
  // VALIDAÇÃO: Expert/Coprodutor é obrigatório para MENTORADOS
  if (req.user!.role === 'MENTORADO' && !req.body.isExpert && !req.body.isCoproducer) {
    res.status(400).json({ error: 'Você deve selecionar pelo menos uma opção: Expert OU Coprodutor (ou ambos).' });
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
    headline: cleanString(req.body.headline || '', 200),
    anos_experiencia: req.body.anosExperiencia ? parseInt(req.body.anosExperiencia, 10) : 0,
    horas_semanais: req.body.horasSemanais ? parseInt(req.body.horasSemanais, 10) : 0,
    disponivel: req.body.disponivel !== undefined ? !!req.body.disponivel : true,
    idiomas: Array.isArray(req.body.idiomas) ? req.body.idiomas : [],
    modelo_trabalho: ['remoto', 'hibrido', 'presencial'].includes(req.body.modeloTrabalho) ? req.body.modeloTrabalho : 'remoto',
    updated_at: new Date().toISOString()
  };
  
  console.log('[POST /expert-profile] Payload:', payload);
  // Salvar em tinder_mentor_profiles (campos unificados)
  const { data, error } = await supabase
    .from('tinder_mentor_profiles')
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
    headline: cleanString(req.body.headline || '', 200),
    anos_experiencia: req.body.anosExperiencia ? parseInt(req.body.anosExperiencia, 10) : 0,
    horas_semanais: req.body.horasSemanais ? parseInt(req.body.horasSemanais, 10) : 0,
    disponivel: req.body.disponivel !== undefined ? !!req.body.disponivel : true,
    idiomas: Array.isArray(req.body.idiomas) ? req.body.idiomas : [],
    modelo_trabalho: ['remoto', 'hibrido', 'presencial'].includes(req.body.modeloTrabalho) ? req.body.modeloTrabalho : 'remoto',
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
  try {
    const supabase = getSupabase();
    console.log('[Feed Comunidade] Iniciando busca...');
    
    // Buscar MENTORADOS primeiro (sem joins para evitar problemas de RLS)
    const { data: mentorados, error: mentoradosError } = await supabase
      .from('user_roles')
      .select('user_id, name, role, created_at')
      .eq('role', 'MENTORADO')
      .neq('user_id', req.user!.id)
      .order('created_at', { ascending: false })
      .limit(80);
    
    console.log('[Feed Comunidade] Query mentorados:', { 
      dataCount: mentorados?.length || 0, 
      error: mentoradosError,
      errorCode: mentoradosError?.code,
      errorMessage: mentoradosError?.message
    });
    
    if (mentoradosError) {
      console.error('[Feed Comunidade] Erro na query mentorados:', mentoradosError);
      res.status(500).json({ 
        error: 'Erro ao buscar comunidade.',
        details: process.env.NODE_ENV === 'development' ? mentoradosError.message : undefined,
        code: mentoradosError.code
      });
      return;
    }
    
    // Buscar perfis mentor separadamente
    const userIds = (mentorados || []).map((u: any) => u.user_id);
    console.log('[Feed Comunidade] Buscando perfis mentor para', userIds.length, 'usuários');
    
    const { data: mentorProfiles, error: mentorError } = await supabase
      .from('tinder_mentor_profiles')
      .select('*')
      .in('user_id', userIds);
    
    if (mentorError) {
      console.error('[Feed Comunidade] Erro ao buscar mentor profiles:', mentorError);
    }
    
    // Buscar emails do auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('[Feed Comunidade] Erro ao buscar auth.users:', authError);
    }
    
    const emailMap = new Map(authUsers?.users?.map(u => [u.id, u.email]) || []);
    const mentorMap = new Map((mentorProfiles || []).map((mp: any) => [mp.user_id, mp]));
    
    // Combinar dados - apenas quem tem perfil mentor
    const users = (mentorados || [])
      .filter((u: any) => mentorMap.has(u.user_id)) // Apenas quem tem perfil mentor
      .map((u: any) => ({
        id: u.user_id,
        name: u.name,
        email: emailMap.get(u.user_id) || '',
        role: u.role,
        created_at: u.created_at,
        tinder_mentor_profiles: mentorMap.get(u.user_id) || null
      }));
    
    console.log('[Feed Comunidade] Retornando', users.length, 'usuários');
    res.json({ users });
  } catch (err: any) {
    console.error('[Feed Comunidade] Erro geral:', err);
    console.error('[Feed Comunidade] Stack:', err?.stack);
    res.status(500).json({ 
      error: 'Erro interno.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

router.get('/feed/expert', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  try {
    const supabase = getSupabase();
    const searchQuery = cleanString((req.query.q ?? req.query.search) as string, 200);
    const typeFilter = cleanOptionalString(req.query.type, 20);
    const tipoPerfil = req.query.tipo_perfil ? String(req.query.tipo_perfil).split(',') : [];
    const cities = req.query.city ? (Array.isArray(req.query.city) ? req.query.city : [req.query.city]).map(c => cleanString(String(c), 120)) : [];
    const smartOrdering = req.query.smart_ordering === 'true';
    
    console.log('[Feed Expert] Iniciando busca...', { searchQuery, typeFilter, tipoPerfil, cities, smartOrdering });
    
    let mentoradosQuery = supabase
      .from('user_roles')
      .select('user_id, name, role, created_at')
      .eq('role', 'MENTORADO')
      .neq('user_id', req.user!.id);
    
    if (searchQuery) {
      mentoradosQuery = mentoradosQuery.ilike('name', `%${searchQuery}%`);
    }
    
    const { data: mentorados, error: mentoradosError } = await mentoradosQuery
      .order('created_at', { ascending: false })
      .limit(80);
    
    if (mentoradosError) {
      console.error('[Feed Expert] Erro na query mentorados:', mentoradosError);
      res.status(500).json({ 
        error: 'Erro ao buscar feed expert/coprodutor.',
        details: process.env.NODE_ENV === 'development' ? mentoradosError.message : undefined,
        code: mentoradosError.code
      });
      return;
    }
    
    const userIds = (mentorados || []).map((u: any) => u.user_id);
    
    let mentorProfilesQuery = supabase
      .from('tinder_mentor_profiles')
      .select('*')
      .in('user_id', userIds);
    
    // Aplicar filtro de cidade
    if (cities.length > 0) {
      mentorProfilesQuery = mentorProfilesQuery.or(cities.map(c => `city.ilike.%${c}%`).join(','));
    }
    
    const { data: mentorProfiles, error: mentorError } = await mentorProfilesQuery;
    
    if (mentorError) {
      console.error('[Feed Expert] Erro ao buscar mentor profiles:', mentorError);
      res.status(500).json({ 
        error: 'Erro ao buscar perfis.',
        details: process.env.NODE_ENV === 'development' ? mentorError.message : undefined
      });
      return;
    }
    
    // Criar map para facilitar lookup (campos de Expert/Coprodutor agora estão em tinder_mentor_profiles)
    const mentorMap = new Map((mentorProfiles || []).map((mp: any) => [mp.user_id, mp]));
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) console.error('[Feed Expert] Erro ao buscar auth.users:', authError);
    const emailMap = new Map(authUsers?.users?.map(u => [u.id, u.email]) || []);
    
    let users = (mentorados || [])
      .filter((u: any) => mentorMap.has(u.user_id))
      .map((u: any) => {
        const mentorProfile = mentorMap.get(u.user_id);
        // Extrair campos de Expert/Coprodutor do mentor profile
        const expertData = mentorProfile ? {
          is_expert: mentorProfile.is_expert || false,
          is_coproducer: mentorProfile.is_coproducer || false,
          goal_text: mentorProfile.goal_text || '',
          search_bio: mentorProfile.search_bio || '',
          preferences_json: mentorProfile.preferences_json || {}
        } : null;
        
        return {
          id: u.user_id,
          name: u.name,
          email: emailMap.get(u.user_id) || '',
          role: u.role,
          created_at: u.created_at,
          tinder_mentor_profiles: mentorProfile || null,
          tinder_expert_profiles: expertData // Manter compatibilidade com código existente
        };
      });
    
    // Filtrar apenas perfis que são Expert OU Coprodutor (mutuamente exclusivos)
    users = users.filter((u: any) => {
      const mp = u.tinder_mentor_profiles;
      if (!mp) return false;
      // Garantir exclusividade: não pode ser ambos
      const isExpert = (mp.is_expert || false) && !(mp.is_coproducer || false);
      const isCoprodutor = (mp.is_coproducer || false) && !(mp.is_expert || false);
      return isExpert || isCoprodutor;
    });
    
    // Aplicar filtro de tipo só quando um único tipo está selecionado (Expert OU Coprodutor)
    // Se ambos estiverem selecionados (ou nenhum), mostrar todos os perfis
    const wantExpert = typeFilter === 'EXPERT' || tipoPerfil.includes('expert');
    const wantCoprodutor = typeFilter === 'COPRODUTOR' || tipoPerfil.includes('coprodutor');
    if (wantExpert && !wantCoprodutor) {
      users = users.filter((u: any) => {
        const mp = u.tinder_mentor_profiles;
        return mp && (mp.is_expert || false) && !(mp.is_coproducer || false);
      });
    } else if (wantCoprodutor && !wantExpert) {
      users = users.filter((u: any) => {
        const mp = u.tinder_mentor_profiles;
        return mp && (mp.is_coproducer || false) && !(mp.is_expert || false);
      });
    }
    
    if (searchQuery) {
      users = users.filter((u: any) => {
        const ep = u.tinder_expert_profiles;
        const goal = (ep?.goal_text || '').toLowerCase();
        const bio = (ep?.search_bio || '').toLowerCase();
        const name = (u.name || '').toLowerCase();
        const q = searchQuery.toLowerCase();
        return name.includes(q) || goal.includes(q) || bio.includes(q);
      });
    }
    
    // Aplicar Smart Ordering se solicitado
    if (smartOrdering && users.length > 0) {
      try {
        const { SmartOrderingService } = await import('../services/smart-ordering.service');
        const currentUserProfile = await supabase
          .from('tinder_mentor_profiles')
          .select('*')
          .eq('user_id', req.user!.id)
          .maybeSingle();
        
        const orderingService = new SmartOrderingService(supabase, req.user!.id);
        users = (await orderingService.orderProfiles(users, currentUserProfile.data)) as typeof users;
      } catch (err) {
        console.error('[Feed Expert] Erro ao aplicar smart ordering:', err);
        // Continuar sem ordenação inteligente em caso de erro
      }
    }
    
    console.log('[Feed Expert] Retornando', users.length, 'usuários');
    res.json({ users });
  } catch (err: any) {
    console.error('[Feed Expert] Erro geral:', err);
    res.status(500).json({ 
      error: 'Erro interno.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Services
router.get('/services', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();
    const { specialty, certification, city, query, q, tipo_servico, rating_min, modo_trabalho } = req.query;
    const searchQuery = cleanString((q || query) as string, 200);
    const tipoServicoArray = tipo_servico ? String(tipo_servico).split(',').map(s => cleanString(s, 20)) : [];
    const ratingMin = rating_min ? Number(rating_min) : null;
    const modoTrabalhoArray = modo_trabalho ? String(modo_trabalho).split(',').map(m => cleanString(m, 20)) : [];
    
    console.log('[Services] Iniciando busca de prestadores...', { 
      specialty, certification, city, searchQuery, tipoServicoArray, ratingMin, modoTrabalhoArray 
    });
    
    let qry = supabase
      .from('tinder_service_profiles')
      .select('*')
      .order('rating_avg', { ascending: false })
      .order('rating_count', { ascending: false });

    if (specialty) qry = qry.eq('specialty', cleanString(specialty, 60));
    if (certification) qry = qry.eq('certification', cleanString(certification, 100));
    if (city) qry = qry.ilike('city', `%${cleanString(city, 120)}%`);
    if (searchQuery) {
      qry = qry.or(`bio.ilike.%${searchQuery}%,experience.ilike.%${searchQuery}%,specialty.ilike.%${searchQuery}%`);
    }
    if (tipoServicoArray.length > 0) {
      qry = qry.in('specialty', tipoServicoArray);
    }
    if (modoTrabalhoArray.length > 0) {
      qry = qry.in('modo_trabalho', modoTrabalhoArray);
    }

    const { data: services, error } = await qry.limit(120);
    
    console.log('[Services] Query resultado:', { 
      dataCount: services?.length || 0, 
      error: error,
      errorCode: error?.code,
      errorMessage: error?.message,
      errorDetails: error?.details,
      errorHint: error?.hint
    });
    
    if (error) {
      console.error('[Services] Erro na query:', error);
      res.status(500).json({ 
        error: 'Erro ao buscar prestadores.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: error.code
      });
      return;
    }
    
    // Buscar dados dos usuários (user_roles) e emails (auth.users)
    const userIds = (services || []).map((s: any) => s.user_id);
    console.log('[Services] Buscando dados de', userIds.length, 'usuários prestadores');
    
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, name, role')
      .in('user_id', userIds);
    
    if (rolesError) {
      console.error('[Services] Erro ao buscar user_roles:', rolesError);
    }
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('[Services] Erro ao buscar auth.users:', authError);
    }
    
    const userMap = new Map((userRoles || []).map((u: any) => [u.user_id, u]));
    const emailMap = new Map(authUsers?.users?.map(u => [u.id, u.email]) || []);
    
    let servicesWithUsers = (services || []).map((s: any) => {
      const user = userMap.get(s.user_id);
      return {
        ...s,
        users: user ? {
          id: user.user_id,
          name: user.name,
          email: emailMap.get(user.user_id) || '',
          role: user.role
        } : null
      };
    });
    
    // Filtro por rating mínimo (aplicado após buscar dados)
    if (ratingMin !== null) {
      servicesWithUsers = servicesWithUsers.filter((s: any) => (s.rating_avg || 0) >= ratingMin);
    }
    
    // Busca adicional por nome do usuário se houver searchQuery
    if (searchQuery) {
      servicesWithUsers = servicesWithUsers.filter((s: any) => {
        const nameMatch = s.users?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const bioMatch = s.bio?.toLowerCase().includes(searchQuery.toLowerCase());
        const specialtyMatch = s.specialty?.toLowerCase().includes(searchQuery.toLowerCase());
        return nameMatch || bioMatch || specialtyMatch;
      });
    }
    
    console.log('[Services] Retornando', servicesWithUsers.length, 'prestadores');
    res.json({ services: servicesWithUsers });
  } catch (err: any) {
    console.error('[Services] Erro geral:', err);
    console.error('[Services] Stack:', err?.stack);
    res.status(500).json({ 
      error: 'Erro interno.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
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

// Get available cities
router.get('/cities', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tinder_mentor_profiles')
      .select('city')
      .not('city', 'is', null)
      .neq('city', '');
    
    if (error) {
      console.error('[Cities] Erro ao buscar cidades:', error);
      res.status(500).json({ error: 'Erro ao buscar cidades.' });
      return;
    }
    
    const cities = [...new Set((data || []).map((d: any) => d.city).filter(Boolean))].sort();
    res.json({ cities });
  } catch (err: any) {
    console.error('[Cities] Erro geral:', err);
    res.status(500).json({ 
      error: 'Erro interno.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
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
  const { data: rows, error } = await q;
  if (error) {
    res.status(500).json({ error: 'Erro ao buscar matches.' });
    return;
  }
  const matchesList = rows || [];
  const otherUserIds = [...new Set(matchesList.map((m: any) => m.user1_id === req.user!.id ? m.user2_id : m.user1_id))];
  if (otherUserIds.length === 0) {
    res.json({ matches: matchesList.map((m: any) => ({ ...m, otherUser: null })) });
    return;
  }
  const matchIds = matchesList.map((m: any) => m.id);
  const [rolesRes, mentorRes, expertRes, messagesRes] = await Promise.all([
    supabase.from('user_roles').select('user_id, name').in('user_id', otherUserIds),
    supabase.from('tinder_mentor_profiles').select('user_id, city, photo_url, whatsapp').in('user_id', otherUserIds),
    supabase.from('tinder_expert_profiles').select('user_id, goal_text, is_expert, is_coproducer').in('user_id', otherUserIds),
    matchIds.length > 0
      ? supabase.from('tinder_messages').select('match_id, body, created_at, sender_id').in('match_id', matchIds).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as any[] })
  ]);
  const rolesData = rolesRes.data || [];
  const mentorData = mentorRes.data || [];
  const expertData = expertRes.data || [];
  const messagesList = messagesRes.data || [];
  const rolesMap = new Map(rolesData.map((r: any) => [r.user_id, r]));
  const mentorMap = new Map(mentorData.map((m: any) => [m.user_id, m]));
  const expertMap = new Map(expertData.map((e: any) => [e.user_id, e]));
  const lastMessagesMap: Record<number, { body: string; created_at: string; sender_id: string }> = {};
  messagesList.forEach((msg: any) => {
    if (!lastMessagesMap[msg.match_id]) lastMessagesMap[msg.match_id] = msg;
  });
  const getTypeLabel = (ep: any) => {
    if (!ep) return '';
    const parts: string[] = [];
    if (ep.is_expert) parts.push('Expert');
    if (ep.is_coproducer) parts.push('Coprodutor');
    return parts.join(' / ') || '';
  };

  const matches = matchesList.map((m: any) => {
    const otherId = m.user1_id === req.user!.id ? m.user2_id : m.user1_id;
    const role = rolesMap.get(otherId);
    const mentor = mentorMap.get(otherId);
    const expert = expertMap.get(otherId);
    const otherUser = {
      id: otherId,
      name: role?.name || 'Usuário',
      type: getTypeLabel(expert) || m.type,
      goal_text: expert?.goal_text || '',
      city: mentor?.city || '',
      photo_url: mentor?.photo_url || '',
      whatsapp: mentor?.whatsapp || ''
    };
    const lastMsg = lastMessagesMap[m.id];
    return {
      ...m,
      otherUser,
      lastMessage: lastMsg ? lastMsg.body : null,
      lastMessageAt: lastMsg ? lastMsg.created_at : null,
      lastMessageSenderId: lastMsg ? lastMsg.sender_id : null
    };
  });
  res.json({ matches });
});

// Listar mensagens de um match (conversa)
router.get('/matches/:matchId/messages', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  const matchId = toPositiveInt(req.params.matchId);
  if (!matchId) {
    res.status(400).json({ error: 'ID do match inválido.' });
    return;
  }
  const supabase = getSupabase();
  const { data: matchRow, error: matchError } = await supabase
    .from('tinder_matches')
    .select('id, user1_id, user2_id')
    .eq('id', matchId)
    .single();
  if (matchError || !matchRow) {
    res.status(404).json({ error: 'Match não encontrado.' });
    return;
  }
  const userId = req.user!.id;
  if (matchRow.user1_id !== userId && matchRow.user2_id !== userId) {
    res.status(403).json({ error: 'Sem permissão para ver esta conversa.' });
    return;
  }
  const { data: rows, error } = await supabase
    .from('tinder_messages')
    .select('id, match_id, sender_id, body, read_at, created_at')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });
  if (error) {
    res.status(500).json({ error: 'Erro ao buscar mensagens.' });
    return;
  }
  res.json({ messages: rows || [] });
});

// Enviar mensagem em um match
router.post('/matches/:matchId/messages', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  const matchId = toPositiveInt(req.params.matchId);
  const body = cleanString(req.body.body, 10000);
  if (!matchId) {
    res.status(400).json({ error: 'ID do match inválido.' });
    return;
  }
  if (!body) {
    res.status(400).json({ error: 'Mensagem não pode ser vazia.' });
    return;
  }
  const supabase = getSupabase();
  const { data: matchRow, error: matchError } = await supabase
    .from('tinder_matches')
    .select('id, user1_id, user2_id')
    .eq('id', matchId)
    .single();
  if (matchError || !matchRow) {
    res.status(404).json({ error: 'Match não encontrado.' });
    return;
  }
  const userId = req.user!.id;
  if (matchRow.user1_id !== userId && matchRow.user2_id !== userId) {
    res.status(403).json({ error: 'Sem permissão para enviar mensagem nesta conversa.' });
    return;
  }
  const { data: inserted, error: insertError } = await supabase
    .from('tinder_messages')
    .insert({ match_id: matchId, sender_id: userId, body })
    .select('id, match_id, sender_id, body, read_at, created_at')
    .single();
  if (insertError) {
    res.status(500).json({ error: 'Erro ao enviar mensagem.' });
    return;
  }
  res.status(201).json({ message: inserted });
});

// Indicador "digitando" em memória (sem Supabase)
const typingExpires = new Map<string, number>();
const TYPING_TTL_MS = 5000;

function getOtherUserId(matchRow: { user1_id: string; user2_id: string }, currentUserId: string): string {
  return matchRow.user1_id === currentUserId ? matchRow.user2_id : matchRow.user1_id;
}

router.post('/matches/:matchId/typing', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  const matchId = toPositiveInt(req.params.matchId);
  const typing = req.body.typing === true;
  if (!matchId) {
    res.status(400).json({ error: 'ID do match inválido.' });
    return;
  }
  const supabase = getSupabase();
  const { data: matchRow, error: matchError } = await supabase
    .from('tinder_matches')
    .select('id, user1_id, user2_id')
    .eq('id', matchId)
    .single();
  if (matchError || !matchRow) {
    res.status(404).json({ error: 'Match não encontrado.' });
    return;
  }
  const userId = req.user!.id;
  if (matchRow.user1_id !== userId && matchRow.user2_id !== userId) {
    res.status(403).json({ error: 'Sem permissão.' });
    return;
  }
  const key = `${matchId}:${userId}`;
  if (typing) {
    typingExpires.set(key, Date.now() + TYPING_TTL_MS);
  } else {
    typingExpires.delete(key);
  }
  res.json({ ok: true });
});

router.get('/matches/:matchId/typing', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'LIDERANCA'])) return;
  const matchId = toPositiveInt(req.params.matchId);
  if (!matchId) {
    res.status(400).json({ error: 'ID do match inválido.' });
    return;
  }
  const supabase = getSupabase();
  const { data: matchRow, error: matchError } = await supabase
    .from('tinder_matches')
    .select('id, user1_id, user2_id')
    .eq('id', matchId)
    .single();
  if (matchError || !matchRow) {
    res.status(404).json({ error: 'Match não encontrado.' });
    return;
  }
  const userId = req.user!.id;
  if (matchRow.user1_id !== userId && matchRow.user2_id !== userId) {
    res.status(403).json({ error: 'Sem permissão.' });
    return;
  }
  const otherUserId = getOtherUserId(matchRow, userId);
  const key = `${matchId}:${otherUserId}`;
  const expires = typingExpires.get(key);
  const now = Date.now();
  if (expires != null && expires < now) {
    typingExpires.delete(key);
  }
  const typing = expires != null && expires >= now;
  res.json({ typing });
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
  const list = data || [];
  const targetIds = [...new Set(list.map((f: any) => f.target_user_id).filter(Boolean))];
  if (targetIds.length > 0) {
    const { data: roles } = await supabase.from('user_roles').select('user_id, name').in('user_id', targetIds);
    const nameByUserId = new Map((roles || []).map((r: any) => [r.user_id, r.name]));
    list.forEach((f: any) => {
      if (f.users) f.users.name = f.users.name || nameByUserId.get(f.target_user_id) || null;
      else f.users = { id: f.target_user_id, name: nameByUserId.get(f.target_user_id) || null, email: null, role: null };
    });
  }
  res.json({ favorites: list });
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
  
  // Campos de Expert/Coprodutor agora estão em tinder_mentor_profiles
  const expertProfile = mentorProfile ? {
    is_expert: mentorProfile.is_expert || false,
    is_coproducer: mentorProfile.is_coproducer || false,
    goal_text: mentorProfile.goal_text || '',
    search_bio: mentorProfile.search_bio || '',
    preferences_json: mentorProfile.preferences_json || {}
  } : null;
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
    tab = 'abertas', // abertas | encerradas | minhas
    status_filter, // all | open | closed (para tab=minhas: filtrar minhas vagas por status)
    page = '1',
    per_page = '20'
  } = req.query;

  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const tabStr = cleanString(tab as string, 20);

  // Helper: verifica se vaga está "aberta" (pode candidatar)
  const isJobOpen = (j: any) => {
    if (j.status !== 'OPEN') return false;
    if (!j.deadline) return true;
    const d = String(j.deadline).split('T')[0];
    return d >= todayStr;
  };
  // Helper: verifica se vaga está "encerrada"
  const isJobClosed = (j: any) => {
    if (j.status === 'CLOSED') return true;
    if (!j.deadline) return false;
    const d = String(j.deadline).split('T')[0];
    return d < todayStr;
  };

  let query = supabase.from('tinder_jobs').select('*').order('created_at', { ascending: false });

  // Tab: abertas | encerradas | minhas
  if (tabStr === 'minhas' && req.user) {
    query = query.eq('creator_id', req.user.id);
  } else if (tabStr === 'encerradas') {
    // Encerrado = status CLOSED OU (deadline preenchido E deadline < hoje)
    // Usar duas queries e mesclar (PostgREST or+and pode falhar em alguns setups)
    const [closedRes, allOpenRes] = await Promise.all([
      supabase.from('tinder_jobs').select('*').eq('status', 'CLOSED').order('created_at', { ascending: false }),
      supabase.from('tinder_jobs').select('*').eq('status', 'OPEN').order('created_at', { ascending: false })
    ]);
    const closed = closedRes.data || [];
    const pastDeadline = (allOpenRes.data || []).filter((j: any) => isJobClosed(j));
    let merged = [...closed, ...pastDeadline]
      .filter((j: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === j.id) === i)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const searchTerm = q ? cleanString(q as string, 200).toLowerCase() : '';
    if (searchTerm) {
      merged = merged.filter((j: any) =>
        (j.title || '').toLowerCase().includes(searchTerm) ||
        (j.description || '').toLowerCase().includes(searchTerm) ||
        (j.location || '').toLowerCase().includes(searchTerm)
      );
    }
    const total = merged.length;
    const from = (Math.max(1, Number(page) || 1) - 1) * Math.min(100, Math.max(1, Number(per_page) || 20));
    const to = from + Math.min(100, Math.max(1, Number(per_page) || 20)) - 1;
    const paginated = merged.slice(from, to + 1);
    const creatorIds = [...new Set(paginated.map((j: any) => j.creator_id))];
    const { data: creatorData } = await supabase.from('user_roles').select('user_id, name').in('user_id', creatorIds);
    const creatorMap = new Map((creatorData || []).map((c: any) => [c.user_id, c.name]));
    const jobIds = paginated.map((j: any) => j.id);
    let appliedJobIds = new Set<number>();
    if (req.user && jobIds.length > 0) {
      const { data: apps } = await supabase.from('tinder_applications').select('job_id').eq('candidate_id', req.user.id).in('job_id', jobIds);
      appliedJobIds = new Set((apps || []).map((a: any) => a.job_id));
    }
    const jobsWithCreator = paginated.map((j: any) => {
      const creatorName = creatorMap.get(j.creator_id) || 'Não especificado';
      return {
        id: j.id,
        creator_id: j.creator_id,
        title: j.title,
        titulo: j.title,
        empresa: creatorName,
        creator_name: creatorName,
        description: j.description,
        descricao_resumida: j.description ? j.description.substring(0, 240) : '',
        location: j.location,
        localizacao: j.location || '',
        value: j.value,
        valor: j.value,
        created_at: j.created_at,
        data_publicacao: j.created_at,
        model: j.model,
        tipo_contratacao: j.model || '',
        modelo_trabalho: j.location || '',
        specialty: j.specialty,
        status: j.status,
        deadline: j.deadline,
        applied: appliedJobIds.has(j.id)
      };
    });
    res.json({ jobs: jobsWithCreator, total_vagas: total });
    return;
  }
  if (tabStr === 'abertas' || tabStr === 'todas' || tabStr === '') {
    // Todas as vagas abertas (sem filtrar por criador)
    const { data: openJobs, error: openErr } = await query.eq('status', 'OPEN');
    if (openErr) {
      console.error('[GET /jobs] Erro:', openErr);
      res.status(500).json({ error: 'Erro ao listar vagas.' });
      return;
    }
    let data = (openJobs || []).filter((j: any) => isJobOpen(j));

    // Busca textual
    if (q) {
      const st = cleanString(q as string, 200).toLowerCase();
      data = data.filter((j: any) =>
        (j.title || '').toLowerCase().includes(st) ||
        (j.description || '').toLowerCase().includes(st) ||
        (j.location || '').toLowerCase().includes(st)
      );
    }
    if (tipo_vaga) {
      const tv = cleanString(tipo_vaga as string, 60).toLowerCase();
      data = data.filter((j: any) => (j.model || '').toLowerCase() === tv);
    }
    if (pretensao_min) {
      const min = Number(pretensao_min);
      if (!isNaN(min)) data = data.filter((j: any) => (j.value || 0) >= min);
    }
    if (pretensao_max) {
      const max = Number(pretensao_max);
      if (!isNaN(max)) data = data.filter((j: any) => (j.value || 0) <= max);
    }
    if (modelo_trabalho) {
      const mt = cleanString(modelo_trabalho as string, 60).toLowerCase();
      data = data.filter((j: any) => (j.location || '').toLowerCase().includes(mt));
    }
    if (habilidades) {
      try {
        const ho = typeof habilidades === 'string' ? JSON.parse(habilidades) : habilidades;
        const sf: string[] = [];
        if (ho.copywriter) sf.push('COPY');
        if (ho.trafego_pago?.length) sf.push('TRAFEGO');
        if (ho.automacao_ia) sf.push('AUTOMACAO');
        if (sf.length > 0) data = data.filter((j: any) => sf.includes(j.specialty));
      } catch (_) {}
    }

    const count = data.length;
    const pageNum = Math.max(1, Number(page) || 1);
    const perPageNum = Math.min(100, Math.max(1, Number(per_page) || 20));
    const from = (pageNum - 1) * perPageNum;
    data = data.slice(from, from + perPageNum);

    const creatorIds = [...new Set(data.map((j: any) => j.creator_id))];
    const creatorMap = new Map<string, string>();
    if (creatorIds.length > 0) {
      const { data: creators } = await supabase.from('user_roles').select('user_id, name').in('user_id', creatorIds);
      (creators || []).forEach((c: any) => creatorMap.set(c.user_id, c.name));
    }
    let appliedJobIds = new Set<number>();
    if (req.user && data.length > 0) {
      const { data: apps } = await supabase.from('tinder_applications').select('job_id').eq('candidate_id', req.user.id).in('job_id', data.map((j: any) => j.id));
      appliedJobIds = new Set((apps || []).map((a: any) => a.job_id));
    }
    const formattedJobs = data.map((job: any) => {
      const creatorName = creatorMap.get(job.creator_id) || 'Não especificado';
      return {
        id: job.id,
        creator_id: job.creator_id,
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
        applied: appliedJobIds.has(job.id),
        title: job.title,
        description: job.description,
        created_at: job.created_at,
        status: job.status,
        deadline: job.deadline
      };
    });
    res.json({ jobs: formattedJobs, total_vagas: count, page: pageNum, per_page: perPageNum });
    return;
  }

  // minhas: query já tem creator_id, executar
  const { data: myJobs, error: myErr } = await query;
  if (myErr) {
    console.error('[GET /jobs] Erro:', myErr);
    res.status(500).json({ error: 'Erro ao listar vagas.' });
    return;
  }
  let data = myJobs || [];
  const statusFilter = cleanString((status_filter as string) || 'all', 20).toLowerCase();
  if (statusFilter === 'open') data = data.filter((j: any) => isJobOpen(j));
  else if (statusFilter === 'closed') data = data.filter((j: any) => isJobClosed(j));
  if (q) {
    const st = cleanString(q as string, 200).toLowerCase();
    data = data.filter((j: any) =>
      (j.title || '').toLowerCase().includes(st) ||
      (j.description || '').toLowerCase().includes(st) ||
      (j.location || '').toLowerCase().includes(st)
    );
  }
  if (tipo_vaga) {
    const tv = cleanString(tipo_vaga as string, 60).toLowerCase();
    data = data.filter((j: any) => (j.model || '').toLowerCase() === tv);
  }
  if (pretensao_min) {
    const min = Number(pretensao_min);
    if (!isNaN(min)) data = data.filter((j: any) => (j.value || 0) >= min);
  }
  if (pretensao_max) {
    const max = Number(pretensao_max);
    if (!isNaN(max)) data = data.filter((j: any) => (j.value || 0) <= max);
  }
  if (modelo_trabalho) {
    const mt = cleanString(modelo_trabalho as string, 60).toLowerCase();
    data = data.filter((j: any) => (j.location || '').toLowerCase().includes(mt));
  }
  const count = data.length;
  const pageNum = Math.max(1, Number(page) || 1);
  const perPageNum = Math.min(100, Math.max(1, Number(per_page) || 20));
  const from = (pageNum - 1) * perPageNum;
  data = data.slice(from, from + perPageNum);

  // Buscar nomes dos criadores
  const creatorIds = [...new Set(data.map((j: any) => j.creator_id))];
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

  // Verificar se o usuário já se candidatou a cada vaga
  const jobIds = data.map((j: any) => j.id);
  let appliedJobIds = new Set<number>();
  if (req.user && jobIds.length > 0) {
    const { data: apps } = await supabase.from('tinder_applications').select('job_id').eq('candidate_id', req.user.id).in('job_id', jobIds);
    appliedJobIds = new Set((apps || []).map((a: any) => a.job_id));
  }

  // Formatar resposta
  const formattedJobs = data.map((job: any) => {
    const creatorName = creatorMap.get(job.creator_id) || 'Não especificado';
    return {
      id: job.id,
      creator_id: job.creator_id,
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
      applied: appliedJobIds.has(job.id),
      title: job.title,
      description: job.description,
      created_at: job.created_at,
      status: job.status,
      deadline: job.deadline
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
  if (!ensureRoles(req, res, ['MENTORADO', 'PRESTADOR', 'LIDERANCA'])) return;
  
  // Garantir que userId vem da sessão
  const userId = req.user!.id;
  if (!userId) {
    res.status(401).json({ error: 'Usuário não autenticado.' });
    return;
  }
  
  // Verificar role do usuário
  const supabase = getSupabase();
  const { data: userRole, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (roleError) {
    console.error('[POST /jobs] Erro ao buscar role:', roleError);
    res.status(500).json({ error: 'Erro ao verificar perfil do usuário.' });
    return;
  }
  
  // Se for PRESTADOR ou LIDERANCA, pode criar diretamente
  if (userRole?.role === 'PRESTADOR' || userRole?.role === 'LIDERANCA') {
    // Pode criar vaga
  } else if (userRole?.role === 'MENTORADO') {
    // MENTORADO precisa ser expert ou coprodutor
    const { data: mentorProfile, error: mentorError } = await supabase
      .from('tinder_mentor_profiles')
      .select('is_expert, is_coproducer')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (mentorError) {
      console.error('[POST /jobs] Erro ao buscar mentor profile:', mentorError);
      res.status(500).json({ error: 'Erro ao verificar perfil de expert/coprodutor.' });
      return;
    }
    
    if (!mentorProfile || (!mentorProfile.is_expert && !mentorProfile.is_coproducer)) {
      res.status(400).json({ error: 'Você precisa ser Expert ou Coprodutor para criar vagas. Configure seu perfil primeiro.' });
      return;
    }
  } else {
    res.status(403).json({ error: 'Você não tem permissão para criar vagas.' });
    return;
  }
  
  const title = cleanString(req.body.title, 180);
  let description = cleanString(req.body.description, 5000);
  const workingConditions = cleanString(req.body.workingConditions || '', 60);
  if (!title || !description) {
    res.status(400).json({ error: 'Título e descrição são obrigatórios.' });
    return;
  }
  const deadlineRaw = cleanOptionalString(req.body.deadline, 20);
  if (!deadlineRaw) {
    res.status(400).json({ error: 'Data de encerramento da vaga é obrigatória.' });
    return;
  }
  const deadlineMatch = String(deadlineRaw).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const deadline = deadlineMatch ? `${deadlineMatch[1]}-${deadlineMatch[2]}-${deadlineMatch[3]}` : null;
  if (!deadline) {
    res.status(400).json({ error: 'Data de encerramento deve estar no formato AAAA-MM-DD.' });
    return;
  }
  if (workingConditions) {
    description = description + '\n\nCondições de trabalho: ' + workingConditions;
  }
  
  const payload = {
    creator_id: userId,
    title,
    description,
    specialty: cleanString(req.body.specialty || '', 60),
    model: cleanString(req.body.model || '', 60),
    value: req.body.value ? Number(req.body.value) : null,
    deadline,
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

// Buscar candidaturas do usuário (deve vir antes de /jobs/:id)
router.get('/jobs/my-applications', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'PRESTADOR', 'LIDERANCA'])) return;
  
  const userId = req.user!.id;
  const supabase = getSupabase();
  
  const { data: applications, error } = await supabase
    .from('tinder_applications')
    .select(`
      id,
      message,
      portfolio_link,
      created_at,
      tinder_jobs (
        id,
        title,
        description,
        specialty,
        model,
        location,
        value,
        deadline,
        status,
        created_at
      )
    `)
    .eq('candidate_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('[GET /jobs/my-applications] Erro:', error);
    res.status(500).json({ error: 'Erro ao buscar candidaturas.' });
    return;
  }
  
  res.json({ applications: applications || [] });
});

// GET /jobs/:id/applicants - Listar candidatos (apenas criador da vaga)
router.get('/jobs/:id/applicants', async (req: Request, res: Response): Promise<void> => {
  const jobId = toPositiveInt(req.params.id);
  if (!jobId) {
    res.status(400).json({ error: 'ID inválido.' });
    return;
  }
  const supabase = getSupabase();
  const { data: job } = await supabase.from('tinder_jobs').select('creator_id').eq('id', jobId).single();
  if (!job || job.creator_id !== req.user?.id) {
    res.status(403).json({ error: 'Apenas o criador da vaga pode ver os candidatos.' });
    return;
  }
  const { data: applications } = await supabase
    .from('tinder_applications')
    .select('candidate_id, message, portfolio_link, created_at')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });
  if (!applications?.length) {
    res.json({ applicants: [] });
    return;
  }
  const candidateIds = [...new Set(applications.map((a: any) => a.candidate_id))];
  const { data: roles } = await supabase.from('user_roles').select('user_id, name').in('user_id', candidateIds);
  const { data: mentorProfiles } = await supabase.from('tinder_mentor_profiles').select('user_id, whatsapp').in('user_id', candidateIds);
  const { data: serviceProfiles } = await supabase.from('tinder_service_profiles').select('user_id, whatsapp').in('user_id', candidateIds);
  const roleMap = new Map((roles || []).map((r: any) => [r.user_id, r]));
  const mentorMap = new Map((mentorProfiles || []).map((m: any) => [m.user_id, m]));
  const serviceMap = new Map((serviceProfiles || []).map((s: any) => [s.user_id, s]));
  const applicants = applications.map((a: any) => {
    const r = roleMap.get(a.candidate_id);
    const mentor = mentorMap.get(a.candidate_id);
    const service = serviceMap.get(a.candidate_id);
    const whatsapp = mentor?.whatsapp || service?.whatsapp || '';
    return {
      candidate_id: a.candidate_id,
      name: r?.name || 'Sem nome',
      message: a.message,
      portfolio_link: a.portfolio_link,
      whatsapp,
      created_at: a.created_at
    };
  });
  res.json({ applicants });
});

// PATCH /jobs/:id/close - Encerrar vaga (apenas criador)
router.patch('/jobs/:id/close', async (req: Request, res: Response): Promise<void> => {
  const jobId = toPositiveInt(req.params.id);
  if (!jobId) {
    res.status(400).json({ error: 'ID inválido.' });
    return;
  }
  const supabase = getSupabase();
  const { data: job } = await supabase.from('tinder_jobs').select('creator_id').eq('id', jobId).single();
  if (!job || job.creator_id !== req.user?.id) {
    res.status(403).json({ error: 'Apenas o criador da vaga pode encerrá-la.' });
    return;
  }
  const { error } = await supabase.from('tinder_jobs').update({ status: 'CLOSED' }).eq('id', jobId);
  if (error) {
    res.status(500).json({ error: 'Erro ao encerrar vaga.' });
    return;
  }
  await logAction(req.user!.id, 'TINDER_JOB_CLOSED', { jobId });
  res.json({ ok: true, message: 'Vaga encerrada com sucesso.' });
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
  let applied = false;
  if (req.user) {
    const { data: app } = await supabase.from('tinder_applications').select('id').eq('job_id', jobId).eq('candidate_id', req.user.id).maybeSingle();
    applied = !!app;
  }
  res.json({ job: { ...data, applied } });
});

router.post('/jobs/:id/apply', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'PRESTADOR', 'LIDERANCA'])) return;
  const jobId = toPositiveInt(req.params.id);
  if (!jobId) {
    res.status(400).json({ error: 'ID inválido.' });
    return;
  }
  const supabase = getSupabase();
  const { data: job } = await supabase.from('tinder_jobs').select('status, deadline, creator_id').eq('id', jobId).single();
  if (!job) {
    res.status(404).json({ error: 'Vaga não encontrada.' });
    return;
  }
  if (job.creator_id === req.user!.id) {
    res.status(400).json({ error: 'O criador da vaga não pode se candidatar.' });
    return;
  }
  if (job.status === 'CLOSED') {
    res.status(400).json({ error: 'Esta vaga está encerrada e não aceita mais candidaturas.' });
    return;
  }
  if (job.deadline) {
    const today = new Date().toISOString().split('T')[0];
    const deadlineStr = String(job.deadline).split('T')[0];
    if (deadlineStr < today) {
      res.status(400).json({ error: 'O prazo desta vaga já passou.' });
      return;
    }
  }
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
  res.json({ ok: true, message: 'Você foi candidatado para a vaga!' });
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
  try {
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

    // Log erros para debug
    if (mentorProfiles.error) console.error('[Admin Dashboard] Erro mentorProfiles:', mentorProfiles.error);
    if (serviceProfiles.error) console.error('[Admin Dashboard] Erro serviceProfiles:', serviceProfiles.error);
    if (interests.error) console.error('[Admin Dashboard] Erro interests:', interests.error);
    if (matches.error) console.error('[Admin Dashboard] Erro matches:', matches.error);
    if (jobs.error) console.error('[Admin Dashboard] Erro jobs:', jobs.error);
    if (applications.error) console.error('[Admin Dashboard] Erro applications:', applications.error);
    if (reviews.error) console.error('[Admin Dashboard] Erro reviews:', reviews.error);

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
  } catch (err: any) {
    console.error('[Admin Dashboard] Erro geral:', err);
    res.status(500).json({ error: 'Erro ao carregar dashboard.' });
  }
});

router.get('/admin/users', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['LIDERANCA'])) return;
  try {
    const q = cleanOptionalString(req.query.q, 120);
    const role = cleanOptionalString(req.query.role, 20);
    const supabase = getSupabase();
    
    console.log('[Admin Users] Iniciando busca de usuários...', { q, role });
    
    // Primeiro, testar uma query simples sem filtros
    const { data: testData, error: testError } = await supabase
      .from('user_roles')
      .select('user_id, name, role, created_at')
      .limit(5);
    
    console.log('[Admin Users] Teste de query simples:', { 
      dataCount: testData?.length || 0, 
      error: testError,
      errorCode: testError?.code,
      errorMessage: testError?.message,
      errorDetails: testError?.details,
      errorHint: testError?.hint
    });
    
    if (testError) {
      console.error('[Admin Users] Erro no teste de query:', testError);
      res.status(500).json({ 
        error: 'Erro ao buscar usuários.', 
        details: process.env.NODE_ENV === 'development' ? testError.message : undefined,
        code: testError.code
      });
      return;
    }
    
    // Agora fazer a query completa com filtros
    let query = supabase.from('user_roles').select('user_id,name,role,created_at').order('created_at', { ascending: false });
    if (q) query = query.ilike('name', `%${q}%`);
    if (role) query = query.eq('role', role);
    const { data, error } = await query.limit(200);
    
    console.log('[Admin Users] Query completa:', { 
      dataCount: data?.length || 0, 
      error: error,
      errorCode: error?.code,
      errorMessage: error?.message
    });
    
    if (error) {
      console.error('[Admin Users] Erro ao buscar user_roles:', error);
      res.status(500).json({ 
        error: 'Erro ao listar usuários.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: error.code
      });
      return;
    }
    
    // Buscar emails do auth.users
    const userIds = (data || []).map((u: any) => u.user_id);
    console.log('[Admin Users] Buscando emails para', userIds.length, 'usuários');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('[Admin Users] Erro ao buscar auth.users:', authError);
    }
    
    const emailMap = new Map(authUsers?.users?.map((u: any) => [u.id, u.email]) || []);
    
    const users = (data || []).map((u: any) => ({
      id: u.user_id,
      name: u.name,
      email: emailMap.get(u.user_id) || '',
      role: u.role,
      created_at: u.created_at
    }));
    
    console.log('[Admin Users] Retornando', users.length, 'usuários');
    res.json({ users });
  } catch (err: any) {
    console.error('[Admin Users] Erro geral:', err);
    console.error('[Admin Users] Stack:', err?.stack);
    res.status(500).json({ 
      error: 'Erro interno.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
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
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('tinder_jobs').select('*').order('created_at', { ascending: false }).limit(300);
    if (error) {
      console.error('[Admin Jobs] Erro:', error);
      res.status(500).json({ error: 'Erro ao listar vagas.' });
      return;
    }
    res.json({ jobs: data || [] });
  } catch (err: any) {
    console.error('[Admin Jobs] Erro geral:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
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
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('tinder_reviews').select('*').order('created_at', { ascending: false }).limit(300);
    if (error) {
      console.error('[Admin Reviews] Erro:', error);
      res.status(500).json({ error: 'Erro ao listar avaliações.' });
      return;
    }
    res.json({ reviews: data || [] });
  } catch (err: any) {
    console.error('[Admin Reviews] Erro geral:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
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
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tinder_do_fluxo_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) {
      console.error('[Admin Logs] Erro:', error);
      res.status(500).json({ error: 'Erro ao listar logs.' });
      return;
    }
    res.json({ logs: data || [] });
  } catch (err: any) {
    console.error('[Admin Logs] Erro geral:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// ============================================================
// COMUNIDADE ROUTES
// ============================================================

// GET /comunidade/temas
router.get('/comunidade/temas', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('temas')
      .select('*')
      .order('nome', { ascending: true });
    
    if (error) {
      console.error('[Comunidade Temas] Erro:', error);
      res.status(500).json({ error: 'Erro ao buscar temas.' });
      return;
    }
    
    res.json({ temas: data || [] });
  } catch (err: any) {
    console.error('[Comunidade Temas] Erro geral:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// GET /comunidade/posts (feed com paginação e filtro por tema)
router.get('/comunidade/posts', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();
    const userId = req.user!.id;
    const temaId = isValidUUID(req.query.tema_id as string) || null;
    const searchQuery = cleanString(req.query.q as string, 200);
    const page = toPositiveInt(req.query.page) || 1;
    const perPage = toPositiveInt(req.query.per_page) || 10;
    const offset = (page - 1) * perPage;

    // Query base
    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1);

    // Filtro por tema
    if (temaId) {
      query = query.eq('tema_id', temaId);
    }

    // Busca textual (título ou conteúdo)
    if (searchQuery) {
      query = query.or(`titulo.ilike.%${searchQuery}%,conteudo.ilike.%${searchQuery}%`);
    }

    const { data: posts, error: postsError } = await query;

    if (postsError) {
      console.error('[Comunidade Posts] Erro:', postsError);
      res.status(500).json({ error: 'Erro ao buscar posts.' });
      return;
    }

    // Buscar temas e nomes de usuários
    const temaIds = [...new Set((posts || []).map((p: any) => p.tema_id).filter(Boolean))];
    const autorIds = [...new Set((posts || []).map((p: any) => p.autor_id))];

    const { data: temas } = await supabase
      .from('temas')
      .select('id, nome')
      .in('id', temaIds);

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('user_id, name')
      .in('user_id', autorIds);

    const temaMap = new Map(temas?.map((t: any) => [t.id, t.nome]) || []);
    const userMap = new Map(userRoles?.map((u: any) => [u.user_id, u.name]) || []);

    // Buscar media, likes, saves e comentários para cada post
    const postsWithCounts = await Promise.all(
      (posts || []).map(async (post: any) => {
        const postId = post.id;

        // Media
        const { data: media } = await supabase
          .from('post_media')
          .select('*')
          .eq('post_id', postId);

        // Likes
        const { data: likes } = await supabase
          .from('post_likes')
          .select('user_id')
          .eq('post_id', postId);

        // Saves
        const { data: saves } = await supabase
          .from('post_saves')
          .select('user_id')
          .eq('post_id', postId);

        // Comentários
        const { data: comentarios } = await supabase
          .from('comentarios')
          .select('id')
          .eq('post_id', postId);

        const likedByMe = likes?.some((l: any) => l.user_id === userId) || false;
        const savedByMe = saves?.some((s: any) => s.user_id === userId) || false;

        return {
          id: post.id,
          tema_id: post.tema_id,
          autor_id: post.autor_id,
          titulo: post.titulo,
          conteudo: post.conteudo,
          created_at: post.created_at,
          tema_nome: post.tema_id ? (temaMap.get(post.tema_id) || 'Sem tema') : 'Sem tema',
          autor_nome: userMap.get(post.autor_id) || 'Usuário',
          media: media || [],
          total_curtidas: likes?.length || 0,
          total_comentarios: comentarios?.length || 0,
          total_salvos: saves?.length || 0,
          liked_by_me: likedByMe,
          saved_by_me: savedByMe,
        };
      })
    );

    // Verificar se há mais posts
    let countQuery = supabase.from('posts').select('id', { count: 'exact', head: true });
    if (temaId) {
      countQuery = countQuery.eq('tema_id', temaId);
    }
    const { count } = await countQuery;
    const hasMore = (count || 0) > offset + perPage;

    res.json({ posts: postsWithCounts, hasMore });
  } catch (err: any) {
    console.error('[Comunidade Posts] Erro geral:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// GET /comunidade/trending (top 5 por score)
router.get('/comunidade/trending', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();
    const userId = req.user!.id;

    // Buscar todos os posts com contadores
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100); // Buscar mais para calcular score

    if (postsError) {
      console.error('[Comunidade Trending] Erro:', postsError);
      res.status(500).json({ error: 'Erro ao buscar posts.' });
      return;
    }

    // Buscar temas e nomes de usuários
    const temaIds = [...new Set((posts || []).map((p: any) => p.tema_id).filter(Boolean))];
    const autorIds = [...new Set((posts || []).map((p: any) => p.autor_id))];

    const { data: temas } = await supabase
      .from('temas')
      .select('id, nome')
      .in('id', temaIds);

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('user_id, name')
      .in('user_id', autorIds);

    const temaMap = new Map(temas?.map((t: any) => [t.id, t.nome]) || []);
    const userMap = new Map(userRoles?.map((u: any) => [u.user_id, u.name]) || []);

    // Calcular score para cada post
    const postsWithScores = await Promise.all(
      (posts || []).map(async (post: any) => {
        const postId = post.id;

        const { data: likes } = await supabase
          .from('post_likes')
          .select('user_id')
          .eq('post_id', postId);

        const { data: comentarios } = await supabase
          .from('comentarios')
          .select('id')
          .eq('post_id', postId);

        const { data: saves } = await supabase
          .from('post_saves')
          .select('user_id')
          .eq('post_id', postId);

        const { data: media } = await supabase
          .from('post_media')
          .select('*')
          .eq('post_id', postId);

        const totalCurtidas = likes?.length || 0;
        const totalComentarios = comentarios?.length || 0;
        const totalSalvos = saves?.length || 0;

        // Score = (curtidas * 1) + (comentarios * 2) + (saves * 3)
        const score = totalCurtidas * 1 + totalComentarios * 2 + totalSalvos * 3;

        const likedByMe = likes?.some((l: any) => l.user_id === userId) || false;
        const savedByMe = saves?.some((s: any) => s.user_id === userId) || false;

        return {
          id: post.id,
          tema_id: post.tema_id,
          autor_id: post.autor_id,
          titulo: post.titulo,
          conteudo: post.conteudo,
          created_at: post.created_at,
          tema_nome: post.tema_id ? (temaMap.get(post.tema_id) || 'Sem tema') : 'Sem tema',
          autor_nome: userMap.get(post.autor_id) || 'Usuário',
          media: media || [],
          total_curtidas: totalCurtidas,
          total_comentarios: totalComentarios,
          total_salvos: totalSalvos,
          liked_by_me: likedByMe,
          saved_by_me: savedByMe,
          score,
        };
      })
    );

    // Ordenar por score e pegar top 5
    const top5 = postsWithScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ score, ...post }) => post); // Remover score do resultado

    res.json({ posts: top5 });
  } catch (err: any) {
    console.error('[Comunidade Trending] Erro geral:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /comunidade/posts (criar post)
// Usar multer para processar FormData (mesmo que não tenha arquivos ainda)
router.post('/comunidade/posts', upload.any(), async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();
    const userId = req.user!.id;
    
    // Extrair dados do body (pode ser FormData ou JSON)
    const temaIdRaw = req.body.tema_id || req.body['tema_id'];
    const tituloRaw = req.body.titulo || req.body['titulo'];
    const conteudoRaw = req.body.conteudo || req.body['conteudo'];
    
    console.log('[Comunidade Create Post] Body recebido:', {
      tema_id: temaIdRaw,
      titulo: tituloRaw?.substring(0, 50),
      conteudo: conteudoRaw?.substring(0, 50),
      bodyKeys: Object.keys(req.body)
    });
    
    const temaId = isValidUUID(temaIdRaw);
    const titulo = cleanString(tituloRaw, 200);
    const conteudo = cleanString(conteudoRaw, 5000);

    // Validação mais detalhada
    if (!temaId) {
      console.log('[Comunidade Create Post] Validação falhou: temaId inválido', temaIdRaw);
      res.status(400).json({ error: 'Tema é obrigatório e deve ser válido.' });
      return;
    }
    
    if (!titulo || titulo.trim().length === 0) {
      console.log('[Comunidade Create Post] Validação falhou: título vazio');
      res.status(400).json({ error: 'Título é obrigatório.' });
      return;
    }
    
    if (!conteudo || conteudo.trim().length === 0) {
      console.log('[Comunidade Create Post] Validação falhou: conteúdo vazio');
      res.status(400).json({ error: 'Conteúdo é obrigatório.' });
      return;
    }

    // Verificar se tema permite postagem e buscar nome
    const { data: tema, error: temaError } = await supabase
      .from('temas')
      .select('permite_postagem, nome')
      .eq('id', temaId)
      .single();

    if (temaError || !tema) {
      res.status(404).json({ error: 'Tema não encontrado.' });
      return;
    }

    if (!tema.permite_postagem) {
      res.status(403).json({ error: 'Este tema não permite postagens.' });
      return;
    }

    // Criar post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        tema_id: temaId,
        autor_id: userId,
        titulo,
        conteudo,
      })
      .select('*')
      .single();

    if (postError || !post) {
      console.error('[Comunidade Create Post] Erro:', postError);
      res.status(500).json({ error: 'Erro ao criar post.' });
      return;
    }

    // Buscar nome do usuário

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('name')
      .eq('user_id', userId)
      .single();

    // TODO: Upload de mídia será implementado com Supabase Storage
    // Por enquanto, retornar post sem media

    const postWithCounts = {
      id: post.id,
      tema_id: post.tema_id,
      autor_id: post.autor_id,
      titulo: post.titulo,
      conteudo: post.conteudo,
      created_at: post.created_at,
      tema_nome: tema?.nome || 'Sem tema',
      autor_nome: userRole?.name || 'Usuário',
      media: [],
      total_curtidas: 0,
      total_comentarios: 0,
      total_salvos: 0,
      liked_by_me: false,
      saved_by_me: false,
    };

    await logAction(userId, 'COMUNIDADE_POST_CREATED', { postId: post.id });
    res.json({ post: postWithCounts });
  } catch (err: any) {
    console.error('[Comunidade Create Post] Erro geral:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /comunidade/posts/:id/like
router.post('/comunidade/posts/:id/like', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();
    const userId = req.user!.id;
    const postId = isValidUUID(req.params.id);

    if (!postId) {
      res.status(400).json({ error: 'ID do post inválido.' });
      return;
    }

    // Verificar se já curtiu
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('user_id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingLike) {
      // Remover like
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) {
        console.error('[Comunidade Like] Erro ao remover like:', error);
        res.status(500).json({ error: 'Erro ao remover curtida.' });
        return;
      }
    } else {
      // Adicionar like
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: userId });

      if (error) {
        console.error('[Comunidade Like] Erro ao adicionar like:', error);
        res.status(500).json({ error: 'Erro ao curtir post.' });
        return;
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('[Comunidade Like] Erro geral:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /comunidade/posts/:id/save
router.post('/comunidade/posts/:id/save', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();
    const userId = req.user!.id;
    const postId = isValidUUID(req.params.id);

    if (!postId) {
      res.status(400).json({ error: 'ID do post inválido.' });
      return;
    }

    // Verificar se já salvou
    const { data: existingSave } = await supabase
      .from('post_saves')
      .select('user_id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingSave) {
      // Remover save
      const { error } = await supabase
        .from('post_saves')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) {
        console.error('[Comunidade Save] Erro ao remover save:', error);
        res.status(500).json({ error: 'Erro ao remover salvamento.' });
        return;
      }
    } else {
      // Adicionar save
      const { error } = await supabase
        .from('post_saves')
        .insert({ post_id: postId, user_id: userId });

      if (error) {
        console.error('[Comunidade Save] Erro ao adicionar save:', error);
        res.status(500).json({ error: 'Erro ao salvar post.' });
        return;
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('[Comunidade Save] Erro geral:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// GET /comunidade/posts/:id/comentarios
router.get('/comunidade/posts/:id/comentarios', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();
    const postId = isValidUUID(req.params.id);

    if (!postId) {
      res.status(400).json({ error: 'ID do post inválido.' });
      return;
    }

    const { data: comentarios, error } = await supabase
      .from('comentarios')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    // Buscar nomes dos autores
    const autorIds = [...new Set((comentarios || []).map((c: any) => c.autor_id))];
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('user_id, name')
      .in('user_id', autorIds);

    const userMap = new Map(userRoles?.map((u: any) => [u.user_id, u.name]) || []);

    if (error) {
      console.error('[Comunidade Comentarios] Erro:', error);
      res.status(500).json({ error: 'Erro ao buscar comentários.' });
      return;
    }

    const comentariosWithAuthor = (comentarios || []).map((c: any) => ({
      id: c.id,
      post_id: c.post_id,
      autor_id: c.autor_id,
      conteudo: c.conteudo,
      created_at: c.created_at,
      autor_nome: userMap.get(c.autor_id) || 'Usuário',
    }));

    res.json({ comentarios: comentariosWithAuthor });
  } catch (err: any) {
    console.error('[Comunidade Comentarios] Erro geral:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /comunidade/posts/:id/comentarios
router.post('/comunidade/posts/:id/comentarios', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();
    const userId = req.user!.id;
    const postId = isValidUUID(req.params.id);
    const conteudo = cleanString(req.body.conteudo, 2000);

    if (!postId || !conteudo) {
      res.status(400).json({ error: 'ID do post e conteúdo são obrigatórios.' });
      return;
    }

    const { data: comentario, error } = await supabase
      .from('comentarios')
      .insert({
        post_id: postId,
        autor_id: userId,
        conteudo,
      })
      .select('*')
      .single();

    // Buscar nome do autor
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('name')
      .eq('user_id', userId)
      .single();

    if (error || !comentario) {
      console.error('[Comunidade Create Comentario] Erro:', error);
      res.status(500).json({ error: 'Erro ao criar comentário.' });
      return;
    }

    const comentarioWithAuthor = {
      id: comentario.id,
      post_id: comentario.post_id,
      autor_id: comentario.autor_id,
      conteudo: comentario.conteudo,
      created_at: comentario.created_at,
      autor_nome: userRole?.name || 'Usuário',
    };

    await logAction(userId, 'COMUNIDADE_COMENTARIO_CREATED', { postId, comentarioId: comentario.id });
    res.json({ comentario: comentarioWithAuthor });
  } catch (err: any) {
    console.error('[Comunidade Create Comentario] Erro geral:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// ============================================
// PROFILE PROJECTS
// ============================================

router.get('/profile-projects', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'PRESTADOR', 'LIDERANCA'])) return;
  
  const userId = req.query.userId as string || req.user!.id;
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('profile_projects')
    .select('*')
    .eq('user_id', userId)
    .order('ano', { ascending: false });
  
  if (error) {
    console.error('[GET /profile-projects] Erro:', error);
    res.status(500).json({ error: 'Erro ao buscar projetos.' });
    return;
  }
  
  res.json({ projects: data || [] });
});

router.post('/profile-projects', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'PRESTADOR', 'LIDERANCA'])) return;
  
  const userId = req.user!.id;
  const supabase = getSupabase();
  
  const payload = {
    user_id: userId,
    nome: cleanString(req.body.nome || '', 200),
    descricao: cleanString(req.body.descricao || '', 2000),
    ano: req.body.ano ? parseInt(req.body.ano, 10) : null,
    tags: Array.isArray(req.body.tags) ? req.body.tags : [],
    link_portfolio: cleanString(req.body.linkPortfolio || '', 1000),
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('profile_projects')
    .insert(payload)
    .select('*')
    .single();
  
  if (error) {
    console.error('[POST /profile-projects] Erro:', error);
    res.status(500).json({ error: 'Erro ao criar projeto.' });
    return;
  }
  
  await logAction(userId, 'PROFILE_PROJECT_CREATED', { projectId: data.id });
  res.json({ project: data });
});

router.put('/profile-projects/:id', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'PRESTADOR', 'LIDERANCA'])) return;
  
  const userId = req.user!.id;
  const projectId = req.params.id;
  const supabase = getSupabase();
  
  // Verificar se o projeto pertence ao usuário
  const { data: existing } = await supabase
    .from('profile_projects')
    .select('user_id')
    .eq('id', projectId)
    .single();
  
  if (!existing || existing.user_id !== userId) {
    res.status(403).json({ error: 'Você não tem permissão para editar este projeto.' });
    return;
  }
  
  const payload = {
    nome: cleanString(req.body.nome || '', 200),
    descricao: cleanString(req.body.descricao || '', 2000),
    ano: req.body.ano ? parseInt(req.body.ano, 10) : null,
    tags: Array.isArray(req.body.tags) ? req.body.tags : [],
    link_portfolio: cleanString(req.body.linkPortfolio || '', 1000),
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('profile_projects')
    .update(payload)
    .eq('id', projectId)
    .select('*')
    .single();
  
  if (error) {
    console.error('[PUT /profile-projects] Erro:', error);
    res.status(500).json({ error: 'Erro ao atualizar projeto.' });
    return;
  }
  
  await logAction(userId, 'PROFILE_PROJECT_UPDATED', { projectId });
  res.json({ project: data });
});

router.delete('/profile-projects/:id', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'PRESTADOR', 'LIDERANCA'])) return;
  
  const userId = req.user!.id;
  const projectId = req.params.id;
  const supabase = getSupabase();
  
  // Verificar se o projeto pertence ao usuário
  const { data: existing } = await supabase
    .from('profile_projects')
    .select('user_id')
    .eq('id', projectId)
    .single();
  
  if (!existing || existing.user_id !== userId) {
    res.status(403).json({ error: 'Você não tem permissão para deletar este projeto.' });
    return;
  }
  
  const { error } = await supabase
    .from('profile_projects')
    .delete()
    .eq('id', projectId);
  
  if (error) {
    console.error('[DELETE /profile-projects] Erro:', error);
    res.status(500).json({ error: 'Erro ao deletar projeto.' });
    return;
  }
  
  await logAction(userId, 'PROFILE_PROJECT_DELETED', { projectId });
  res.json({ success: true });
});

// ============================================
// PROFILE REVIEWS
// ============================================

router.get('/profile-reviews', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'PRESTADOR', 'LIDERANCA'])) return;
  
  const profileUserId = req.query.userId as string;
  if (!profileUserId) {
    res.status(400).json({ error: 'userId é obrigatório.' });
    return;
  }
  
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('profile_reviews')
    .select('*')
    .eq('profile_user_id', profileUserId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('[GET /profile-reviews] Erro:', error);
    res.status(500).json({ error: 'Erro ao buscar depoimentos.' });
    return;
  }
  
  res.json({ reviews: data || [] });
});

router.post('/profile-reviews', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'PRESTADOR', 'LIDERANCA'])) return;
  
  const userId = req.user!.id;
  const supabase = getSupabase();
  
  const profileUserId = req.body.profileUserId;
  if (!profileUserId) {
    res.status(400).json({ error: 'profileUserId é obrigatório.' });
    return;
  }
  
  const rating = req.body.rating ? parseInt(req.body.rating, 10) : 0;
  if (rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Rating deve ser entre 1 e 5.' });
    return;
  }
  
  // Buscar nome do usuário
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('name')
    .eq('user_id', userId)
    .single();
  
  const payload = {
    profile_user_id: profileUserId,
    rating,
    depoimento: cleanString(req.body.depoimento || '', 2000),
    autor_nome: cleanString(req.body.autorNome || userRole?.name || 'Usuário', 200),
    autor_user_id: userId,
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('profile_reviews')
    .insert(payload)
    .select('*')
    .single();
  
  if (error) {
    console.error('[POST /profile-reviews] Erro:', error);
    res.status(500).json({ error: 'Erro ao criar depoimento.' });
    return;
  }
  
  await logAction(userId, 'PROFILE_REVIEW_CREATED', { reviewId: data.id, profileUserId });
  res.json({ review: data });
});

router.get('/profile-rating', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'PRESTADOR', 'LIDERANCA'])) return;
  
  const profileUserId = req.query.userId as string;
  if (!profileUserId) {
    res.status(400).json({ error: 'userId é obrigatório.' });
    return;
  }
  
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('profile_rating')
    .select('*')
    .eq('profile_user_id', profileUserId)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('[GET /profile-rating] Erro:', error);
    res.status(500).json({ error: 'Erro ao buscar rating.' });
    return;
  }
  
  res.json({ 
    rating: data?.rating_avg || 0, 
    totalReviews: data?.total_reviews || 0 
  });
});

// ============================================
// PROFILE VIEW (COMPLETE)
// ============================================

router.get('/profile-view', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'PRESTADOR', 'LIDERANCA'])) return;
  
  const userId = req.query.userId as string || req.user!.id;
  const supabase = getSupabase();
  
  try {
    // Buscar dados do usuário
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('name, role')
      .eq('user_id', userId)
      .single();
    
    if (!userRole) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }
    
    let profileData: any = null;
    let expertProfile: any = null;
    let serviceProfile: any = null;
    
    // Buscar perfil baseado no role
    if (userRole.role === 'MENTORADO') {
      const { data: mentor } = await supabase
        .from('tinder_mentor_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      profileData = mentor;
      
      // Campos de Expert/Coprodutor agora estão em tinder_mentor_profiles
      expertProfile = mentor ? {
        is_expert: mentor.is_expert || false,
        is_coproducer: mentor.is_coproducer || false,
        goal_text: mentor.goal_text || '',
        search_bio: mentor.search_bio || '',
        preferences_json: mentor.preferences_json || {}
      } : null;
    } else if (userRole.role === 'PRESTADOR') {
      const { data: service } = await supabase
        .from('tinder_service_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      serviceProfile = service;
      profileData = service;
    }
    
    // Buscar projetos
    const { data: projects } = await supabase
      .from('profile_projects')
      .select('*')
      .eq('user_id', userId)
      .order('ano', { ascending: false });
    
    // Buscar rating
    const { data: ratingData } = await supabase
      .from('profile_rating')
      .select('*')
      .eq('profile_user_id', userId)
      .single();
    
    // Buscar depoimentos
    const { data: reviews } = await supabase
      .from('profile_reviews')
      .select('*')
      .eq('profile_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    res.json({
      user: {
        id: userId,
        name: userRole.name,
        role: userRole.role
      },
      profile: profileData,
      expertProfile,
      serviceProfile,
      projects: projects || [],
      rating: ratingData?.rating_avg || 0,
      totalReviews: ratingData?.total_reviews || 0,
      reviews: reviews || []
    });
  } catch (err: any) {
    console.error('[GET /profile-view] Erro:', err);
    res.status(500).json({ error: 'Erro ao buscar perfil completo.' });
  }
});

// ============================================
// PROFILE API (NEW SPECIFICATION)
// ============================================

// GET /profile/me
router.get('/profile/me', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'PRESTADOR', 'LIDERANCA'])) return;
  
  try {
    // Permitir buscar perfil de outro usuário via query param
    const targetUserId = req.query.userId as string || req.user!.id;
    const supabase = getSupabase();
    
    // Buscar role e tipo_usuario (usar maybeSingle para não falhar se não existir)
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role, tipo_usuario')
      .eq('user_id', targetUserId)
      .maybeSingle();
    
    if (roleError) {
      console.error('[GET /profile/me] Erro ao buscar user_role:', roleError);
      res.status(500).json({ error: 'Erro ao buscar perfil do usuário.' });
      return;
    }
    
    if (!userRole) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }
    
    // Determinar tipo_usuario: se não existir na coluna, usar role como fallback
    let tipoUsuario: 'mentorado' | 'aluno' = 'mentorado';
    if (userRole.tipo_usuario) {
      tipoUsuario = userRole.tipo_usuario as 'mentorado' | 'aluno';
    } else {
      // Fallback: MENTORADO → mentorado, PRESTADOR → aluno
      tipoUsuario = userRole.role === 'PRESTADOR' ? 'aluno' : 'mentorado';
    }
    
    const profileService = new ProfileService();
    const profile = await profileService.getProfile(targetUserId, tipoUsuario);
    
    res.json(profile);
  } catch (err: any) {
    console.error('[GET /profile/me] Erro:', err);
    res.status(500).json({ 
      error: 'Erro ao buscar perfil.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// PUT /profile
router.put('/profile', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'PRESTADOR', 'LIDERANCA'])) return;
  
  try {
    const userId = req.user!.id;
    const supabase = getSupabase();
    
    // Buscar tipo_usuario
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('tipo_usuario')
      .eq('user_id', userId)
      .single();
    
    const tipoUsuario = (userRole?.tipo_usuario || 'mentorado') as 'mentorado' | 'aluno';
    
    const profileService = new ProfileService();
    await profileService.updateProfile(userId, tipoUsuario, req.body);
    
    res.json({ success: true });
  } catch (err: any) {
    console.error('[PUT /profile] Erro:', err);
    res.status(500).json({ error: err.message || 'Erro ao atualizar perfil.' });
  }
});

// POST /profile/avatar
router.post('/profile/avatar', upload.single('avatar'), async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'PRESTADOR', 'LIDERANCA'])) return;
  
  try {
    const userId = req.user!.id;
    const file = req.file;
    
    if (!file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      return;
    }
    const profileService = new ProfileService();
    const result = await profileService.uploadAvatar(
      userId,
      file.buffer,
      file.originalname,
      file.mimetype
    );
    
    res.json(result);
  } catch (err: any) {
    console.error('[POST /profile/avatar] Erro:', err);
    res.status(500).json({ error: err.message || 'Erro ao fazer upload do avatar.' });
  }
});

// ============================================
// PROFILE FORM (OLD - DEPRECATED)
// ============================================

// Get user tipo_usuario
router.get('/user-tipo', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'PRESTADOR', 'LIDERANCA'])) return;
  
  const userId = req.user!.id;
  const supabase = getSupabase();
  
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('tipo_usuario')
    .eq('user_id', userId)
    .single();
  
  res.json({ tipo_usuario: userRole?.tipo_usuario || 'mentorado' });
});

// Get profile form data
router.get('/profile-form', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'PRESTADOR', 'LIDERANCA'])) return;
  
  const userId = req.query.userId as string || req.user!.id;
  const supabase = getSupabase();
  
  try {
    // Buscar user role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('name, role, tipo_usuario')
      .eq('user_id', userId)
      .single();
    
    if (!userRole) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }
    
    const tipoUsuario = userRole.tipo_usuario || 'mentorado';
    
    // Buscar perfil base
    let profile: any = null;
    let expertProfile: any = null;
    
    if (tipoUsuario === 'mentorado') {
      const { data: mentor } = await supabase
        .from('tinder_mentor_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      profile = mentor;
      
      const { data: expert } = await supabase
        .from('tinder_expert_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      expertProfile = expert;
    } else {
      const { data: service } = await supabase
        .from('tinder_service_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      profile = service;
    }
    
    // Buscar detalhes específicos
    const { data: expertDetails } = await supabase
      .from('expert_details')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    const { data: coprodutorDetails } = await supabase
      .from('coprodutor_details')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    const { data: prestadorDetails } = await supabase
      .from('prestador_details')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    // Buscar skills
    const { data: skills } = await supabase
      .from('profile_skills')
      .select('*')
      .eq('user_id', userId);
    
    const { data: skillsExtra } = await supabase
      .from('profile_skills_extra')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    // Buscar projetos
    const { data: projects } = await supabase
      .from('profile_projects')
      .select('*')
      .eq('user_id', userId)
      .order('ano', { ascending: false });
    
    res.json({
      user: { name: userRole.name, role: userRole.role },
      tipoUsuario,
      profile,
      expertProfile,
      expertDetails,
      coprodutorDetails,
      prestadorDetails,
      skills: skills || [],
      skillsExtra: skillsExtra || [],
      projects: projects || [],
    });
  } catch (err: any) {
    console.error('[GET /profile-form] Erro:', err);
    res.status(500).json({ error: 'Erro ao buscar dados do formulário.' });
  }
});

// Save profile form
router.post('/profile-form', async (req: Request, res: Response): Promise<void> => {
  if (!ensureRoles(req, res, ['MENTORADO', 'PRESTADOR', 'LIDERANCA'])) return;
  
  const userId = req.user!.id;
  const supabase = getSupabase();
  const body = req.body;
  
  try {
    // Buscar tipo_usuario
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('tipo_usuario, role')
      .eq('user_id', userId)
      .single();
    
    const tipoUsuario = userRole?.tipo_usuario || 'mentorado';
    
    // Salvar perfil base
    if (tipoUsuario === 'mentorado') {
      // Salvar mentor profile
      const whatsapp = body.whatsapp || '';
      await supabase
        .from('tinder_mentor_profiles')
        .upsert({
          user_id: userId,
          headline: cleanString(body.headline || '', 200),
          city: cleanString(body.cidade || '', 120),
          whatsapp: cleanString(whatsapp, 40),
          idiomas: Array.isArray(body.idiomas) ? body.idiomas : [],
          anos_experiencia: body.anosExperiencia ? parseInt(body.anosExperiencia, 10) : 0,
          horas_semanais: body.horasSemanais ? parseInt(body.horasSemanais, 10) : 0,
          disponivel: body.disponivel !== undefined ? !!body.disponivel : true,
          bio: cleanString(body.bioBusca || '', 2000),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      // Salvar expert profile (se necessário)
      if (body.isExpert || body.isCoprodutor) {
        await supabase
          .from('tinder_expert_profiles')
          .upsert({
            user_id: userId,
            is_expert: !!body.isExpert,
            is_coproducer: !!body.isCoprodutor,
            goal_text: cleanString(body.objetivo || '', 400),
            search_bio: cleanString(body.bioBusca || '', 2000),
            headline: cleanString(body.headline || '', 200),
            anos_experiencia: body.anosExperiencia ? parseInt(body.anosExperiencia, 10) : 0,
            horas_semanais: body.horasSemanais ? parseInt(body.horasSemanais, 10) : 0,
            disponivel: body.disponivel !== undefined ? !!body.disponivel : true,
            idiomas: Array.isArray(body.idiomas) ? body.idiomas : [],
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      }
      
      // Salvar expert_details (se expert)
      if (body.isExpert && body.expert) {
        await supabase
          .from('expert_details')
          .upsert({
            user_id: userId,
            tipo_produto: cleanString(body.expert.tipoProduto || '', 200),
            preco: body.expert.preco ? parseFloat(body.expert.preco) : 0,
            modelo: body.expert.modelo || '',
            precisa_trafego: !!body.expert.precisaTrafego,
            precisa_coprodutor: !!body.expert.precisaCoprodutor,
            precisa_copy: !!body.expert.precisaCopy,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      }
      
      // Salvar coprodutor_details (se coprodutor)
      if (body.isCoprodutor && body.coprodutor) {
        await supabase
          .from('coprodutor_details')
          .upsert({
            user_id: userId,
            faz_trafego: !!body.coprodutor.fazTrafego,
            faz_lancamento: !!body.coprodutor.fazLancamento,
            faz_perpetuo: !!body.coprodutor.fazPerpetuo,
            ticket_minimo: body.coprodutor.ticketMinimo ? parseFloat(body.coprodutor.ticketMinimo) : 0,
            percentual_minimo: body.coprodutor.percentualMinimo ? parseInt(body.coprodutor.percentualMinimo, 10) : 0,
            aceita_sociedade: !!body.coprodutor.aceitaSociedade,
            aceita_fee_percentual: !!body.coprodutor.aceitaFeePercentual,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      }
    } else {
      // Aluno = Prestador
      await supabase
        .from('tinder_service_profiles')
        .upsert({
          user_id: userId,
          headline: cleanString(body.headline || '', 200),
          city: cleanString(body.cidade || '', 120),
          whatsapp: cleanString(body.whatsapp || '', 40),
          idiomas: Array.isArray(body.idiomas) ? body.idiomas : [],
          anos_experiencia: body.anosExperiencia ? parseInt(body.anosExperiencia, 10) : 0,
          horas_semanais: body.horasSemanais ? parseInt(body.horasSemanais, 10) : 0,
          disponivel: body.disponivel !== undefined ? !!body.disponivel : true,
          modelo_trabalho: body.prestador?.modeloContratacao || 'remoto',
          bio: cleanString(body.bioBusca || '', 2000),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      // Salvar prestador_details
      if (body.prestador) {
        await supabase
          .from('prestador_details')
          .upsert({
            user_id: userId,
            servicos: Array.isArray(body.prestador.servicos) ? body.prestador.servicos : [],
            valor_minimo: body.prestador.valorMinimo ? parseFloat(body.prestador.valorMinimo) : 0,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      }
    }
    
    // Salvar skills principais
    if (body.skills) {
      const skillsToSave = [];
      if (body.skills.copywriter !== undefined) {
        skillsToSave.push({ user_id: userId, categoria: 'copywriter', nivel: parseInt(body.skills.copywriter, 10) || 0 });
      }
      if (body.skills.trafego_pago !== undefined) {
        skillsToSave.push({ user_id: userId, categoria: 'trafego_pago', nivel: parseInt(body.skills.trafego_pago, 10) || 0 });
      }
      if (body.skills.automacao_ia !== undefined) {
        skillsToSave.push({ user_id: userId, categoria: 'automacao_ia', nivel: parseInt(body.skills.automacao_ia, 10) || 0 });
      }
      
      // Deletar skills existentes e inserir novas
      await supabase.from('profile_skills').delete().eq('user_id', userId);
      if (skillsToSave.length > 0) {
        await supabase.from('profile_skills').insert(skillsToSave);
      }
    }
    
    // Salvar skills extras
    if (Array.isArray(body.skillsExtra)) {
      await supabase.from('profile_skills_extra').delete().eq('user_id', userId);
      if (body.skillsExtra.length > 0) {
        const skillsExtraToSave = body.skillsExtra
          .filter((s: any) => s.nome && s.nome.trim())
          .map((s: any) => ({
            user_id: userId,
            nome: cleanString(s.nome, 200),
            nivel: parseInt(s.nivel, 10) || 0,
          }));
        if (skillsExtraToSave.length > 0) {
          await supabase.from('profile_skills_extra').insert(skillsExtraToSave);
        }
      }
    }
    
    // Salvar projetos
    if (Array.isArray(body.projetos)) {
      // Buscar projetos existentes
      const { data: existingProjects } = await supabase
        .from('profile_projects')
        .select('id')
        .eq('user_id', userId);
      
      const projetosComId = body.projetos.filter((p: any) => p.id).map((p: any) => p.id);
      const idsToDelete = existingProjects
        ?.filter(p => !projetosComId.includes(p.id))
        .map(p => p.id) || [];
      
      // Deletar projetos removidos
      if (idsToDelete.length > 0) {
        for (const id of idsToDelete) {
          await supabase.from('profile_projects').delete().eq('id', id);
        }
      }
      
      // Inserir/atualizar projetos
      for (const projeto of body.projetos) {
        if (!projeto.nome || !projeto.nome.trim()) continue; // Pular projetos sem nome
        
        if (projeto.id) {
          // Atualizar
          await supabase
            .from('profile_projects')
            .update({
              nome: cleanString(projeto.nome, 200),
              descricao: cleanString(projeto.descricao || '', 2000),
              ano: projeto.ano ? parseInt(projeto.ano, 10) : null,
              tags: Array.isArray(projeto.tags) ? projeto.tags : [],
              link_portfolio: cleanString(projeto.linkPortfolio || '', 1000),
              updated_at: new Date().toISOString()
            })
            .eq('id', projeto.id);
        } else {
          // Inserir
          await supabase
            .from('profile_projects')
            .insert({
              user_id: userId,
              nome: cleanString(projeto.nome, 200),
              descricao: cleanString(projeto.descricao || '', 2000),
              ano: projeto.ano ? parseInt(projeto.ano, 10) : null,
              tags: Array.isArray(projeto.tags) ? projeto.tags : [],
              link_portfolio: cleanString(projeto.linkPortfolio || '', 1000),
            });
        }
      }
    }
    
    await logAction(userId, 'PROFILE_FORM_SAVED', { tipoUsuario });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[POST /profile-form] Erro:', err);
    res.status(500).json({ error: 'Erro ao salvar perfil: ' + (err.message || 'Erro desconhecido') });
  }
});

export default router;
