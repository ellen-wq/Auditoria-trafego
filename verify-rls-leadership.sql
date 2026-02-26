-- ============================================================
-- Verificar e corrigir acesso de LIDERANCA
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- IMPORTANTE: O backend usa SUPABASE_SERVICE_ROLE_KEY que bypassa RLS automaticamente.
-- Este script verifica se as políticas estão corretas para LIDERANCA.

-- 1. Verificar se a função is_leadership está funcionando
SELECT 
  'Função is_leadership' as check_type,
  EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'is_leadership'
  ) as exists;

-- 2. Testar a função is_leadership com um usuário LIDERANCA
-- (Substitua o UUID abaixo pelo UUID de um usuário LIDERANCA)
-- SELECT is_leadership('SEU-UUID-LIDERANCA-AQUI') as is_leadership_test;

-- 3. Verificar todas as políticas que usam is_leadership
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual::text LIKE '%is_leadership%' THEN 'Usa is_leadership'
    WHEN with_check::text LIKE '%is_leadership%' THEN 'Usa is_leadership (WITH CHECK)'
    ELSE 'Não usa is_leadership'
  END as uses_leadership_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual::text LIKE '%is_leadership%' OR with_check::text LIKE '%is_leadership%')
ORDER BY tablename, policyname;

-- 4. Verificar se RLS está habilitado nas tabelas
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
  )
ORDER BY tablename;

-- 5. Listar todas as políticas por tabela
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
