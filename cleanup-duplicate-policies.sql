-- ============================================================
-- Limpar políticas RLS duplicadas e manter apenas as corretas
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. user_roles - Limpar todas e recriar apenas as necessárias
-- ============================================================

-- Dropar TODAS as políticas de user_roles
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can insert" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to update own profile" ON public.user_roles;
DROP POLICY IF EXISTS "Allow service role to insert" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role or leadership sees all" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own profile or leadership updates all" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_all_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_own_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_own_policy" ON public.user_roles;

-- Recriar apenas as políticas corretas
-- SELECT: Usuários podem ver próprio role, LIDERANCA vê todos
CREATE POLICY "Users can view own role or leadership sees all"
  ON public.user_roles
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    is_leadership(auth.uid())
  );

-- UPDATE: Usuários podem atualizar próprio perfil (exceto role), LIDERANCA pode atualizar qualquer um
CREATE POLICY "Users can update own profile or leadership updates all"
  ON public.user_roles
  FOR UPDATE
  USING (
    auth.uid() = user_id OR
    is_leadership(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id OR
    is_leadership(auth.uid())
  );

-- INSERT: Apenas via service role (backend)
CREATE POLICY "Service role can insert"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 2. Verificar e limpar políticas duplicadas nas outras tabelas
-- ============================================================

-- tinder_mentor_profiles
DROP POLICY IF EXISTS "Users can view own mentor profile" ON public.tinder_mentor_profiles;
DROP POLICY IF EXISTS "Users can update own mentor profile" ON public.tinder_mentor_profiles;
DROP POLICY IF EXISTS "Users can delete own mentor profile" ON public.tinder_mentor_profiles;
DROP POLICY IF EXISTS "Mentorados can insert own profile" ON public.tinder_mentor_profiles;

-- tinder_expert_profiles
DROP POLICY IF EXISTS "Users can view own expert profile" ON public.tinder_expert_profiles;
DROP POLICY IF EXISTS "Users can update own expert profile" ON public.tinder_expert_profiles;
DROP POLICY IF EXISTS "Users can delete own expert profile" ON public.tinder_expert_profiles;
DROP POLICY IF EXISTS "Mentorados can insert own expert profile" ON public.tinder_expert_profiles;

-- tinder_service_profiles
DROP POLICY IF EXISTS "Users can view own service profile" ON public.tinder_service_profiles;
DROP POLICY IF EXISTS "Users can update own service profile" ON public.tinder_service_profiles;
DROP POLICY IF EXISTS "Users can delete own service profile" ON public.tinder_service_profiles;
DROP POLICY IF EXISTS "Prestadores can insert own service profile" ON public.tinder_service_profiles;

-- tinder_jobs
DROP POLICY IF EXISTS "Everyone can view open jobs" ON public.tinder_jobs;
DROP POLICY IF EXISTS "Creator can update own job" ON public.tinder_jobs;
DROP POLICY IF EXISTS "Creator can delete own job" ON public.tinder_jobs;
DROP POLICY IF EXISTS "Mentorados can create jobs" ON public.tinder_jobs;

-- tinder_matches
DROP POLICY IF EXISTS "Users can view own matches" ON public.tinder_matches;
DROP POLICY IF EXISTS "Users can create matches" ON public.tinder_matches;
DROP POLICY IF EXISTS "Users can update own matches" ON public.tinder_matches;
DROP POLICY IF EXISTS "Users can delete own matches" ON public.tinder_matches;

-- tinder_favorites
DROP POLICY IF EXISTS "Users can view own favorites" ON public.tinder_favorites;
DROP POLICY IF EXISTS "Users can create own favorites" ON public.tinder_favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON public.tinder_favorites;

-- tinder_reviews
DROP POLICY IF EXISTS "Everyone can view reviews" ON public.tinder_reviews;
DROP POLICY IF EXISTS "Mentorados can create reviews" ON public.tinder_reviews;
DROP POLICY IF EXISTS "Only leadership can update reviews" ON public.tinder_reviews;
DROP POLICY IF EXISTS "Only leadership can delete reviews" ON public.tinder_reviews;

-- tinder_applications
DROP POLICY IF EXISTS "Candidate sees own applications" ON public.tinder_applications;
DROP POLICY IF EXISTS "Prestadores can create applications" ON public.tinder_applications;
DROP POLICY IF EXISTS "Candidate can update own application" ON public.tinder_applications;
DROP POLICY IF EXISTS "Candidate can delete own application" ON public.tinder_applications;

-- tinder_interests
DROP POLICY IF EXISTS "Users can view own interests" ON public.tinder_interests;
DROP POLICY IF EXISTS "Users can create own interests" ON public.tinder_interests;
DROP POLICY IF EXISTS "Users can delete own interests" ON public.tinder_interests;

-- tinder_do_fluxo_logs
DROP POLICY IF EXISTS "Only leadership can view logs" ON public.tinder_do_fluxo_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON public.tinder_do_fluxo_logs;

-- ============================================================
-- 3. Verificar políticas restantes
-- ============================================================

SELECT 
  tablename,
  COUNT(*) as total_policies,
  STRING_AGG(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'user_roles',
    'tinder_mentor_profiles',
    'tinder_expert_profiles',
    'tinder_service_profiles',
    'tinder_jobs',
    'tinder_matches',
    'tinder_favorites',
    'tinder_reviews',
    'tinder_applications',
    'tinder_do_fluxo_logs',
    'tinder_interests'
  )
GROUP BY tablename
ORDER BY tablename;

-- ============================================================
-- 4. Verificar se todas as políticas permitem LIDERANCA
-- ============================================================

SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual::text LIKE '%is_leadership%' OR with_check::text LIKE '%is_leadership%' THEN '✅ Permite LIDERANCA'
    WHEN qual::text LIKE '%true%' OR with_check::text LIKE '%true%' THEN '✅ Permite todos (pode ser service role)'
    ELSE '⚠️ Verificar se permite LIDERANCA'
  END as leadership_access
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'user_roles',
    'tinder_mentor_profiles',
    'tinder_expert_profiles',
    'tinder_service_profiles',
    'tinder_jobs',
    'tinder_matches',
    'tinder_favorites',
    'tinder_reviews',
    'tinder_applications',
    'tinder_do_fluxo_logs',
    'tinder_interests'
  )
ORDER BY tablename, policyname;
