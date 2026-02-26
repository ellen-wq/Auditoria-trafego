-- ============================================================
-- Testar queries na tabela user_roles
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- 1. Verificar se a tabela existe e tem dados
SELECT COUNT(*) as total_users FROM public.user_roles;

-- 2. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'user_roles';

-- 3. Verificar todas as políticas na tabela
SELECT 
  policyname,
  cmd as operation,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'user_roles'
ORDER BY cmd, policyname;

-- 4. Testar query simples (deve funcionar mesmo com RLS)
SELECT 
  user_id,
  name,
  role,
  created_at
FROM public.user_roles
ORDER BY created_at DESC
LIMIT 10;

-- 5. Verificar se há usuários LIDERANCA
SELECT 
  COUNT(*) as total_leadership,
  STRING_AGG(name, ', ') as leadership_names
FROM public.user_roles
WHERE role = 'LIDERANCA';

-- 6. Verificar função is_leadership (substitua o UUID por um UUID de LIDERANCA real)
-- SELECT is_leadership('SEU-UUID-LIDERANCA-AQUI');

-- 7. Verificar se SERVICE_ROLE_KEY bypassa RLS
-- Esta query deve funcionar mesmo com RLS habilitado quando executada via SERVICE_ROLE_KEY
SELECT 
  'RLS Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'user_roles' 
      AND rowsecurity = true
    ) THEN 'RLS está HABILITADO'
    ELSE 'RLS está DESABILITADO'
  END as status;
