-- ============================================
-- ADICIONAR COLUNA availability_tags
-- ============================================
-- Execute este script no SQL Editor do Supabase Dashboard

-- Adicionar coluna availability_tags em tinder_mentor_profiles
ALTER TABLE tinder_mentor_profiles 
  ADD COLUMN IF NOT EXISTS availability_tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Adicionar coluna availability_tags em tinder_service_profiles
ALTER TABLE tinder_service_profiles 
  ADD COLUMN IF NOT EXISTS availability_tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Verificar se as colunas foram adicionadas
SELECT 
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name IN ('tinder_mentor_profiles', 'tinder_service_profiles')
  AND column_name = 'availability_tags'
ORDER BY table_name;
