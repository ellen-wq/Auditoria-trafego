-- ============================================================
-- VERIFICAR ESTRUTURA COMPLETA DO BANCO DE DADOS
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- 1. ESTRUTURA COMPLETA DE tinder_mentor_profiles
SELECT 
  'tinder_mentor_profiles' as tabela,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tinder_mentor_profiles'
ORDER BY ordinal_position;

-- 2. VERIFICAR CAMPOS DE EXPERT/COPRODUTOR
SELECT 
  'Campos Expert/Coprodutor' as secao,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tinder_mentor_profiles'
  AND column_name IN (
    'is_expert',
    'is_coproducer',
    'goal_text',
    'search_bio',
    'precisa_trafego_pago',
    'precisa_copy',
    'precisa_automacoes',
    'precisa_estrategista',
    'faz_perpetuo',
    'faz_pico_vendas',
    'faz_trafego_pago',
    'faz_copy',
    'faz_automacoes'
  )
ORDER BY column_name;

-- 3. VERIFICAR SE HÁ PERFIS COM AMBOS MARCADOS (ERRO)
SELECT 
  '⚠️ PERFIS COM ERRO (ambos marcados)' as alerta,
  COUNT(*) as total_erro
FROM public.tinder_mentor_profiles
WHERE is_expert = true AND is_coproducer = true;

-- 4. ESTRUTURA DE expert_products
SELECT 
  'expert_products' as tabela,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'expert_products'
ORDER BY ordinal_position;

-- 5. ESTRUTURA DE profile_projects
SELECT 
  'profile_projects' as tabela,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profile_projects'
ORDER BY ordinal_position;

-- 6. ESTRUTURA DE profile_skills
SELECT 
  'profile_skills' as tabela,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profile_skills'
ORDER BY ordinal_position;

-- 7. ESTRUTURA DE profile_skills_extra
SELECT 
  'profile_skills_extra' as tabela,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profile_skills_extra'
ORDER BY ordinal_position;

-- 8. VERIFICAR PERFIS QUE DEVEM APARECER NO FEED
SELECT 
  'Perfis válidos para o feed' as info,
  COUNT(*) FILTER (WHERE is_expert = true AND is_coproducer = false) as apenas_expert,
  COUNT(*) FILTER (WHERE is_expert = false AND is_coproducer = true) as apenas_coprodutor,
  COUNT(*) FILTER (WHERE is_expert = true OR is_coproducer = true) as total_valido
FROM public.tinder_mentor_profiles tmp
INNER JOIN public.user_roles ur ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO';

-- 9. VERIFICAR DADOS DE EXEMPLO
SELECT 
  'Exemplo de perfil Expert' as tipo,
  ur.name,
  tmp.is_expert,
  tmp.is_coproducer,
  tmp.precisa_trafego_pago,
  tmp.precisa_copy,
  (SELECT COUNT(*) FROM expert_products ep WHERE ep.user_id = tmp.user_id) as total_produtos
FROM public.tinder_mentor_profiles tmp
INNER JOIN public.user_roles ur ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO' AND tmp.is_expert = true AND tmp.is_coproducer = false
LIMIT 1;

SELECT 
  'Exemplo de perfil Coprodutor' as tipo,
  ur.name,
  tmp.is_expert,
  tmp.is_coproducer,
  tmp.faz_perpetuo,
  tmp.faz_copy,
  (SELECT COUNT(*) FROM profile_projects pp WHERE pp.user_id = tmp.user_id) as total_projetos,
  (SELECT COUNT(*) FROM profile_skills ps WHERE ps.user_id = tmp.user_id) as total_habilidades
FROM public.tinder_mentor_profiles tmp
INNER JOIN public.user_roles ur ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO' AND tmp.is_expert = false AND tmp.is_coproducer = true
LIMIT 1;
