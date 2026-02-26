-- Script para RECRIAR tabelas com UUID (apenas se não houver dados importantes)
-- ⚠️ ATENÇÃO: Este script DROPARÁ as tabelas existentes e recriará do zero
-- Use apenas se você não tem dados importantes ou já fez backup

-- 1. Dropar tabelas existentes (se existirem)
DROP TABLE IF EXISTS tinder_service_profiles CASCADE;
DROP TABLE IF EXISTS tinder_expert_profiles CASCADE;
DROP TABLE IF EXISTS tinder_mentor_profiles CASCADE;
DROP TABLE IF EXISTS tinder_jobs CASCADE;
DROP TABLE IF EXISTS tinder_matches CASCADE;
DROP TABLE IF EXISTS tinder_favorites CASCADE;

-- 2. Recriar tinder_mentor_profiles com UUID
CREATE TABLE IF NOT EXISTS tinder_mentor_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- 3. Recriar tinder_expert_profiles com UUID
CREATE TABLE IF NOT EXISTS tinder_expert_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  is_expert BOOLEAN DEFAULT FALSE,
  is_coproducer BOOLEAN DEFAULT FALSE,
  goal_text TEXT DEFAULT '',
  search_bio TEXT DEFAULT '',
  preferences_json JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Recriar tinder_service_profiles com UUID
CREATE TABLE IF NOT EXISTS tinder_service_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- 5. Recriar tinder_jobs com UUID (se necessário)
CREATE TABLE IF NOT EXISTS tinder_jobs (
  id SERIAL PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  specialty TEXT DEFAULT '',
  model TEXT DEFAULT '',
  location TEXT DEFAULT '',
  value REAL DEFAULT 0,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Criar índices
CREATE INDEX IF NOT EXISTS idx_tinder_mentor_profiles_user_id ON tinder_mentor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tinder_expert_profiles_user_id ON tinder_expert_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tinder_service_profiles_user_id ON tinder_service_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tinder_jobs_creator_id ON tinder_jobs(creator_id);
CREATE INDEX IF NOT EXISTS idx_tinder_jobs_status ON tinder_jobs(status);

-- 7. Verificar tabelas criadas
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('tinder_mentor_profiles', 'tinder_expert_profiles', 'tinder_service_profiles', 'tinder_jobs')
  AND column_name IN ('user_id', 'creator_id')
ORDER BY table_name, column_name;
