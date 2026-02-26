-- Script para verificar se há dados antes da migração
-- Execute este script primeiro para verificar o estado atual

-- Verificar se há dados nas tabelas
SELECT 
  'tinder_mentor_profiles' as tabela,
  COUNT(*) as registros
FROM tinder_mentor_profiles
UNION ALL
SELECT 
  'tinder_expert_profiles' as tabela,
  COUNT(*) as registros
FROM tinder_expert_profiles
UNION ALL
SELECT 
  'tinder_service_profiles' as tabela,
  COUNT(*) as registros
FROM tinder_service_profiles
UNION ALL
SELECT 
  'tinder_jobs' as tabela,
  COUNT(*) as registros
FROM tinder_jobs
UNION ALL
SELECT 
  'users' as tabela,
  COUNT(*) as registros
FROM users;

-- Verificar estrutura atual das tabelas
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('tinder_mentor_profiles', 'tinder_expert_profiles', 'tinder_service_profiles', 'tinder_jobs')
  AND column_name IN ('user_id', 'creator_id')
ORDER BY table_name, column_name;
