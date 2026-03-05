-- ============================================================
-- ATRIBUIR PERFIS EXISTENTES PARA APARECER NA PÁGINA DE CONEXÕES
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- 1. Garantir que todos os MENTORADOS tenham perfil em tinder_mentor_profiles
INSERT INTO public.tinder_mentor_profiles (user_id, photo_url, city, bio, whatsapp, created_at, updated_at)
SELECT 
  ur.user_id,
  '',
  '',
  '',
  '',
  NOW(),
  NOW()
FROM public.user_roles ur
WHERE ur.role = 'MENTORADO'
  AND NOT EXISTS (
    SELECT 1 FROM public.tinder_mentor_profiles tmp 
    WHERE tmp.user_id = ur.user_id
  )
ON CONFLICT (user_id) DO NOTHING;

-- 2. Atribuir tipos Expert/Coprodutor de forma distribuída
-- Distribuição: 40% Expert, 30% Coprodutor, 20% Ambos, 10% Nenhum (para testes)
DO $$
DECLARE
  mentorado_record RECORD;
  is_expert_val BOOLEAN;
  is_coproducer_val BOOLEAN;
  random_val NUMERIC;
  counter INTEGER := 0;
BEGIN
  FOR mentorado_record IN 
    SELECT user_id, name 
    FROM public.user_roles 
    WHERE role = 'MENTORADO'
    ORDER BY user_id
  LOOP
    counter := counter + 1;
    random_val := (counter % 10) / 10.0; -- Distribuição determinística baseada na posição
    
    -- 40% Expert (0.0 - 0.4) - APENAS Expert
    is_expert_val := random_val < 0.4;
    is_coproducer_val := false;
    
    -- 30% Coprodutor (0.4 - 0.7) - APENAS Coprodutor
    IF random_val >= 0.4 AND random_val < 0.7 THEN
      is_expert_val := false;
      is_coproducer_val := true;
    END IF;
    
    -- 30% Nenhum (0.7 - 1.0) - deixar como está (nenhum dos dois)
    IF random_val >= 0.7 THEN
      is_expert_val := false;
      is_coproducer_val := false;
    END IF;
    
    -- Atualizar perfil com todos os campos de uma vez
    UPDATE public.tinder_mentor_profiles
    SET 
      is_expert = is_expert_val,
      is_coproducer = is_coproducer_val,
      goal_text = CASE
        WHEN is_expert_val THEN 'Objetivo: escalar meu negócio e buscar oportunidades de crescimento'
        WHEN is_coproducer_val THEN 'Objetivo: criar parcerias estratégicas e coproduções'
        ELSE COALESCE(goal_text, 'Objetivo: crescer e expandir meu negócio')
      END,
      search_bio = CASE
        WHEN is_expert_val THEN 'Expert em busca de oportunidades de crescimento e expansão.'
        WHEN is_coproducer_val THEN 'Aberto para coproduções e parcerias estratégicas.'
        ELSE COALESCE(search_bio, 'Em busca de conexões e oportunidades.')
      END,
      -- Necessidades do Expert
      precisa_trafego_pago = CASE WHEN is_expert_val THEN (counter % 2 = 0) ELSE false END,
      precisa_copy = CASE WHEN is_expert_val THEN (counter % 3 = 0) ELSE false END,
      precisa_automacoes = CASE WHEN is_expert_val THEN (counter % 4 = 0) ELSE false END,
      precisa_estrategista = CASE WHEN is_expert_val THEN (counter % 5 = 0) ELSE false END,
      -- Capacidades do Coprodutor
      faz_perpetuo = CASE WHEN is_coproducer_val THEN (counter % 2 = 0) ELSE false END,
      faz_pico_vendas = CASE WHEN is_coproducer_val THEN (counter % 3 = 0) ELSE false END,
      faz_trafego_pago = CASE WHEN is_coproducer_val THEN (counter % 4 = 0) ELSE false END,
      faz_copy = CASE WHEN is_coproducer_val THEN (counter % 5 = 0) ELSE false END,
      faz_automacoes = CASE WHEN is_coproducer_val THEN (counter % 6 = 0) ELSE false END,
      updated_at = NOW()
    WHERE user_id = mentorado_record.user_id;
  END LOOP;
END $$;

-- 3. Criar produtos de exemplo para Experts
INSERT INTO public.expert_products (user_id, tipo_produto, preco, modelo, nicho, publico, created_at, updated_at)
SELECT 
  tmp.user_id,
  CASE (ROW_NUMBER() OVER (PARTITION BY tmp.user_id ORDER BY tmp.user_id) % 3)
    WHEN 0 THEN 'Curso Online'
    WHEN 1 THEN 'Mentoria'
    ELSE 'Grupo VIP'
  END as tipo_produto,
  CASE (ROW_NUMBER() OVER (PARTITION BY tmp.user_id ORDER BY tmp.user_id) % 3)
    WHEN 0 THEN 997.00
    WHEN 1 THEN 2497.00
    ELSE 497.00
  END as preco,
  CASE (ROW_NUMBER() OVER (PARTITION BY tmp.user_id ORDER BY tmp.user_id) % 3)
    WHEN 0 THEN 'perpétuo'
    WHEN 1 THEN 'lançamento'
    ELSE 'assinatura'
  END as modelo,
  CASE (ROW_NUMBER() OVER (PARTITION BY tmp.user_id ORDER BY tmp.user_id) % 2)
    WHEN 0 THEN 'Marketing Digital'
    ELSE 'E-commerce'
  END as nicho,
  CASE (ROW_NUMBER() OVER (PARTITION BY tmp.user_id ORDER BY tmp.user_id) % 2)
    WHEN 0 THEN 'Iniciantes'
    ELSE 'Intermediários'
  END as publico,
  NOW(),
  NOW()
FROM public.tinder_mentor_profiles tmp
WHERE tmp.is_expert = true
  AND NOT EXISTS (
    SELECT 1 FROM public.expert_products ep 
    WHERE ep.user_id = tmp.user_id
  )
LIMIT 1; -- Apenas 1 produto por expert para começar

-- 4. Criar projetos de exemplo para Coprodutores
INSERT INTO public.profile_projects (user_id, nome, descricao, ano, tags, link_portfolio, created_at, updated_at)
SELECT 
  tmp.user_id,
  CASE (ROW_NUMBER() OVER (PARTITION BY tmp.user_id ORDER BY tmp.user_id) % 3)
    WHEN 0 THEN 'Lançamento de Produto Digital'
    WHEN 1 THEN 'Estratégia de Marketing'
    ELSE 'Automação de Vendas'
  END as nome,
  CASE (ROW_NUMBER() OVER (PARTITION BY tmp.user_id ORDER BY tmp.user_id) % 3)
    WHEN 0 THEN 'Projeto de lançamento bem-sucedido com alta conversão'
    WHEN 1 THEN 'Estratégia completa de marketing digital implementada'
    ELSE 'Sistema de automação que aumentou vendas em 300%'
  END as descricao,
  2024 as ano,
  ARRAY['Marketing', 'Vendas', 'Automação']::TEXT[] as tags,
  '' as link_portfolio,
  NOW(),
  NOW()
FROM public.tinder_mentor_profiles tmp
WHERE tmp.is_coproducer = true
  AND NOT EXISTS (
    SELECT 1 FROM public.profile_projects pp 
    WHERE pp.user_id = tmp.user_id
  )
LIMIT 3; -- 3 projetos por coprodutor

-- 5. Criar habilidades de exemplo para Coprodutores
INSERT INTO public.profile_skills (user_id, categoria, nivel, created_at, updated_at)
SELECT 
  tmp.user_id,
  categoria,
  CASE categoria
    WHEN 'copywriter' THEN 85
    WHEN 'trafego_pago' THEN 90
    WHEN 'automacao_ia' THEN 75
    ELSE 80
  END as nivel,
  NOW(),
  NOW()
FROM public.tinder_mentor_profiles tmp
CROSS JOIN (VALUES ('copywriter'), ('trafego_pago'), ('automacao_ia')) as cats(categoria)
WHERE tmp.is_coproducer = true
  AND NOT EXISTS (
    SELECT 1 FROM public.profile_skills ps 
    WHERE ps.user_id = tmp.user_id AND ps.categoria = cats.categoria
  );

-- 6. Criar habilidades extras de exemplo
INSERT INTO public.profile_skills_extra (user_id, nome, nivel, created_at, updated_at)
SELECT 
  tmp.user_id,
  nome,
  CASE nome
    WHEN 'E-mail Marketing' THEN 80
    WHEN 'Design Gráfico' THEN 70
    WHEN 'Gestão de Tráfego' THEN 90
    ELSE 75
  END as nivel,
  NOW(),
  NOW()
FROM public.tinder_mentor_profiles tmp
CROSS JOIN (VALUES ('E-mail Marketing'), ('Design Gráfico'), ('Gestão de Tráfego')) as skills(nome)
WHERE tmp.is_coproducer = true
  AND NOT EXISTS (
    SELECT 1 FROM public.profile_skills_extra pse 
    WHERE pse.user_id = tmp.user_id AND pse.nome = skills.nome
  )
LIMIT 3; -- 3 habilidades extras por coprodutor

-- 7. Atualizar alguns perfis com foto e cidade de exemplo
WITH numbered_profiles AS (
  SELECT 
    user_id,
    (ROW_NUMBER() OVER (ORDER BY user_id) % 5) as photo_mod,
    (ROW_NUMBER() OVER (ORDER BY user_id) % 4) as city_mod
  FROM public.tinder_mentor_profiles
  WHERE photo_url = '' OR photo_url IS NULL
)
UPDATE public.tinder_mentor_profiles tmp
SET 
  photo_url = CASE np.photo_mod
    WHEN 0 THEN 'https://i.pravatar.cc/150?img=1'
    WHEN 1 THEN 'https://i.pravatar.cc/150?img=2'
    WHEN 2 THEN 'https://i.pravatar.cc/150?img=3'
    WHEN 3 THEN 'https://i.pravatar.cc/150?img=4'
    ELSE 'https://i.pravatar.cc/150?img=5'
  END,
  city = CASE np.city_mod
    WHEN 0 THEN 'São Paulo'
    WHEN 1 THEN 'Rio de Janeiro'
    WHEN 2 THEN 'Belo Horizonte'
    ELSE 'Curitiba'
  END,
  whatsapp = '5511999999999'
FROM numbered_profiles np
WHERE tmp.user_id = np.user_id;

-- 8. Verificar resultado
SELECT 
  'Resumo de Atribuições' as info,
  COUNT(*) FILTER (WHERE is_expert = true AND is_coproducer = true) as ambos,
  COUNT(*) FILTER (WHERE is_expert = true AND is_coproducer = false) as apenas_expert,
  COUNT(*) FILTER (WHERE is_expert = false AND is_coproducer = true) as apenas_coprodutor,
  COUNT(*) FILTER (WHERE is_expert = false AND is_coproducer = false) as nenhum,
  COUNT(*) as total
FROM public.tinder_mentor_profiles;

-- 9. Verificar produtos criados
SELECT 
  'Produtos criados' as info,
  COUNT(*) as total_produtos,
  COUNT(DISTINCT user_id) as experts_com_produtos
FROM public.expert_products;

-- 10. Verificar projetos criados
SELECT 
  'Projetos criados' as info,
  COUNT(*) as total_projetos,
  COUNT(DISTINCT user_id) as coprodutores_com_projetos
FROM public.profile_projects;

-- 11. Verificar habilidades criadas
SELECT 
  'Habilidades criadas' as info,
  COUNT(*) as total_habilidades,
  COUNT(DISTINCT user_id) as coprodutores_com_habilidades
FROM public.profile_skills;
