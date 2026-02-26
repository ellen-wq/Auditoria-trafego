-- Script para atualizar tabelas relacionadas para usar UUID
-- Execute este script APÓS criar a tabela user_roles
-- ⚠️ ATENÇÃO: Este script assume que você NÃO tem dados ou já migrou os dados
-- Se você tem dados existentes, use recreate-tables-with-uuid.sql ou migrate-existing-data.sql

-- Verificar se há dados antes de continuar
DO $$
DECLARE
  mentor_count INTEGER;
  expert_count INTEGER;
  service_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mentor_count FROM tinder_mentor_profiles;
  SELECT COUNT(*) INTO expert_count FROM tinder_expert_profiles;
  SELECT COUNT(*) INTO service_count FROM tinder_service_profiles;
  
  IF mentor_count > 0 OR expert_count > 0 OR service_count > 0 THEN
    RAISE EXCEPTION 'Tabelas contêm dados! Use recreate-tables-with-uuid.sql (se não precisa dos dados) ou migrate-existing-data.sql (para migrar dados)';
  END IF;
END $$;

-- 1. Atualizar tinder_mentor_profiles (apenas se vazio)
ALTER TABLE IF EXISTS tinder_mentor_profiles
  DROP CONSTRAINT IF EXISTS tinder_mentor_profiles_user_id_fkey;

-- Não podemos converter INTEGER para UUID diretamente sem dados
-- Se a tabela está vazia, podemos dropar e recriar
DROP TABLE IF EXISTS tinder_mentor_profiles CASCADE;
CREATE TABLE tinder_mentor_profiles (
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

ALTER TABLE IF EXISTS tinder_mentor_profiles
  ADD CONSTRAINT tinder_mentor_profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Atualizar tinder_expert_profiles
DROP TABLE IF EXISTS tinder_expert_profiles CASCADE;
CREATE TABLE tinder_expert_profiles (
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

-- 3. Atualizar tinder_service_profiles
DROP TABLE IF EXISTS tinder_service_profiles CASCADE;
CREATE TABLE tinder_service_profiles (
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

-- 4. Atualizar tinder_jobs (se existir)
-- Verificar se há dados primeiro
DO $$
DECLARE
  jobs_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO jobs_count FROM tinder_jobs;
  
  IF jobs_count > 0 THEN
    RAISE EXCEPTION 'tinder_jobs contém dados! Não é possível converter automaticamente. Use migrate-existing-data.sql';
  END IF;
END $$;

DROP TABLE IF EXISTS tinder_jobs CASCADE;
CREATE TABLE tinder_jobs (
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

-- 5. Atualizar tinder_matches (se existir e vazio)
DROP TABLE IF EXISTS tinder_matches CASCADE;
-- Recriar apenas se necessário (comentado por padrão)
-- CREATE TABLE tinder_matches (
--   id SERIAL PRIMARY KEY,
--   user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   UNIQUE(user1_id, user2_id)
-- );

-- 6. Atualizar tinder_favorites (se existir e vazio)
DROP TABLE IF EXISTS tinder_favorites CASCADE;
-- Recriar apenas se necessário (comentado por padrão)
-- CREATE TABLE tinder_favorites (
--   id SERIAL PRIMARY KEY,
--   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   type TEXT DEFAULT 'LIKE',
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   UNIQUE(user_id, target_user_id, type)
-- );

-- 7. Atualizar audits (se existir e referenciar users)
-- ⚠️ NÃO ATUALIZAR AUTOMATICAMENTE - requer migração de dados
-- Se você precisa atualizar audits, use migrate-existing-data.sql

-- 8. Atualizar creatives (se existir e referenciar users)
-- ⚠️ NÃO ATUALIZAR AUTOMATICAMENTE - requer migração de dados
-- Se você precisa atualizar creatives, use migrate-existing-data.sql

-- Verificar tabelas atualizadas
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('user_id', 'creator_id', 'user1_id', 'user2_id', 'target_user_id')
  AND data_type = 'uuid'
ORDER BY table_name, column_name;
