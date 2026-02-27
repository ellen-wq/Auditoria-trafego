-- ============================================================
-- Script para criar índices de busca performáticos
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- 1. Ativar extensão pg_trgm para busca fuzzy
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Índice GIN para busca em posts (comunidade)
CREATE INDEX IF NOT EXISTS idx_posts_search_titulo 
ON public.posts 
USING gin (titulo gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_posts_search_conteudo 
ON public.posts 
USING gin (conteudo gin_trgm_ops);

-- Índice composto para busca completa
CREATE INDEX IF NOT EXISTS idx_posts_search_full 
ON public.posts 
USING gin (
  to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(conteudo, ''))
);

-- 3. Índice para busca por autor_nome (via user_roles)
CREATE INDEX IF NOT EXISTS idx_user_roles_name_search 
ON public.user_roles 
USING gin (name gin_trgm_ops);

-- 4. Índice para busca em tinder_expert_profiles
CREATE INDEX IF NOT EXISTS idx_expert_profiles_goal_search 
ON public.tinder_expert_profiles 
USING gin (goal_text gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_expert_profiles_bio_search 
ON public.tinder_expert_profiles 
USING gin (search_bio gin_trgm_ops);

-- 5. Índice para busca em tinder_service_profiles
CREATE INDEX IF NOT EXISTS idx_service_profiles_specialty 
ON public.tinder_service_profiles 
USING gin (specialty gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_service_profiles_bio_search 
ON public.tinder_service_profiles 
USING gin (bio gin_trgm_ops);

-- 6. Índice para busca em tinder_jobs
CREATE INDEX IF NOT EXISTS idx_jobs_search_title 
ON public.tinder_jobs 
USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_jobs_search_description 
ON public.tinder_jobs 
USING gin (description gin_trgm_ops);

-- 7. Índices para filtros comuns
CREATE INDEX IF NOT EXISTS idx_posts_tema_created 
ON public.posts (tema_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_expert_profiles_type 
ON public.tinder_expert_profiles (is_expert, is_coproducer);

CREATE INDEX IF NOT EXISTS idx_service_profiles_specialty_rating 
ON public.tinder_service_profiles (specialty);

-- 8. Verificação
SELECT 
  schemaname,
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%_search%'
ORDER BY tablename, indexname;
