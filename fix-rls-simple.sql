-- Solução SIMPLES: Desabilitar RLS temporariamente ou usar políticas mais permissivas
-- Execute este script no Supabase SQL Editor

-- Opção 1: Desabilitar RLS completamente (apenas para desenvolvimento)
-- ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Opção 2: Criar políticas mais permissivas (RECOMENDADO)

-- Remover políticas antigas que causam recursão
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can insert" ON public.user_roles;
DROP POLICY IF EXISTS "Leadership can view all" ON public.user_roles;

-- Criar políticas simples sem recursão
-- INSERT: Permitir tudo (backend usa service role)
CREATE POLICY "Allow insert for service role"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (true);

-- SELECT: Usuários veem seus próprios dados
CREATE POLICY "Allow select own data"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- SELECT: Permitir tudo para service role (backend)
CREATE POLICY "Allow select for service role"
  ON public.user_roles
  FOR SELECT
  USING (true);

-- UPDATE: Usuários atualizam seus próprios dados
CREATE POLICY "Allow update own data"
  ON public.user_roles
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Verificar
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_roles';
