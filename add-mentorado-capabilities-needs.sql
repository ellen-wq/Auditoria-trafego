-- ============================================
-- ADICIONAR CAPACIDADES E NECESSIDADES EM tinder_mentor_profiles
-- ============================================

-- 1. CAPACIDADES DO COPRODUTOR (na tabela de mentorado)
ALTER TABLE tinder_mentor_profiles
  ADD COLUMN IF NOT EXISTS faz_perpetuo BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS faz_pico_vendas BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS faz_trafego_pago BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS faz_copy BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS faz_automacoes BOOLEAN DEFAULT FALSE;

-- 2. NECESSIDADES DO EXPERT (na tabela de mentorado)
ALTER TABLE tinder_mentor_profiles
  ADD COLUMN IF NOT EXISTS precisa_trafego_pago BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS precisa_copy BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS precisa_automacoes BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS precisa_estrategista BOOLEAN DEFAULT FALSE;

-- 3. CRIAR TABELA PARA PRODUTOS DO EXPERT (similar a profile_projects)
CREATE TABLE IF NOT EXISTS expert_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_produto TEXT NOT NULL DEFAULT '',
  preco NUMERIC(10,2) DEFAULT 0,
  modelo TEXT DEFAULT '' CHECK (modelo IN ('perpétuo', 'lançamento', 'assinatura', '')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CRIAR ÍNDICE
CREATE INDEX IF NOT EXISTS idx_expert_products_user_id ON expert_products(user_id);

-- 5. REMOVER CAMPOS OBSOLETOS (se existirem)
-- Não vamos remover ainda, apenas comentar para referência
-- ALTER TABLE coprodutor_details DROP COLUMN IF EXISTS ticket_minimo;
-- ALTER TABLE coprodutor_details DROP COLUMN IF EXISTS percentual_minimo;
-- ALTER TABLE coprodutor_details DROP COLUMN IF EXISTS aceita_sociedade;
-- ALTER TABLE coprodutor_details DROP COLUMN IF EXISTS aceita_fee_percentual;
