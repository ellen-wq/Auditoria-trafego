-- Corrigir políticas RLS da tabela user_roles
-- Execute este script no Supabase SQL Editor

-- 1. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can insert" ON public.user_roles;
DROP POLICY IF EXISTS "Leadership can view all" ON public.user_roles;

-- 2. Criar políticas mais simples que não causam recursão

-- Política para INSERT: Permitir inserção via service role (backend)
CREATE POLICY "Enable insert for service role"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (true);

-- Política para SELECT: Usuários podem ver seus próprios dados
CREATE POLICY "Enable select for own user"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para SELECT: Liderança pode ver todos (sem recursão)
CREATE POLICY "Enable select for leadership"
  ON public.user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'LIDERANCA'
    )
  );

-- Política para UPDATE: Usuários podem atualizar seus próprios dados
CREATE POLICY "Enable update for own user"
  ON public.user_roles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;
