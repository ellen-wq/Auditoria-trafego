-- ============================================================
-- CORRIGIR: Expert e Coprodutor devem ser MUTUAMENTE EXCLUSIVOS
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- 1. Se ambos is_expert e is_coproducer estão true, priorizar is_expert
--    (remover is_coproducer e limpar campos de coprodutor)
UPDATE public.tinder_mentor_profiles
SET 
  is_coproducer = false,
  faz_perpetuo = false,
  faz_pico_vendas = false,
  faz_trafego_pago = false,
  faz_copy = false,
  faz_automacoes = false,
  updated_at = NOW()
WHERE is_expert = true AND is_coproducer = true;

-- 2. Verificar quantos foram corrigidos
SELECT 
  'Perfis corrigidos (eram ambos, agora são apenas Expert)' as info,
  COUNT(*) as total
FROM public.tinder_mentor_profiles
WHERE is_expert = true AND is_coproducer = false
  AND faz_perpetuo = false AND faz_pico_vendas = false;

-- 3. Garantir que quando is_expert = true, is_coproducer = false
UPDATE public.tinder_mentor_profiles
SET 
  is_coproducer = false,
  faz_perpetuo = false,
  faz_pico_vendas = false,
  faz_trafego_pago = false,
  faz_copy = false,
  faz_automacoes = false,
  updated_at = NOW()
WHERE is_expert = true AND is_coproducer = true;

-- 4. Garantir que quando is_coproducer = true, is_expert = false
UPDATE public.tinder_mentor_profiles
SET 
  is_expert = false,
  precisa_trafego_pago = false,
  precisa_copy = false,
  precisa_automacoes = false,
  precisa_estrategista = false,
  updated_at = NOW()
WHERE is_coproducer = true AND is_expert = true;

-- 5. Limpar campos de Expert quando is_expert = false
UPDATE public.tinder_mentor_profiles
SET 
  precisa_trafego_pago = false,
  precisa_copy = false,
  precisa_automacoes = false,
  precisa_estrategista = false,
  updated_at = NOW()
WHERE is_expert = false;

-- 6. Limpar campos de Coprodutor quando is_coproducer = false
UPDATE public.tinder_mentor_profiles
SET 
  faz_perpetuo = false,
  faz_pico_vendas = false,
  faz_trafego_pago = false,
  faz_copy = false,
  faz_automacoes = false,
  updated_at = NOW()
WHERE is_coproducer = false;

-- 7. Deletar produtos de Expert quando o usuário não é mais Expert
DELETE FROM public.expert_products
WHERE user_id IN (
  SELECT user_id 
  FROM public.tinder_mentor_profiles 
  WHERE is_expert = false
);

-- 8. Verificar resultado final
SELECT 
  'Distribuição FINAL (mutuamente exclusivo)' as info,
  COUNT(*) FILTER (WHERE is_expert = true AND is_coproducer = false) as apenas_expert,
  COUNT(*) FILTER (WHERE is_expert = false AND is_coproducer = true) as apenas_coprodutor,
  COUNT(*) FILTER (WHERE is_expert = false AND is_coproducer = false) as nenhum,
  COUNT(*) FILTER (WHERE is_expert = true AND is_coproducer = true) as ambos_erro,
  COUNT(*) as total
FROM public.tinder_mentor_profiles tmp
INNER JOIN public.user_roles ur ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO';

-- 9. Listar perfis que ainda estão com erro (se houver)
SELECT 
  ur.name,
  ur.user_id,
  tmp.is_expert,
  tmp.is_coproducer,
  '⚠️ ERRO: Ambos marcados!' as status
FROM public.tinder_mentor_profiles tmp
INNER JOIN public.user_roles ur ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO'
  AND tmp.is_expert = true 
  AND tmp.is_coproducer = true;

-- 10. Adicionar constraint para garantir exclusividade (opcional, descomente se quiser)
-- ALTER TABLE public.tinder_mentor_profiles
-- DROP CONSTRAINT IF EXISTS check_expert_coprodutor_exclusive;
-- 
-- ALTER TABLE public.tinder_mentor_profiles
-- ADD CONSTRAINT check_expert_coprodutor_exclusive 
-- CHECK (NOT (is_expert = true AND is_coproducer = true));
