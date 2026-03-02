-- ============================================================
-- VERIFICAR SE OS PERFIS FORAM CRIADOS CORRETAMENTE
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- 1. Verificar quantos MENTORADOS existem
SELECT 
  'Total MENTORADOS' as info,
  COUNT(*) as total
FROM public.user_roles
WHERE role = 'MENTORADO';

-- 2. Verificar quantos têm perfil em tinder_mentor_profiles
SELECT 
  'MENTORADOS com perfil' as info,
  COUNT(*) as total
FROM public.tinder_mentor_profiles tmp
INNER JOIN public.user_roles ur ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO';

-- 3. Verificar distribuição Expert/Coprodutor
SELECT 
  'Distribuição de tipos' as info,
  COUNT(*) FILTER (WHERE is_expert = true AND is_coproducer = true) as ambos,
  COUNT(*) FILTER (WHERE is_expert = true AND is_coproducer = false) as apenas_expert,
  COUNT(*) FILTER (WHERE is_expert = false AND is_coproducer = true) as apenas_coprodutor,
  COUNT(*) FILTER (WHERE is_expert = false AND is_coproducer = false) as nenhum,
  COUNT(*) as total
FROM public.tinder_mentor_profiles tmp
INNER JOIN public.user_roles ur ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO';

-- 4. Listar alguns perfis de exemplo (Expert)
SELECT 
  ur.name,
  tmp.is_expert,
  tmp.is_coproducer,
  tmp.goal_text,
  tmp.photo_url,
  tmp.precisa_trafego_pago,
  tmp.precisa_copy,
  tmp.precisa_automacoes,
  tmp.precisa_estrategista
FROM public.tinder_mentor_profiles tmp
INNER JOIN public.user_roles ur ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO'
  AND tmp.is_expert = true
LIMIT 5;

-- 5. Listar alguns perfis de exemplo (Coprodutor)
SELECT 
  ur.name,
  tmp.is_expert,
  tmp.is_coproducer,
  tmp.goal_text,
  tmp.photo_url,
  tmp.faz_perpetuo,
  tmp.faz_pico_vendas,
  tmp.faz_trafego_pago,
  tmp.faz_copy,
  tmp.faz_automacoes
FROM public.tinder_mentor_profiles tmp
INNER JOIN public.user_roles ur ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO'
  AND tmp.is_coproducer = true
LIMIT 5;

-- 6. Verificar produtos criados
SELECT 
  'Produtos' as info,
  COUNT(*) as total_produtos,
  COUNT(DISTINCT user_id) as experts_com_produtos
FROM public.expert_products;

-- 7. Verificar projetos criados
SELECT 
  'Projetos' as info,
  COUNT(*) as total_projetos,
  COUNT(DISTINCT user_id) as coprodutores_com_projetos
FROM public.profile_projects;

-- 8. Verificar habilidades criadas
SELECT 
  'Habilidades' as info,
  COUNT(*) as total_habilidades,
  COUNT(DISTINCT user_id) as coprodutores_com_habilidades
FROM public.profile_skills;

-- 9. Verificar se há perfis que devem aparecer no feed (Expert OU Coprodutor)
SELECT 
  'Perfis que devem aparecer no feed' as info,
  COUNT(*) as total
FROM public.tinder_mentor_profiles tmp
INNER JOIN public.user_roles ur ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO'
  AND (tmp.is_expert = true OR tmp.is_coproducer = true);

-- 10. Listar todos os perfis que devem aparecer
SELECT 
  ur.name,
  ur.user_id,
  tmp.is_expert,
  tmp.is_coproducer,
  CASE 
    WHEN tmp.is_expert AND tmp.is_coproducer THEN 'Expert + Coprodutor'
    WHEN tmp.is_expert THEN 'Expert'
    WHEN tmp.is_coproducer THEN 'Coprodutor'
    ELSE 'Nenhum'
  END as tipo,
  tmp.photo_url,
  tmp.city
FROM public.tinder_mentor_profiles tmp
INNER JOIN public.user_roles ur ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO'
  AND (tmp.is_expert = true OR tmp.is_coproducer = true)
ORDER BY ur.name;
