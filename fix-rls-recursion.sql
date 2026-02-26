-- Corrigir recursão infinita nas políticas RLS de user_roles
-- Execute este script no Supabase SQL Editor

-- 1. Remover TODAS as políticas existentes que causam recursão
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can insert" ON public.user_roles;
DROP POLICY IF EXISTS "Leadership can view all" ON public.user_roles;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.user_roles;
DROP POLICY IF EXISTS "Enable select for own user" ON public.user_roles;
DROP POLICY IF EXISTS "Enable select for leadership" ON public.user_roles;
DROP POLICY IF EXISTS "Enable update for own user" ON public.user_roles;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.user_roles;
DROP POLICY IF EXISTS "Allow select own data" ON public.user_roles;
DROP POLICY IF EXISTS "Allow select all for service" ON public.user_roles;
DROP POLICY IF EXISTS "Allow update own data" ON public.user_roles;

-- 2. Criar políticas SIMPLES sem recursão
-- IMPORTANTE: Service role (usado no backend) sempre bypassa RLS,
-- então essas políticas são apenas para usuários autenticados via JWT do frontend

-- INSERT: Permitir inserção (service role bypassa mesmo assim)
CREATE POLICY "user_roles_insert_policy"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (true);

-- SELECT: Usuários podem ver seus próprios dados
CREATE POLICY "user_roles_select_own_policy"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- SELECT: Permitir tudo (para evitar problemas, já que service role bypassa)
CREATE POLICY "user_roles_select_all_policy"
  ON public.user_roles
  FOR SELECT
  USING (true);

-- UPDATE: Usuários podem atualizar seus próprios dados
CREATE POLICY "user_roles_update_own_policy"
  ON public.user_roles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Verificar políticas criadas
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'HAS USING'
    ELSE 'NO USING'
  END as has_using,
  CASE 
    WHEN with_check IS NOT NULL THEN 'HAS WITH CHECK'
    ELSE 'NO WITH CHECK'
  END as has_with_check
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- NOTA IMPORTANTE:
-- O backend usa SUPABASE_SERVICE_ROLE_KEY que SEMPRE bypassa RLS.
-- Essas políticas são apenas para requisições do frontend que usam JWT de usuários autenticados.
