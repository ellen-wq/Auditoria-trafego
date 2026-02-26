-- ============================================================
-- Garantir acesso total de LIDERANCA a todas as tabelas
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- IMPORTANTE: O backend usa SUPABASE_SERVICE_ROLE_KEY que bypassa RLS automaticamente.
-- Este script garante que as políticas RLS permitam acesso total para LIDERANCA
-- caso alguém acesse diretamente via Supabase Client (sem SERVICE_ROLE_KEY).

-- Atualizar função is_leadership para ser mais robusta
CREATE OR REPLACE FUNCTION is_leadership(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Se user_uuid é NULL, retornar false
  IF user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se o usuário é LIDERANCA
  -- SECURITY DEFINER permite bypassar RLS nesta consulta
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid AND role = 'LIDERANCA'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Garantir que todas as políticas permitam LIDERANCA ver tudo
-- ============================================================

-- 1. user_roles - LIDERANCA vê todos
DROP POLICY IF EXISTS "Users can view own role or leadership sees all" ON public.user_roles;
CREATE POLICY "Users can view own role or leadership sees all"
  ON public.user_roles
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    is_leadership(auth.uid())
  );

-- 2. tinder_mentor_profiles - LIDERANCA vê todos
DROP POLICY IF EXISTS "Users can view own mentor profile or leadership sees all" ON public.tinder_mentor_profiles;
CREATE POLICY "Users can view own mentor profile or leadership sees all"
  ON public.tinder_mentor_profiles
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    is_leadership(auth.uid())
  );

-- 3. tinder_expert_profiles - LIDERANCA vê todos
DROP POLICY IF EXISTS "Users can view own expert profile or leadership sees all" ON public.tinder_expert_profiles;
CREATE POLICY "Users can view own expert profile or leadership sees all"
  ON public.tinder_expert_profiles
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    is_leadership(auth.uid())
  );

-- 4. tinder_service_profiles - LIDERANCA vê todos
DROP POLICY IF EXISTS "Users can view own service profile or leadership sees all" ON public.tinder_service_profiles;
CREATE POLICY "Users can view own service profile or leadership sees all"
  ON public.tinder_service_profiles
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    is_leadership(auth.uid())
  );

-- 5. tinder_jobs - LIDERANCA vê todos
DROP POLICY IF EXISTS "Everyone can view open jobs, creator sees own, leadership sees all" ON public.tinder_jobs;
CREATE POLICY "Everyone can view open jobs, creator sees own, leadership sees all"
  ON public.tinder_jobs
  FOR SELECT
  USING (
    status = 'OPEN' OR
    auth.uid() = creator_id OR
    is_leadership(auth.uid())
  );

-- 6. tinder_matches - LIDERANCA vê todos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tinder_matches') THEN
    DROP POLICY IF EXISTS "Users can view own matches or leadership sees all" ON public.tinder_matches;
    CREATE POLICY "Users can view own matches or leadership sees all"
      ON public.tinder_matches
      FOR SELECT
      USING (
        auth.uid() = user1_id OR
        auth.uid() = user2_id OR
        is_leadership(auth.uid())
      );
  END IF;
END $$;

-- 7. tinder_favorites - LIDERANCA vê todos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tinder_favorites') THEN
    DROP POLICY IF EXISTS "Users can view own favorites or leadership sees all" ON public.tinder_favorites;
    CREATE POLICY "Users can view own favorites or leadership sees all"
      ON public.tinder_favorites
      FOR SELECT
      USING (
        auth.uid() = user_id OR
        is_leadership(auth.uid())
      );
  END IF;
END $$;

-- 8. tinder_reviews - LIDERANCA vê todos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tinder_reviews') THEN
    DROP POLICY IF EXISTS "Everyone can view reviews, prestador sees own service reviews, leadership sees all" ON public.tinder_reviews;
    CREATE POLICY "Everyone can view reviews, prestador sees own service reviews, leadership sees all"
      ON public.tinder_reviews
      FOR SELECT
      USING (
        true OR
        (EXISTS (
          SELECT 1 FROM public.tinder_service_profiles
          WHERE id = tinder_reviews.service_profile_id
          AND user_id = auth.uid()
        )) OR
        is_leadership(auth.uid())
      );
  END IF;
END $$;

-- 9. tinder_applications - LIDERANCA vê todos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tinder_applications') THEN
    DROP POLICY IF EXISTS "Candidate sees own applications, job creator sees applications, leadership sees all" ON public.tinder_applications;
    CREATE POLICY "Candidate sees own applications, job creator sees applications, leadership sees all"
      ON public.tinder_applications
      FOR SELECT
      USING (
        auth.uid() = candidate_id OR
        EXISTS (
          SELECT 1 FROM public.tinder_jobs
          WHERE id = tinder_applications.job_id
          AND creator_id = auth.uid()
        ) OR
        is_leadership(auth.uid())
      );
  END IF;
END $$;

-- 10. tinder_do_fluxo_logs - Apenas LIDERANCA
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tinder_do_fluxo_logs') THEN
    DROP POLICY IF EXISTS "Only leadership can view logs" ON public.tinder_do_fluxo_logs;
    CREATE POLICY "Only leadership can view logs"
      ON public.tinder_do_fluxo_logs
      FOR SELECT
      USING (is_leadership(auth.uid()));
  END IF;
END $$;

-- 11. tinder_interests - LIDERANCA vê todos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tinder_interests') THEN
    DROP POLICY IF EXISTS "Users can view own interests or leadership sees all" ON public.tinder_interests;
    CREATE POLICY "Users can view own interests or leadership sees all"
      ON public.tinder_interests
      FOR SELECT
      USING (
        auth.uid() = from_user_id OR
        auth.uid() = to_user_id OR
        is_leadership(auth.uid())
      );
  END IF;
END $$;

-- ============================================================
-- Verificação final
-- ============================================================

-- Listar todas as políticas que permitem LIDERANCA ver tudo
SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual::text LIKE '%is_leadership%' THEN '✅ Permite LIDERANCA'
    ELSE '❌ Não verifica LIDERANCA'
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
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;
