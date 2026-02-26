-- ============================================================
-- Criar tabelas faltantes com UUID
-- Execute este script ANTES de rls-policies-complete.sql
-- ============================================================

-- 1. tinder_matches
CREATE TABLE IF NOT EXISTS tinder_matches (
  id SERIAL PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'MATCH',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user1_id, user2_id, type)
);

-- 2. tinder_favorites
CREATE TABLE IF NOT EXISTS tinder_favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'FAVORITE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, target_user_id, type)
);

-- 3. tinder_reviews
CREATE TABLE IF NOT EXISTS tinder_reviews (
  id SERIAL PRIMARY KEY,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_profile_id INTEGER NOT NULL REFERENCES tinder_service_profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. tinder_applications
CREATE TABLE IF NOT EXISTS tinder_applications (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES tinder_jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT DEFAULT '',
  portfolio_link TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (job_id, candidate_id)
);

-- 5. tinder_interests (se não existir)
CREATE TABLE IF NOT EXISTS tinder_interests (
  id SERIAL PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'INTEREST',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (from_user_id, to_user_id, type)
);

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_tinder_matches_user1 ON tinder_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_tinder_matches_user2 ON tinder_matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_tinder_favorites_user ON tinder_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_tinder_favorites_target ON tinder_favorites(target_user_id);
CREATE INDEX IF NOT EXISTS idx_tinder_reviews_reviewer ON tinder_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_tinder_reviews_service ON tinder_reviews(service_profile_id);
CREATE INDEX IF NOT EXISTS idx_tinder_applications_candidate ON tinder_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_tinder_applications_job ON tinder_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_tinder_interests_from ON tinder_interests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_tinder_interests_to ON tinder_interests(to_user_id);

-- Verificar tabelas criadas
SELECT 
  table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'tinder_matches',
    'tinder_favorites',
    'tinder_reviews',
    'tinder_applications',
    'tinder_interests'
  )
GROUP BY table_name
ORDER BY table_name;
