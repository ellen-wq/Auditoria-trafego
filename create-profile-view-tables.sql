-- ============================================
-- MIGRATIONS PARA PROFILE VIEW DESKTOP
-- ============================================
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. ADICIONAR NOVOS CAMPOS EM tinder_mentor_profiles
ALTER TABLE tinder_mentor_profiles 
  ADD COLUMN IF NOT EXISTS headline TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS anos_experiencia INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS horas_semanais INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS disponivel BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS idiomas TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS modelo_trabalho TEXT DEFAULT 'remoto' CHECK (modelo_trabalho IN ('remoto', 'hibrido', 'presencial'));

-- 2. ADICIONAR NOVOS CAMPOS EM tinder_expert_profiles
ALTER TABLE tinder_expert_profiles 
  ADD COLUMN IF NOT EXISTS headline TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS anos_experiencia INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS horas_semanais INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS disponivel BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS idiomas TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS modelo_trabalho TEXT DEFAULT 'remoto' CHECK (modelo_trabalho IN ('remoto', 'hibrido', 'presencial'));

-- 3. ADICIONAR NOVOS CAMPOS EM tinder_service_profiles
ALTER TABLE tinder_service_profiles 
  ADD COLUMN IF NOT EXISTS headline TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS anos_experiencia INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS horas_semanais INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS disponivel BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS idiomas TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS modelo_trabalho TEXT DEFAULT 'remoto' CHECK (modelo_trabalho IN ('remoto', 'hibrido', 'presencial'));

-- 4. CRIAR TABELA profile_projects
CREATE TABLE IF NOT EXISTS profile_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  ano INTEGER,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  link_portfolio TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CRIAR TABELA profile_reviews
CREATE TABLE IF NOT EXISTS profile_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  depoimento TEXT DEFAULT '',
  autor_nome TEXT NOT NULL,
  autor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CRIAR VIEW PARA RATING
CREATE OR REPLACE VIEW profile_rating AS
SELECT
  profile_user_id,
  AVG(rating)::NUMERIC(3,2) as rating_avg,
  COUNT(*)::INTEGER as total_reviews
FROM profile_reviews
GROUP BY profile_user_id;

-- 7. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profile_projects_user_id ON profile_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_reviews_profile_user_id ON profile_reviews(profile_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_reviews_created_at ON profile_reviews(created_at DESC);

-- 8. HABILITAR RLS
ALTER TABLE profile_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_reviews ENABLE ROW LEVEL SECURITY;

-- 9. POLÍTICAS RLS PARA profile_projects
-- Usuários autenticados podem ver todos os projetos
CREATE POLICY "Users can view all projects" ON profile_projects
  FOR SELECT USING (auth.role() = 'authenticated');

-- Usuários podem criar seus próprios projetos
CREATE POLICY "Users can create their own projects" ON profile_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios projetos
CREATE POLICY "Users can update their own projects" ON profile_projects
  FOR UPDATE USING (auth.uid() = user_id);

-- Usuários podem deletar seus próprios projetos
CREATE POLICY "Users can delete their own projects" ON profile_projects
  FOR DELETE USING (auth.uid() = user_id);

-- 10. POLÍTICAS RLS PARA profile_reviews
-- Usuários autenticados podem ver todos os depoimentos
CREATE POLICY "Users can view all reviews" ON profile_reviews
  FOR SELECT USING (auth.role() = 'authenticated');

-- Usuários podem criar depoimentos
CREATE POLICY "Users can create reviews" ON profile_reviews
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Usuários podem atualizar seus próprios depoimentos
CREATE POLICY "Users can update their own reviews" ON profile_reviews
  FOR UPDATE USING (auth.uid() = autor_user_id);

-- Usuários podem deletar seus próprios depoimentos
CREATE POLICY "Users can delete their own reviews" ON profile_reviews
  FOR DELETE USING (auth.uid() = autor_user_id);

-- 11. VERIFICAR SE AS MUDANÇAS FORAM APLICADAS
SELECT 
  'tinder_mentor_profiles' as tabela,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'tinder_mentor_profiles' 
  AND column_name IN ('headline', 'anos_experiencia', 'horas_semanais', 'disponivel', 'idiomas', 'modelo_trabalho')
UNION ALL
SELECT 
  'tinder_expert_profiles' as tabela,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'tinder_expert_profiles' 
  AND column_name IN ('headline', 'anos_experiencia', 'horas_semanais', 'disponivel', 'idiomas', 'modelo_trabalho')
UNION ALL
SELECT 
  'tinder_service_profiles' as tabela,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'tinder_service_profiles' 
  AND column_name IN ('headline', 'anos_experiencia', 'horas_semanais', 'disponivel', 'idiomas', 'modelo_trabalho');

-- Verificar se as novas tabelas foram criadas
SELECT 
  'profile_projects' as tabela,
  COUNT(*) as registros
FROM profile_projects
UNION ALL
SELECT 
  'profile_reviews' as tabela,
  COUNT(*) as registros
FROM profile_reviews;
