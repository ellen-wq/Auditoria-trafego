-- Script para MIGRAR dados existentes de INTEGER para UUID
-- ⚠️ ATENÇÃO: Execute este script apenas se você TEM dados nas tabelas
-- Este script assume que você já tem usuários criados no auth.users

-- Passo 1: Criar tabela temporária para mapear IDs antigos para novos UUIDs
CREATE TEMP TABLE IF NOT EXISTS user_id_mapping (
  old_id INTEGER,
  new_uuid UUID,
  email TEXT
);

-- Passo 2: Preencher mapeamento (você precisa ajustar isso baseado nos seus dados)
-- Exemplo: se você tem usuários em auth.users, você precisa mapear manualmente
-- ou usar um script Node.js para fazer isso

-- Passo 3: Atualizar tinder_mentor_profiles
-- Primeiro, criar coluna temporária
ALTER TABLE tinder_mentor_profiles 
  ADD COLUMN IF NOT EXISTS user_id_new UUID;

-- Atualizar usando o mapeamento
UPDATE tinder_mentor_profiles tmp
SET user_id_new = um.new_uuid
FROM user_id_mapping um
WHERE tmp.user_id::INTEGER = um.old_id;

-- Dropar constraint antiga
ALTER TABLE tinder_mentor_profiles
  DROP CONSTRAINT IF EXISTS tinder_mentor_profiles_user_id_fkey;

-- Renomear colunas
ALTER TABLE tinder_mentor_profiles
  DROP COLUMN IF EXISTS user_id;

ALTER TABLE tinder_mentor_profiles
  RENAME COLUMN user_id_new TO user_id;

-- Adicionar constraint nova
ALTER TABLE tinder_mentor_profiles
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE tinder_mentor_profiles
  ADD CONSTRAINT tinder_mentor_profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Repetir para outras tabelas...
-- (Este é um exemplo - você precisará adaptar para suas necessidades)

-- NOTA: Este script é um template. Você precisará:
-- 1. Criar usuários no auth.users para cada registro em users
-- 2. Preencher a tabela user_id_mapping com o mapeamento correto
-- 3. Executar as atualizações
