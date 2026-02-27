-- ============================================================
-- Garantir que TODOS os MENTORADOS tenham perfil expert
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- Criar perfis expert padrão para MENTORADOS que não têm
-- Marca ambos (Expert e Coprodutor) como padrão
INSERT INTO public.tinder_expert_profiles (
  user_id,
  is_expert,
  is_coproducer,
  goal_text,
  search_bio,
  preferences_json,
  updated_at
)
SELECT 
  ur.user_id,
  true as is_expert,
  true as is_coproducer,
  'Objetivo: escalar meu negócio e criar parcerias estratégicas' as goal_text,
  'Busco parcerias estratégicas e oportunidades de coprodução para escalar.' as search_bio,
  '{}'::jsonb as preferences_json,
  NOW() as updated_at
FROM public.user_roles ur
LEFT JOIN public.tinder_expert_profiles ep ON ur.user_id = ep.user_id
WHERE ur.role = 'MENTORADO' AND ep.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Verificar resultado
SELECT 
  'Total MENTORADOS' as tipo,
  COUNT(*) as total
FROM public.user_roles
WHERE role = 'MENTORADO'
UNION ALL
SELECT 
  'MENTORADOS com perfil expert' as tipo,
  COUNT(*) as total
FROM public.user_roles ur
JOIN public.tinder_expert_profiles ep ON ur.user_id = ep.user_id
WHERE ur.role = 'MENTORADO';
