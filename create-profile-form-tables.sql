-- ============================================
-- MIGRATIONS PARA FORMULÁRIO DE PERFIL DINÂMICO
-- ============================================
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. ADICIONAR CAMPO tipo_usuario EM user_roles
-- Verificar se a coluna já existe antes de adicionar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_roles' AND column_name = 'tipo_usuario'
  ) THEN
    ALTER TABLE user_roles ADD COLUMN tipo_usuario TEXT CHECK (tipo_usuario IN ('mentorado', 'aluno'));
  END IF;
END $$;

-- 1.1. POPULAR tipo_usuario BASEADO NO role EXISTENTE
-- MENTORADO → tipo_usuario = 'mentorado'
-- PRESTADOR → tipo_usuario = 'aluno'
-- IMPORTANTE: Atualizar TODOS os registros, não apenas os NULL
UPDATE user_roles 
SET tipo_usuario = CASE 
  WHEN role = 'MENTORADO' THEN 'mentorado'
  WHEN role = 'PRESTADOR' THEN 'aluno'
  ELSE NULL
END
WHERE role IN ('MENTORADO', 'PRESTADOR');

-- 1.2. DEFINIR DEFAULT PARA NOVOS REGISTROS
ALTER TABLE user_roles 
  ALTER COLUMN tipo_usuario SET DEFAULT 'mentorado';

-- 2. ATUALIZAR PROFILES (se usar tabela profiles separada)
-- Se não existir, vamos usar as tabelas existentes (tinder_mentor_profiles, etc)
-- Adicionar campos faltantes nas tabelas existentes

-- tinder_mentor_profiles já tem os campos básicos, vamos garantir que tem todos
ALTER TABLE tinder_mentor_profiles 
  ADD COLUMN IF NOT EXISTS headline TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS anos_experiencia INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS horas_semanais INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS disponivel BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS idiomas TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS modelo_trabalho TEXT DEFAULT 'remoto' CHECK (modelo_trabalho IN ('remoto', 'hibrido', 'presencial', 'indiferente'));

-- tinder_expert_profiles - adicionar campos se necessário
ALTER TABLE tinder_expert_profiles 
  ADD COLUMN IF NOT EXISTS headline TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS anos_experiencia INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS horas_semanais INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS disponivel BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS idiomas TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS modelo_trabalho TEXT DEFAULT 'remoto';

-- tinder_service_profiles - adicionar campos se necessário
ALTER TABLE tinder_service_profiles 
  ADD COLUMN IF NOT EXISTS headline TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS anos_experiencia INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS horas_semanais INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS disponivel BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS idiomas TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS modelo_trabalho TEXT DEFAULT 'remoto' CHECK (modelo_trabalho IN ('remoto', 'hibrido', 'presencial', 'indiferente'));

-- 3. CRIAR TABELA expert_details
CREATE TABLE IF NOT EXISTS expert_details (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_produto TEXT DEFAULT '',
  preco NUMERIC(10,2) DEFAULT 0,
  modelo TEXT DEFAULT '' CHECK (modelo IN ('perpétuo', 'lançamento', 'assinatura', '')),
  precisa_trafego BOOLEAN DEFAULT FALSE,
  precisa_coprodutor BOOLEAN DEFAULT FALSE,
  precisa_copy BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CRIAR TABELA coprodutor_details
CREATE TABLE IF NOT EXISTS coprodutor_details (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  faz_trafego BOOLEAN DEFAULT FALSE,
  faz_lancamento BOOLEAN DEFAULT FALSE,
  faz_perpetuo BOOLEAN DEFAULT FALSE,
  ticket_minimo NUMERIC(10,2) DEFAULT 0,
  percentual_minimo INTEGER DEFAULT 0 CHECK (percentual_minimo >= 0 AND percentual_minimo <= 100),
  aceita_sociedade BOOLEAN DEFAULT FALSE,
  aceita_fee_percentual BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CRIAR TABELA prestador_details
CREATE TABLE IF NOT EXISTS prestador_details (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  servicos TEXT[] DEFAULT ARRAY[]::TEXT[],
  valor_minimo NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CRIAR TABELA profile_skills (habilidades principais)
CREATE TABLE IF NOT EXISTS profile_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL CHECK (categoria IN ('copywriter', 'trafego_pago', 'automacao_ia')),
  nivel INTEGER NOT NULL DEFAULT 0 CHECK (nivel >= 0 AND nivel <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, categoria)
);

-- 7. CRIAR TABELA profile_skills_extra (habilidades extras)
CREATE TABLE IF NOT EXISTS profile_skills_extra (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  nivel INTEGER NOT NULL DEFAULT 0 CHECK (nivel >= 0 AND nivel <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_expert_details_user_id ON expert_details(user_id);
CREATE INDEX IF NOT EXISTS idx_coprodutor_details_user_id ON coprodutor_details(user_id);
CREATE INDEX IF NOT EXISTS idx_prestador_details_user_id ON prestador_details(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_skills_user_id ON profile_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_skills_extra_user_id ON profile_skills_extra(user_id);

-- 9. HABILITAR RLS
ALTER TABLE expert_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE coprodutor_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestador_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_skills_extra ENABLE ROW LEVEL SECURITY;

-- 10. POLÍTICAS RLS PARA expert_details
DROP POLICY IF EXISTS "Users can view all expert details" ON expert_details;
DROP POLICY IF EXISTS "Users can manage their own expert details" ON expert_details;

CREATE POLICY "Users can view all expert details" ON expert_details
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own expert details" ON expert_details
  FOR ALL USING (auth.uid() = user_id);

-- 11. POLÍTICAS RLS PARA coprodutor_details
DROP POLICY IF EXISTS "Users can view all coprodutor details" ON coprodutor_details;
DROP POLICY IF EXISTS "Users can manage their own coprodutor details" ON coprodutor_details;

CREATE POLICY "Users can view all coprodutor details" ON coprodutor_details
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own coprodutor details" ON coprodutor_details
  FOR ALL USING (auth.uid() = user_id);

-- 12. POLÍTICAS RLS PARA prestador_details
DROP POLICY IF EXISTS "Users can view all prestador details" ON prestador_details;
DROP POLICY IF EXISTS "Users can manage their own prestador details" ON prestador_details;

CREATE POLICY "Users can view all prestador details" ON prestador_details
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own prestador details" ON prestador_details
  FOR ALL USING (auth.uid() = user_id);

-- 13. POLÍTICAS RLS PARA profile_skills
DROP POLICY IF EXISTS "Users can view all skills" ON profile_skills;
DROP POLICY IF EXISTS "Users can manage their own skills" ON profile_skills;

CREATE POLICY "Users can view all skills" ON profile_skills
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own skills" ON profile_skills
  FOR ALL USING (auth.uid() = user_id);

-- 14. POLÍTICAS RLS PARA profile_skills_extra
DROP POLICY IF EXISTS "Users can view all extra skills" ON profile_skills_extra;
DROP POLICY IF EXISTS "Users can manage their own extra skills" ON profile_skills_extra;

CREATE POLICY "Users can view all extra skills" ON profile_skills_extra
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own extra skills" ON profile_skills_extra
  FOR ALL USING (auth.uid() = user_id);

-- 15. VERIFICAR SE AS TABELAS FORAM CRIADAS
SELECT 
  'expert_details' as tabela,
  COUNT(*) as registros
FROM expert_details
UNION ALL
SELECT 
  'coprodutor_details' as tabela,
  COUNT(*) as registros
FROM coprodutor_details
UNION ALL
SELECT 
  'prestador_details' as tabela,
  COUNT(*) as registros
FROM prestador_details
UNION ALL
SELECT 
  'profile_skills' as tabela,
  COUNT(*) as registros
FROM profile_skills
UNION ALL
SELECT 
  'profile_skills_extra' as tabela,
  COUNT(*) as registros
FROM profile_skills_extra;

-- 16. VERIFICAR tipo_usuario EM user_roles
SELECT 
  user_id,
  name,
  role,
  tipo_usuario,
  CASE 
    WHEN role = 'MENTORADO' AND tipo_usuario IS NULL THEN '⚠️ Precisa ser atualizado para mentorado'
    WHEN role = 'PRESTADOR' AND tipo_usuario IS NULL THEN '⚠️ Precisa ser atualizado para aluno'
    WHEN role = 'PRESTADOR' AND tipo_usuario = 'mentorado' THEN '❌ ERRADO! Deveria ser aluno'
    WHEN role = 'MENTORADO' AND tipo_usuario = 'aluno' THEN '❌ ERRADO! Deveria ser mentorado'
    WHEN role = 'LIDERANCA' THEN '✓ Liderança não precisa de tipo_usuario'
    WHEN role = 'MENTORADO' AND tipo_usuario = 'mentorado' THEN '✓ OK'
    WHEN role = 'PRESTADOR' AND tipo_usuario = 'aluno' THEN '✓ OK'
    ELSE '⚠️ Verificar'
  END as status
FROM user_roles
ORDER BY role, name;
