-- Adicionar campos de necessidade para coprodutor
-- Permite que coprodutor também indique o que precisa (tráfego, copy, outro coprodutor)

ALTER TABLE coprodutor_details
  ADD COLUMN IF NOT EXISTS precisa_trafego BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS precisa_copy BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS precisa_coprodutor BOOLEAN DEFAULT FALSE;
