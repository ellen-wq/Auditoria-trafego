-- ============================================================
-- Script Completo: Limpar e Recriar Todas as Políticas RLS
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- IMPORTANTE: O backend usa SUPABASE_SERVICE_ROLE_KEY que bypassa RLS automaticamente.
-- Este script garante que as políticas RLS estejam corretas caso alguém acesse diretamente.

-- ============================================================
-- 1. Atualizar função is_leadership
-- ============================================================

CREATE OR REPLACE FUNCTION is_leadership(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid AND role = 'LIDERANCA'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. user_roles - Limpar TODAS e recriar apenas 3 políticas
-- ============================================================

-- Dropar TODAS as políticas existentes
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_roles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', pol.policyname);
  END LOOP;
END $$;

-- Recriar apenas as 3 políticas corretas
CREATE POLICY "Users can view own role or leadership sees all"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR is_leadership(auth.uid()));

CREATE POLICY "Users can update own profile or leadership updates all"
  ON public.user_roles FOR UPDATE
  USING (auth.uid() = user_id OR is_leadership(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR is_leadership(auth.uid()));

CREATE POLICY "Service role can insert"
  ON public.user_roles FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 3. tinder_mentor_profiles - Limpar e recriar
-- ============================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'tinder_mentor_profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tinder_mentor_profiles', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Users can view own mentor profile or leadership sees all"
  ON public.tinder_mentor_profiles FOR SELECT
  USING (auth.uid() = user_id OR is_leadership(auth.uid()));

CREATE POLICY "Users can update own mentor profile or leadership updates all"
  ON public.tinder_mentor_profiles FOR UPDATE
  USING (auth.uid() = user_id OR is_leadership(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR is_leadership(auth.uid()));

CREATE POLICY "Users can delete own mentor profile or leadership deletes all"
  ON public.tinder_mentor_profiles FOR DELETE
  USING (auth.uid() = user_id OR is_leadership(auth.uid()));

CREATE POLICY "Mentorados can insert own profile or leadership inserts any"
  ON public.tinder_mentor_profiles FOR INSERT
  WITH CHECK (
    (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'MENTORADO')) OR
    is_leadership(auth.uid())
  );

-- ============================================================
-- 4. tinder_expert_profiles - Limpar e recriar
-- ============================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'tinder_expert_profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tinder_expert_profiles', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Users can view own expert profile or leadership sees all"
  ON public.tinder_expert_profiles FOR SELECT
  USING (auth.uid() = user_id OR is_leadership(auth.uid()));

CREATE POLICY "Users can update own expert profile or leadership updates all"
  ON public.tinder_expert_profiles FOR UPDATE
  USING (auth.uid() = user_id OR is_leadership(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR is_leadership(auth.uid()));

CREATE POLICY "Users can delete own expert profile or leadership deletes all"
  ON public.tinder_expert_profiles FOR DELETE
  USING (auth.uid() = user_id OR is_leadership(auth.uid()));

CREATE POLICY "Mentorados can insert own expert profile or leadership inserts any"
  ON public.tinder_expert_profiles FOR INSERT
  WITH CHECK (
    (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'MENTORADO')) OR
    is_leadership(auth.uid())
  );

-- ============================================================
-- 5. tinder_service_profiles - Limpar e recriar
-- ============================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'tinder_service_profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tinder_service_profiles', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Users can view own service profile or leadership sees all"
  ON public.tinder_service_profiles FOR SELECT
  USING (auth.uid() = user_id OR is_leadership(auth.uid()));

CREATE POLICY "Users can update own service profile or leadership updates all"
  ON public.tinder_service_profiles FOR UPDATE
  USING (auth.uid() = user_id OR is_leadership(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR is_leadership(auth.uid()));

CREATE POLICY "Users can delete own service profile or leadership deletes all"
  ON public.tinder_service_profiles FOR DELETE
  USING (auth.uid() = user_id OR is_leadership(auth.uid()));

CREATE POLICY "Prestadores can insert own service profile or leadership inserts any"
  ON public.tinder_service_profiles FOR INSERT
  WITH CHECK (
    (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'PRESTADOR')) OR
    is_leadership(auth.uid())
  );

-- ============================================================
-- 6. tinder_jobs - Limpar e recriar
-- ============================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'tinder_jobs'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tinder_jobs', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Everyone can view open jobs, creator sees own, leadership sees all"
  ON public.tinder_jobs FOR SELECT
  USING (status = 'OPEN' OR auth.uid() = creator_id OR is_leadership(auth.uid()));

CREATE POLICY "Creator can update own job or leadership updates all"
  ON public.tinder_jobs FOR UPDATE
  USING (auth.uid() = creator_id OR is_leadership(auth.uid()))
  WITH CHECK (auth.uid() = creator_id OR is_leadership(auth.uid()));

CREATE POLICY "Creator can delete own job or leadership deletes all"
  ON public.tinder_jobs FOR DELETE
  USING (auth.uid() = creator_id OR is_leadership(auth.uid()));

CREATE POLICY "Mentorados and leadership can create jobs"
  ON public.tinder_jobs FOR INSERT
  WITH CHECK (
    (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'MENTORADO')) OR
    is_leadership(auth.uid())
  );

-- ============================================================
-- 7. tinder_matches - Limpar e recriar (se existir)
-- ============================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tinder_matches') THEN
    FOR pol IN 
      SELECT policyname FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'tinder_matches'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.tinder_matches', pol.policyname);
    END LOOP;
    
    CREATE POLICY "Users can view own matches or leadership sees all"
      ON public.tinder_matches FOR SELECT
      USING (auth.uid() = user1_id OR auth.uid() = user2_id OR is_leadership(auth.uid()));
    
    CREATE POLICY "Users can create matches involving themselves or leadership creates any"
      ON public.tinder_matches FOR INSERT
      WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id OR is_leadership(auth.uid()));
    
    CREATE POLICY "Users can update own matches or leadership updates all"
      ON public.tinder_matches FOR UPDATE
      USING (auth.uid() = user1_id OR auth.uid() = user2_id OR is_leadership(auth.uid()))
      WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id OR is_leadership(auth.uid()));
    
    CREATE POLICY "Users can delete own matches or leadership deletes all"
      ON public.tinder_matches FOR DELETE
      USING (auth.uid() = user1_id OR auth.uid() = user2_id OR is_leadership(auth.uid()));
  END IF;
END $$;

-- ============================================================
-- 8. tinder_favorites - Limpar e recriar (se existir)
-- ============================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tinder_favorites') THEN
    FOR pol IN 
      SELECT policyname FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'tinder_favorites'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.tinder_favorites', pol.policyname);
    END LOOP;
    
    CREATE POLICY "Users can view own favorites or leadership sees all"
      ON public.tinder_favorites FOR SELECT
      USING (auth.uid() = user_id OR is_leadership(auth.uid()));
    
    CREATE POLICY "Users can create own favorites or leadership creates any"
      ON public.tinder_favorites FOR INSERT
      WITH CHECK (auth.uid() = user_id OR is_leadership(auth.uid()));
    
    CREATE POLICY "Users can delete own favorites or leadership deletes all"
      ON public.tinder_favorites FOR DELETE
      USING (auth.uid() = user_id OR is_leadership(auth.uid()));
  END IF;
END $$;

-- ============================================================
-- 9. tinder_reviews - Limpar e recriar (se existir)
-- ============================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tinder_reviews') THEN
    FOR pol IN 
      SELECT policyname FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'tinder_reviews'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.tinder_reviews', pol.policyname);
    END LOOP;
    
    CREATE POLICY "Everyone can view reviews, prestador sees own service reviews, leadership sees all"
      ON public.tinder_reviews FOR SELECT
      USING (
        true OR
        (EXISTS (
          SELECT 1 FROM public.tinder_service_profiles
          WHERE id = tinder_reviews.service_profile_id AND user_id = auth.uid()
        )) OR
        is_leadership(auth.uid())
      );
    
    CREATE POLICY "Mentorados and leadership can create reviews"
      ON public.tinder_reviews FOR INSERT
      WITH CHECK (
        (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'MENTORADO')) OR
        is_leadership(auth.uid())
      );
    
    CREATE POLICY "Only leadership can update reviews"
      ON public.tinder_reviews FOR UPDATE
      USING (is_leadership(auth.uid()))
      WITH CHECK (is_leadership(auth.uid()));
    
    CREATE POLICY "Only leadership can delete reviews"
      ON public.tinder_reviews FOR DELETE
      USING (is_leadership(auth.uid()));
  END IF;
END $$;

-- ============================================================
-- 10. tinder_applications - Limpar e recriar (se existir)
-- ============================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tinder_applications') THEN
    FOR pol IN 
      SELECT policyname FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'tinder_applications'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.tinder_applications', pol.policyname);
    END LOOP;
    
    CREATE POLICY "Candidate sees own applications, job creator sees applications, leadership sees all"
      ON public.tinder_applications FOR SELECT
      USING (
        auth.uid() = candidate_id OR
        EXISTS (
          SELECT 1 FROM public.tinder_jobs
          WHERE id = tinder_applications.job_id AND creator_id = auth.uid()
        ) OR
        is_leadership(auth.uid())
      );
    
    CREATE POLICY "Prestadores and mentorados can create applications or leadership creates any"
      ON public.tinder_applications FOR INSERT
      WITH CHECK (
        (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('PRESTADOR', 'MENTORADO'))) OR
        is_leadership(auth.uid())
      );
    
    CREATE POLICY "Candidate can update own application, job creator updates, leadership updates all"
      ON public.tinder_applications FOR UPDATE
      USING (
        auth.uid() = candidate_id OR
        EXISTS (
          SELECT 1 FROM public.tinder_jobs
          WHERE id = tinder_applications.job_id AND creator_id = auth.uid()
        ) OR
        is_leadership(auth.uid())
      )
      WITH CHECK (
        auth.uid() = candidate_id OR
        EXISTS (
          SELECT 1 FROM public.tinder_jobs
          WHERE id = tinder_applications.job_id AND creator_id = auth.uid()
        ) OR
        is_leadership(auth.uid())
      );
    
    CREATE POLICY "Candidate can delete own application, job creator deletes, leadership deletes all"
      ON public.tinder_applications FOR DELETE
      USING (
        auth.uid() = candidate_id OR
        EXISTS (
          SELECT 1 FROM public.tinder_jobs
          WHERE id = tinder_applications.job_id AND creator_id = auth.uid()
        ) OR
        is_leadership(auth.uid())
      );
  END IF;
END $$;

-- ============================================================
-- 11. tinder_interests - Limpar e recriar (se existir)
-- ============================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tinder_interests') THEN
    FOR pol IN 
      SELECT policyname FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'tinder_interests'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.tinder_interests', pol.policyname);
    END LOOP;
    
    CREATE POLICY "Users can view own interests or leadership sees all"
      ON public.tinder_interests FOR SELECT
      USING (auth.uid() = from_user_id OR auth.uid() = to_user_id OR is_leadership(auth.uid()));
    
    CREATE POLICY "Users can create own interests or leadership creates any"
      ON public.tinder_interests FOR INSERT
      WITH CHECK (auth.uid() = from_user_id OR is_leadership(auth.uid()));
    
    CREATE POLICY "Users can delete own interests or leadership deletes all"
      ON public.tinder_interests FOR DELETE
      USING (auth.uid() = from_user_id OR is_leadership(auth.uid()));
  END IF;
END $$;

-- ============================================================
-- 12. tinder_do_fluxo_logs - Limpar e recriar (se existir)
-- ============================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tinder_do_fluxo_logs') THEN
    FOR pol IN 
      SELECT policyname FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'tinder_do_fluxo_logs'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.tinder_do_fluxo_logs', pol.policyname);
    END LOOP;
    
    CREATE POLICY "Only leadership can view logs"
      ON public.tinder_do_fluxo_logs FOR SELECT
      USING (is_leadership(auth.uid()));
    
    CREATE POLICY "Users can insert own logs"
      ON public.tinder_do_fluxo_logs FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 13. Verificação final
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
