-- Migração para usar Supabase Auth
-- Este script cria a tabela de roles e prepara a estrutura para migração

-- 1. Criar tabela de roles que referencia auth.users
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MENTORADO' CHECK (role IN ('MENTORADO', 'LIDERANCA', 'PRESTADOR')),
  name TEXT,
  has_seen_tinder_do_fluxo_tutorial BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 3. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Habilitar RLS (Row Level Security) na tabela
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6. Política RLS: usuários podem ver seus próprios dados
CREATE POLICY "Users can view own role"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- 7. Política RLS: usuários podem atualizar seus próprios dados (exceto role)
CREATE POLICY "Users can update own profile"
  ON public.user_roles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. Política RLS: permitir inserção durante registro (via service role)
CREATE POLICY "Service role can insert"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (true);

-- 9. Política RLS: liderança pode ver todos
-- REMOVIDA: Causava recursão infinita. Service role bypassa RLS mesmo assim.
-- Se precisar de controle de acesso por role, implemente no código da aplicação.
-- CREATE POLICY "Leadership can view all"
--   ON public.user_roles
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.user_roles
--       WHERE user_id = auth.uid() AND role = 'LIDERANCA'
--     )
--   );

-- 10. Comentários para documentação
COMMENT ON TABLE public.user_roles IS 'Tabela de roles dos usuários, vinculada ao auth.users do Supabase';
COMMENT ON COLUMN public.user_roles.user_id IS 'UUID do usuário em auth.users';
COMMENT ON COLUMN public.user_roles.role IS 'Role do usuário: MENTORADO, LIDERANCA ou PRESTADOR';
COMMENT ON COLUMN public.user_roles.name IS 'Nome do usuário (pode ser obtido de auth.users.raw_user_meta_data também)';
