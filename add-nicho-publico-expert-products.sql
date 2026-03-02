-- ============================================================
-- Adicionar campos "nicho" e "publico" na tabela expert_products
-- ============================================================

ALTER TABLE expert_products
  ADD COLUMN IF NOT EXISTS nicho TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS publico TEXT DEFAULT '';

-- Comentários para documentação
COMMENT ON COLUMN expert_products.nicho IS 'Nicho do produto (ex: Marketing Digital, E-commerce, etc.)';
COMMENT ON COLUMN expert_products.publico IS 'Público-alvo do produto (ex: Iniciantes, Intermediários, Avançados, etc.)';
