-- ============================================================
-- DESABILITAR RLS TEMPORARIAMENTE PARA TESTE
-- ⚠️ ATENÇÃO: Use apenas para debug! Reabilite depois.
-- ============================================================

-- Desabilitar RLS na tabela user_roles temporariamente
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Verificar se foi desabilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'user_roles';

-- Testar query
SELECT COUNT(*) as total_users FROM public.user_roles;
SELECT * FROM public.user_roles LIMIT 10;

-- ============================================================
-- PARA REABILITAR RLS DEPOIS DO TESTE:
-- ============================================================
-- ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
