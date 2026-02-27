-- ============================================================
-- Limpar perfis inválidos das tabelas
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- 1. Verificar perfis mentor sem usuário correspondente em user_roles
SELECT 
  'tinder_mentor_profiles sem user_roles' as tipo,
  COUNT(*) as total
FROM public.tinder_mentor_profiles mp
LEFT JOIN public.user_roles ur ON mp.user_id = ur.user_id
WHERE ur.user_id IS NULL;

-- 2. Deletar perfis mentor órfãos (sem user_roles)
DELETE FROM public.tinder_mentor_profiles
WHERE user_id NOT IN (SELECT user_id FROM public.user_roles);

-- 3. Verificar perfis expert sem usuário correspondente
SELECT 
  'tinder_expert_profiles sem user_roles' as tipo,
  COUNT(*) as total
FROM public.tinder_expert_profiles ep
LEFT JOIN public.user_roles ur ON ep.user_id = ur.user_id
WHERE ur.user_id IS NULL;

-- 4. Deletar perfis expert órfãos
DELETE FROM public.tinder_expert_profiles
WHERE user_id NOT IN (SELECT user_id FROM public.user_roles);

-- 5. Verificar perfis expert de usuários que não são MENTORADO
SELECT 
  'tinder_expert_profiles de não-MENTORADOS' as tipo,
  COUNT(*) as total
FROM public.tinder_expert_profiles ep
JOIN public.user_roles ur ON ep.user_id = ur.user_id
WHERE ur.role != 'MENTORADO';

-- 6. Deletar perfis expert de PRESTADORES (não podem ser expert)
DELETE FROM public.tinder_expert_profiles
WHERE user_id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'PRESTADOR'
);

-- 7. Verificar perfis service de usuários que não são PRESTADOR
SELECT 
  'tinder_service_profiles de não-PRESTADORES' as tipo,
  COUNT(*) as total
FROM public.tinder_service_profiles sp
JOIN public.user_roles ur ON sp.user_id = ur.user_id
WHERE ur.role != 'PRESTADOR';

-- 8. Deletar perfis service de não-PRESTADORES
DELETE FROM public.tinder_service_profiles
WHERE user_id IN (
  SELECT user_id FROM public.user_roles WHERE role != 'PRESTADOR'
);

-- 9. Verificar MENTORADOS sem perfil expert (deve ter após tornar obrigatório)
SELECT 
  'MENTORADOS sem perfil expert' as tipo,
  COUNT(*) as total
FROM public.user_roles ur
LEFT JOIN public.tinder_expert_profiles ep ON ur.user_id = ep.user_id
WHERE ur.role = 'MENTORADO' AND ep.user_id IS NULL;

-- 10. Criar perfis expert padrão para MENTORADOS que não têm (com ambos marcados)
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

-- 11. Verificação final
SELECT 
  'tinder_mentor_profiles' as tabela,
  COUNT(*) as total,
  COUNT(DISTINCT user_id) as usuarios_unicos
FROM public.tinder_mentor_profiles
UNION ALL
SELECT 
  'tinder_expert_profiles' as tabela,
  COUNT(*) as total,
  COUNT(DISTINCT user_id) as usuarios_unicos
FROM public.tinder_expert_profiles
UNION ALL
SELECT 
  'tinder_service_profiles' as tabela,
  COUNT(*) as total,
  COUNT(DISTINCT user_id) as usuarios_unicos
FROM public.tinder_service_profiles;

-- 12. Listar todos os perfis mentor com nomes
SELECT 
  ur.name,
  ur.role,
  mp.city,
  mp.niche,
  mp.nivel_fluxo
FROM public.tinder_mentor_profiles mp
JOIN public.user_roles ur ON mp.user_id = ur.user_id
ORDER BY ur.name;
