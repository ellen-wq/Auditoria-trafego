-- ============================================================
-- Script para garantir que Expert e Coprodutor sejam mutuamente exclusivos
-- Este script limpa dados inconsistentes onde ambos estão marcados
-- ============================================================

-- 1. Se ambos is_expert e is_coproducer estão true, priorizar is_expert
--    (ou você pode escolher outra lógica)
UPDATE tinder_mentor_profiles
SET 
  is_coproducer = false,
  faz_perpetuo = false,
  faz_pico_vendas = false,
  faz_trafego_pago = false,
  faz_copy = false,
  faz_automacoes = false
WHERE is_expert = true AND is_coproducer = true;

-- 2. Limpar campos de Expert quando is_expert = false
UPDATE tinder_mentor_profiles
SET 
  precisa_trafego_pago = false,
  precisa_copy = false,
  precisa_automacoes = false,
  precisa_estrategista = false
WHERE is_expert = false;

-- 3. Limpar campos de Coprodutor quando is_coproducer = false
UPDATE tinder_mentor_profiles
SET 
  faz_perpetuo = false,
  faz_pico_vendas = false,
  faz_trafego_pago = false,
  faz_copy = false,
  faz_automacoes = false
WHERE is_coproducer = false;

-- 4. Deletar produtos de Expert quando o usuário não é mais Expert
DELETE FROM expert_products
WHERE user_id IN (
  SELECT user_id 
  FROM tinder_mentor_profiles 
  WHERE is_expert = false
);

-- 5. Adicionar constraint para garantir exclusividade (opcional)
-- ALTER TABLE tinder_mentor_profiles
-- ADD CONSTRAINT check_expert_coprodutor_exclusive 
-- CHECK (NOT (is_expert = true AND is_coproducer = true));
