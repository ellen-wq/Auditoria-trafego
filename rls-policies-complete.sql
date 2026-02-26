-- ============================================================
-- Políticas RLS (Row Level Security) Completas
-- Aplicar este script no Supabase SQL Editor
-- ============================================================

-- Função auxiliar para verificar se usuário é LIDERANCA
CREATE OR REPLACE FUNCTION is_leadership(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid AND role = 'LIDERANCA'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 1. user_roles (já tem políticas básicas, vamos melhorar)
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can insert" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to update own profile" ON public.user_roles;
DROP POLICY IF EXISTS "Allow service role to insert" ON public.user_roles;

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
-- 2. tinder_mentor_profiles
-- ============================================================

ALTER TABLE public.tinder_mentor_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Próprio perfil, LIDERANCA vê todos, outros podem ver públicos (para feed)
CREATE POLICY "Users can view own mentor profile or leadership sees all"
  ON public.tinder_mentor_profiles
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    is_leadership(auth.uid())
  );

-- INSERT: MENTORADO pode criar próprio, LIDERANCA pode criar qualquer
CREATE POLICY "Mentorados can insert own profile or leadership inserts any"
  ON public.tinder_mentor_profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    is_leadership(auth.uid())
  );

-- UPDATE: Próprio perfil, LIDERANCA pode atualizar qualquer
CREATE POLICY "Users can update own mentor profile or leadership updates all"
  ON public.tinder_mentor_profiles
  FOR UPDATE
  USING (
    auth.uid() = user_id OR
    is_leadership(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id OR
    is_leadership(auth.uid())
  );

-- DELETE: Próprio perfil, LIDERANCA pode deletar qualquer
CREATE POLICY "Users can delete own mentor profile or leadership deletes all"
  ON public.tinder_mentor_profiles
  FOR DELETE
  USING (
    auth.uid() = user_id OR
    is_leadership(auth.uid())
  );

-- ============================================================
-- 3. tinder_expert_profiles
-- ============================================================

ALTER TABLE public.tinder_expert_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Próprio perfil, LIDERANCA vê todos, outros podem ver públicos (para feed)
CREATE POLICY "Users can view own expert profile or leadership sees all"
  ON public.tinder_expert_profiles
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    is_leadership(auth.uid())
  );

-- INSERT: MENTORADO pode criar próprio, LIDERANCA pode criar qualquer
CREATE POLICY "Mentorados can insert own expert profile or leadership inserts any"
  ON public.tinder_expert_profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    is_leadership(auth.uid())
  );

-- UPDATE: Próprio perfil, LIDERANCA pode atualizar qualquer
CREATE POLICY "Users can update own expert profile or leadership updates all"
  ON public.tinder_expert_profiles
  FOR UPDATE
  USING (
    auth.uid() = user_id OR
    is_leadership(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id OR
    is_leadership(auth.uid())
  );

-- DELETE: Próprio perfil, LIDERANCA pode deletar qualquer
CREATE POLICY "Users can delete own expert profile or leadership deletes all"
  ON public.tinder_expert_profiles
  FOR DELETE
  USING (
    auth.uid() = user_id OR
    is_leadership(auth.uid())
  );

-- ============================================================
-- 4. tinder_service_profiles
-- ============================================================

ALTER TABLE public.tinder_service_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Próprio perfil, LIDERANCA vê todos, outros podem ver públicos (para feed)
CREATE POLICY "Users can view own service profile or leadership sees all"
  ON public.tinder_service_profiles
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    is_leadership(auth.uid())
  );

-- INSERT: PRESTADOR pode criar próprio, LIDERANCA pode criar qualquer
CREATE POLICY "Prestadores can insert own service profile or leadership inserts any"
  ON public.tinder_service_profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    is_leadership(auth.uid())
  );

-- UPDATE: Próprio perfil, LIDERANCA pode atualizar qualquer
CREATE POLICY "Users can update own service profile or leadership updates all"
  ON public.tinder_service_profiles
  FOR UPDATE
  USING (
    auth.uid() = user_id OR
    is_leadership(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id OR
    is_leadership(auth.uid())
  );

-- DELETE: Próprio perfil, LIDERANCA pode deletar qualquer
CREATE POLICY "Users can delete own service profile or leadership deletes all"
  ON public.tinder_service_profiles
  FOR DELETE
  USING (
    auth.uid() = user_id OR
    is_leadership(auth.uid())
  );

-- ============================================================
-- 5. tinder_jobs
-- ============================================================

ALTER TABLE public.tinder_jobs ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos podem ver vagas abertas, criador vê próprias, LIDERANCA vê todas
CREATE POLICY "Everyone can view open jobs, creator sees own, leadership sees all"
  ON public.tinder_jobs
  FOR SELECT
  USING (
    status = 'OPEN' OR
    auth.uid() = creator_id OR
    is_leadership(auth.uid())
  );

-- INSERT: MENTORADO e LIDERANCA podem criar vagas
CREATE POLICY "Mentorados and leadership can create jobs"
  ON public.tinder_jobs
  FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id AND (
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('MENTORADO', 'LIDERANCA'))
    )
  );

-- UPDATE: Criador pode atualizar própria vaga, LIDERANCA pode atualizar qualquer
CREATE POLICY "Creator can update own job or leadership updates all"
  ON public.tinder_jobs
  FOR UPDATE
  USING (
    auth.uid() = creator_id OR
    is_leadership(auth.uid())
  )
  WITH CHECK (
    auth.uid() = creator_id OR
    is_leadership(auth.uid())
  );

-- DELETE: Criador pode deletar própria vaga, LIDERANCA pode deletar qualquer
CREATE POLICY "Creator can delete own job or leadership deletes all"
  ON public.tinder_jobs
  FOR DELETE
  USING (
    auth.uid() = creator_id OR
    is_leadership(auth.uid())
  );

-- ============================================================
-- 6. tinder_matches
-- ============================================================

-- Verificar se a tabela existe antes de aplicar políticas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tinder_matches') THEN
    ALTER TABLE public.tinder_matches ENABLE ROW LEVEL SECURITY;

    -- SELECT: Usuários podem ver matches onde estão envolvidos, LIDERANCA vê todos
    DROP POLICY IF EXISTS "Users can view own matches or leadership sees all" ON public.tinder_matches;
    CREATE POLICY "Users can view own matches or leadership sees all"
      ON public.tinder_matches
      FOR SELECT
      USING (
        auth.uid() = user1_id OR
        auth.uid() = user2_id OR
        is_leadership(auth.uid())
      );

    -- INSERT: Usuários podem criar matches onde estão envolvidos, LIDERANCA pode criar qualquer
    DROP POLICY IF EXISTS "Users can create matches involving themselves or leadership creates any" ON public.tinder_matches;
    CREATE POLICY "Users can create matches involving themselves or leadership creates any"
      ON public.tinder_matches
      FOR INSERT
      WITH CHECK (
        auth.uid() = user1_id OR
        auth.uid() = user2_id OR
        is_leadership(auth.uid())
      );

    -- UPDATE: Usuários podem atualizar matches onde estão envolvidos, LIDERANCA pode atualizar qualquer
    DROP POLICY IF EXISTS "Users can update own matches or leadership updates all" ON public.tinder_matches;
    CREATE POLICY "Users can update own matches or leadership updates all"
      ON public.tinder_matches
      FOR UPDATE
      USING (
        auth.uid() = user1_id OR
        auth.uid() = user2_id OR
        is_leadership(auth.uid())
      )
      WITH CHECK (
        auth.uid() = user1_id OR
        auth.uid() = user2_id OR
        is_leadership(auth.uid())
      );

    -- DELETE: Usuários podem deletar matches onde estão envolvidos, LIDERANCA pode deletar qualquer
    DROP POLICY IF EXISTS "Users can delete own matches or leadership deletes all" ON public.tinder_matches;
    CREATE POLICY "Users can delete own matches or leadership deletes all"
      ON public.tinder_matches
      FOR DELETE
      USING (
        auth.uid() = user1_id OR
        auth.uid() = user2_id OR
        is_leadership(auth.uid())
      );
  END IF;
END $$;

-- ============================================================
-- 7. tinder_favorites
-- ============================================================

-- Verificar se a tabela existe antes de aplicar políticas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tinder_favorites') THEN
    ALTER TABLE public.tinder_favorites ENABLE ROW LEVEL SECURITY;

    -- SELECT: Usuários podem ver próprios favoritos, LIDERANCA vê todos
    DROP POLICY IF EXISTS "Users can view own favorites or leadership sees all" ON public.tinder_favorites;
    CREATE POLICY "Users can view own favorites or leadership sees all"
      ON public.tinder_favorites
      FOR SELECT
      USING (
        auth.uid() = user_id OR
        is_leadership(auth.uid())
      );

    -- INSERT: Usuários podem criar próprios favoritos, LIDERANCA pode criar qualquer
    DROP POLICY IF EXISTS "Users can create own favorites or leadership creates any" ON public.tinder_favorites;
    CREATE POLICY "Users can create own favorites or leadership creates any"
      ON public.tinder_favorites
      FOR INSERT
      WITH CHECK (
        auth.uid() = user_id OR
        is_leadership(auth.uid())
      );

    -- DELETE: Usuários podem deletar próprios favoritos, LIDERANCA pode deletar qualquer
    DROP POLICY IF EXISTS "Users can delete own favorites or leadership deletes all" ON public.tinder_favorites;
    CREATE POLICY "Users can delete own favorites or leadership deletes all"
      ON public.tinder_favorites
      FOR DELETE
      USING (
        auth.uid() = user_id OR
        is_leadership(auth.uid())
      );
  END IF;
END $$;

-- ============================================================
-- 8. tinder_reviews
-- ============================================================

-- Verificar se a tabela existe antes de aplicar políticas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tinder_reviews') THEN
    ALTER TABLE public.tinder_reviews ENABLE ROW LEVEL SECURITY;

    -- SELECT: Todos podem ver reviews, PRESTADOR pode ver reviews do próprio perfil, LIDERANCA vê todos
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

    -- INSERT: MENTORADO e LIDERANCA podem criar reviews
    DROP POLICY IF EXISTS "Mentorados and leadership can create reviews" ON public.tinder_reviews;
    CREATE POLICY "Mentorados and leadership can create reviews"
      ON public.tinder_reviews
      FOR INSERT
      WITH CHECK (
        (auth.uid() = reviewer_id AND EXISTS (
          SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('MENTORADO', 'LIDERANCA')
        )) OR
        is_leadership(auth.uid())
      );

    -- UPDATE: Apenas LIDERANCA pode atualizar reviews
    DROP POLICY IF EXISTS "Only leadership can update reviews" ON public.tinder_reviews;
    CREATE POLICY "Only leadership can update reviews"
      ON public.tinder_reviews
      FOR UPDATE
      USING (is_leadership(auth.uid()))
      WITH CHECK (is_leadership(auth.uid()));

    -- DELETE: Apenas LIDERANCA pode deletar reviews
    DROP POLICY IF EXISTS "Only leadership can delete reviews" ON public.tinder_reviews;
    CREATE POLICY "Only leadership can delete reviews"
      ON public.tinder_reviews
      FOR DELETE
      USING (is_leadership(auth.uid()));
  END IF;
END $$;

-- ============================================================
-- 9. tinder_applications
-- ============================================================

-- Verificar se a tabela existe antes de aplicar políticas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tinder_applications') THEN
    ALTER TABLE public.tinder_applications ENABLE ROW LEVEL SECURITY;

    -- SELECT: Candidato vê próprias aplicações, criador da vaga vê aplicações, LIDERANCA vê todas
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

    -- INSERT: PRESTADOR e MENTORADO podem criar aplicações, LIDERANCA pode criar qualquer
    DROP POLICY IF EXISTS "Prestadores and mentorados can create applications or leadership creates any" ON public.tinder_applications;
    CREATE POLICY "Prestadores and mentorados can create applications or leadership creates any"
      ON public.tinder_applications
      FOR INSERT
      WITH CHECK (
        (auth.uid() = candidate_id AND EXISTS (
          SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('PRESTADOR', 'MENTORADO', 'LIDERANCA')
        )) OR
        is_leadership(auth.uid())
      );

    -- UPDATE: Candidato pode atualizar própria aplicação, criador da vaga pode atualizar, LIDERANCA pode atualizar qualquer
    DROP POLICY IF EXISTS "Candidate can update own application, job creator updates, leadership updates all" ON public.tinder_applications;
    CREATE POLICY "Candidate can update own application, job creator updates, leadership updates all"
      ON public.tinder_applications
      FOR UPDATE
      USING (
        auth.uid() = candidate_id OR
        EXISTS (
          SELECT 1 FROM public.tinder_jobs
          WHERE id = tinder_applications.job_id
          AND creator_id = auth.uid()
        ) OR
        is_leadership(auth.uid())
      )
      WITH CHECK (
        auth.uid() = candidate_id OR
        EXISTS (
          SELECT 1 FROM public.tinder_jobs
          WHERE id = tinder_applications.job_id
          AND creator_id = auth.uid()
        ) OR
        is_leadership(auth.uid())
      );

    -- DELETE: Candidato pode deletar própria aplicação, criador da vaga pode deletar, LIDERANCA pode deletar qualquer
    DROP POLICY IF EXISTS "Candidate can delete own application, job creator deletes, leadership deletes all" ON public.tinder_applications;
    CREATE POLICY "Candidate can delete own application, job creator deletes, leadership deletes all"
      ON public.tinder_applications
      FOR DELETE
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

-- ============================================================
-- 10. audits
-- ============================================================
-- IGNORADA: Tabela ainda usa INTEGER para user_id, não migrada para UUID
-- RLS será aplicado quando a tabela for migrada para UUID

-- ============================================================
-- 11. campaigns
-- ============================================================
-- IGNORADA: Tabela depende de audits que ainda usa INTEGER
-- RLS será aplicado quando audits for migrada para UUID

-- ============================================================
-- 12. recommendations
-- ============================================================
-- IGNORADA: Tabela depende de audits que ainda usa INTEGER
-- RLS será aplicado quando audits for migrada para UUID

-- ============================================================
-- 13. creatives
-- ============================================================
-- IGNORADA: Tabela depende de audits que ainda usa INTEGER
-- RLS será aplicado quando audits for migrada para UUID

-- ============================================================
-- 14. tinder_do_fluxo_logs
-- ============================================================

-- Verificar se a tabela existe antes de aplicar políticas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tinder_do_fluxo_logs') THEN
    ALTER TABLE public.tinder_do_fluxo_logs ENABLE ROW LEVEL SECURITY;

    -- SELECT: Apenas LIDERANCA pode ver logs
    DROP POLICY IF EXISTS "Only leadership can view logs" ON public.tinder_do_fluxo_logs;
    CREATE POLICY "Only leadership can view logs"
      ON public.tinder_do_fluxo_logs
      FOR SELECT
      USING (is_leadership(auth.uid()));

    -- INSERT: Backend pode inserir (via service role), usuários podem inserir próprios logs
    DROP POLICY IF EXISTS "Users can insert own logs or service role inserts any" ON public.tinder_do_fluxo_logs;
    CREATE POLICY "Users can insert own logs or service role inserts any"
      ON public.tinder_do_fluxo_logs
      FOR INSERT
      WITH CHECK (
        auth.uid() = actor_user_id OR
        actor_user_id IS NULL
      );
  END IF;
END $$;

-- ============================================================
-- 15. tinder_interests (se existir)
-- ============================================================

-- Verificar se a tabela existe antes de aplicar políticas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tinder_interests') THEN
    ALTER TABLE public.tinder_interests ENABLE ROW LEVEL SECURITY;

    -- SELECT: Usuários podem ver interesses onde estão envolvidos, LIDERANCA vê todos
    DROP POLICY IF EXISTS "Users can view own interests or leadership sees all" ON public.tinder_interests;
    CREATE POLICY "Users can view own interests or leadership sees all"
      ON public.tinder_interests
      FOR SELECT
      USING (
        auth.uid() = from_user_id OR
        auth.uid() = to_user_id OR
        is_leadership(auth.uid())
      );

    -- INSERT: Usuários podem criar interesses onde estão envolvidos, LIDERANCA pode criar qualquer
    DROP POLICY IF EXISTS "Users can create own interests or leadership creates any" ON public.tinder_interests;
    CREATE POLICY "Users can create own interests or leadership creates any"
      ON public.tinder_interests
      FOR INSERT
      WITH CHECK (
        auth.uid() = from_user_id OR
        is_leadership(auth.uid())
      );

    -- DELETE: Usuários podem deletar próprios interesses, LIDERANCA pode deletar qualquer
    DROP POLICY IF EXISTS "Users can delete own interests or leadership deletes all" ON public.tinder_interests;
    CREATE POLICY "Users can delete own interests or leadership deletes all"
      ON public.tinder_interests
      FOR DELETE
      USING (
        auth.uid() = from_user_id OR
        is_leadership(auth.uid())
      );
  END IF;
END $$;

-- ============================================================
-- Verificação final
-- ============================================================

-- Listar todas as tabelas com RLS habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
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
    -- Nota: audits, campaigns, recommendations e creatives foram ignoradas
    -- pois ainda usam INTEGER para user_id e não foram migradas para UUID
  )
ORDER BY tablename;
