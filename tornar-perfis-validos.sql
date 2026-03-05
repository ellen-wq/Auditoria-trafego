-- ============================================================
-- TORNAR PERFIS VÁLIDOS PARA O TINDER DO FLUXO
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- 1. Garantir que todos os MENTORADOS tenham perfil
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

-- 2. Atribuir tipos Expert/Coprodutor de forma distribuída e EXCLUSIVA
-- Distribuição: 50% Expert, 30% Coprodutor, 20% Nenhum
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
    random_val := (counter % 10) / 10.0;
    
    -- 50% Expert (0.0 - 0.5) - APENAS Expert
    is_expert_val := random_val < 0.5;
    is_coproducer_val := false;
    
    -- 30% Coprodutor (0.5 - 0.8) - APENAS Coprodutor
    IF random_val >= 0.5 AND random_val < 0.8 THEN
      is_expert_val := false;
      is_coproducer_val := true;
    END IF;
    
    -- 20% Nenhum (0.8 - 1.0)
    IF random_val >= 0.8 THEN
      is_expert_val := false;
      is_coproducer_val := false;
    END IF;
    
    -- Atualizar perfil garantindo exclusividade
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
      -- Necessidades do Expert (apenas se for Expert)
      precisa_trafego_pago = CASE WHEN is_expert_val THEN (counter % 2 = 0) ELSE false END,
      precisa_copy = CASE WHEN is_expert_val THEN (counter % 3 = 0) ELSE false END,
      precisa_automacoes = CASE WHEN is_expert_val THEN (counter % 4 = 0) ELSE false END,
      precisa_estrategista = CASE WHEN is_expert_val THEN (counter % 5 = 0) ELSE false END,
      -- Capacidades do Coprodutor (apenas se for Coprodutor)
      faz_perpetuo = CASE WHEN is_coproducer_val THEN (counter % 2 = 0) ELSE false END,
      faz_pico_vendas = CASE WHEN is_coproducer_val THEN (counter % 3 = 0) ELSE false END,
      faz_trafego_pago = CASE WHEN is_coproducer_val THEN (counter % 4 = 0) ELSE false END,
      faz_copy = CASE WHEN is_coproducer_val THEN (counter % 5 = 0) ELSE false END,
      faz_automacoes = CASE WHEN is_coproducer_val THEN (counter % 6 = 0) ELSE false END,
      updated_at = NOW()
    WHERE user_id = mentorado_record.user_id;
  END LOOP;
END $$;

-- 3. Criar produtos de exemplo para Experts (1 produto por expert)
INSERT INTO public.expert_products (user_id, tipo_produto, preco, modelo, nicho, publico, created_at, updated_at)
SELECT DISTINCT ON (tmp.user_id)
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
INNER JOIN public.user_roles ur ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO'
  AND tmp.is_expert = true
  AND tmp.is_coproducer = false
  AND NOT EXISTS (
    SELECT 1 FROM public.expert_products ep 
    WHERE ep.user_id = tmp.user_id
  );

-- 4. Criar projetos de exemplo para Coprodutores (3 projetos por coprodutor)
WITH coprodutores AS (
  SELECT DISTINCT tmp.user_id
  FROM public.tinder_mentor_profiles tmp
  INNER JOIN public.user_roles ur ON tmp.user_id = ur.user_id
  WHERE ur.role = 'MENTORADO'
    AND tmp.is_expert = false
    AND tmp.is_coproducer = true
    AND NOT EXISTS (
      SELECT 1 FROM public.profile_projects pp 
      WHERE pp.user_id = tmp.user_id
    )
)
INSERT INTO public.profile_projects (user_id, nome, descricao, ano, tags, link_portfolio, created_at, updated_at)
SELECT 
  c.user_id,
  CASE (ROW_NUMBER() OVER (PARTITION BY c.user_id ORDER BY c.user_id) % 3)
    WHEN 0 THEN 'Lançamento de Produto Digital'
    WHEN 1 THEN 'Estratégia de Marketing'
    ELSE 'Automação de Vendas'
  END as nome,
  CASE (ROW_NUMBER() OVER (PARTITION BY c.user_id ORDER BY c.user_id) % 3)
    WHEN 0 THEN 'Projeto de lançamento bem-sucedido com alta conversão'
    WHEN 1 THEN 'Estratégia completa de marketing digital implementada'
    ELSE 'Sistema de automação que aumentou vendas em 300%'
  END as descricao,
  2024 as ano,
  ARRAY['Marketing', 'Vendas', 'Automação']::TEXT[] as tags,
  '' as link_portfolio,
  NOW(),
  NOW()
FROM coprodutores c
CROSS JOIN generate_series(1, 3) as seq
WHERE NOT EXISTS (
  SELECT 1 FROM public.profile_projects pp 
  WHERE pp.user_id = c.user_id AND pp.nome = CASE (seq % 3)
    WHEN 0 THEN 'Lançamento de Produto Digital'
    WHEN 1 THEN 'Estratégia de Marketing'
    ELSE 'Automação de Vendas'
  END
);

-- 5. Criar habilidades principais para Coprodutores
INSERT INTO public.profile_skills (user_id, categoria, nivel, created_at, updated_at)
SELECT DISTINCT ON (tmp.user_id, cats.categoria)
  tmp.user_id,
  cats.categoria,
  CASE cats.categoria
    WHEN 'copywriter' THEN 85
    WHEN 'trafego_pago' THEN 90
    WHEN 'automacao_ia' THEN 75
    ELSE 80
  END as nivel,
  NOW(),
  NOW()
FROM public.tinder_mentor_profiles tmp
INNER JOIN public.user_roles ur ON tmp.user_id = ur.user_id
CROSS JOIN (VALUES ('copywriter'), ('trafego_pago'), ('automacao_ia')) as cats(categoria)
WHERE ur.role = 'MENTORADO'
  AND tmp.is_expert = false
  AND tmp.is_coproducer = true
  AND NOT EXISTS (
    SELECT 1 FROM public.profile_skills ps 
    WHERE ps.user_id = tmp.user_id AND ps.categoria = cats.categoria
  );

-- 6. Criar habilidades extras para Coprodutores
INSERT INTO public.profile_skills_extra (user_id, nome, nivel, created_at, updated_at)
SELECT DISTINCT ON (tmp.user_id, skills.nome)
  tmp.user_id,
  skills.nome,
  CASE skills.nome
    WHEN 'E-mail Marketing' THEN 80
    WHEN 'Design Gráfico' THEN 70
    WHEN 'Gestão de Tráfego' THEN 90
    ELSE 75
  END as nivel,
  NOW(),
  NOW()
FROM public.tinder_mentor_profiles tmp
INNER JOIN public.user_roles ur ON tmp.user_id = ur.user_id
CROSS JOIN (VALUES ('E-mail Marketing'), ('Design Gráfico'), ('Gestão de Tráfego')) as skills(nome)
WHERE ur.role = 'MENTORADO'
  AND tmp.is_expert = false
  AND tmp.is_coproducer = true
  AND NOT EXISTS (
    SELECT 1 FROM public.profile_skills_extra pse 
    WHERE pse.user_id = tmp.user_id AND pse.nome = skills.nome
  )
LIMIT 3; -- Máximo 3 habilidades extras por coprodutor

-- 7. Atualizar alguns perfis com foto (Unsplash, boa resolução) e cidade de exemplo
WITH numbered_profiles AS (
  SELECT 
    user_id,
    (ROW_NUMBER() OVER (ORDER BY user_id) % 8) as photo_mod,
    (ROW_NUMBER() OVER (ORDER BY user_id) % 4) as city_mod
  FROM public.tinder_mentor_profiles
  WHERE photo_url = '' OR photo_url IS NULL
)
UPDATE public.tinder_mentor_profiles tmp
SET 
  photo_url = CASE np.photo_mod
    WHEN 0 THEN 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'
    WHEN 1 THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
    WHEN 2 THEN 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop'
    WHEN 3 THEN 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop'
    WHEN 4 THEN 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop'
    WHEN 5 THEN 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop'
    WHEN 6 THEN 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop'
    ELSE 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop'
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

-- 8. VERIFICAR RESULTADO FINAL
SELECT 
  '✅ RESUMO FINAL' as info,
  COUNT(*) FILTER (WHERE is_expert = true AND is_coproducer = false) as apenas_expert,
  COUNT(*) FILTER (WHERE is_expert = false AND is_coproducer = true) as apenas_coprodutor,
  COUNT(*) FILTER (WHERE is_expert = false AND is_coproducer = false) as nenhum,
  COUNT(*) FILTER (WHERE is_expert = true AND is_coproducer = true) as ambos_erro,
  COUNT(*) as total
FROM public.tinder_mentor_profiles tmp
INNER JOIN public.user_roles ur ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO';

-- 9. VERIFICAR PERFIS VÁLIDOS PARA O FEED
SELECT 
  'Perfis que devem aparecer no feed' as info,
  COUNT(*) as total_valido
FROM public.tinder_mentor_profiles tmp
INNER JOIN public.user_roles ur ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO'
  AND (tmp.is_expert = true OR tmp.is_coproducer = true);

-- 10. LISTAR ALGUNS PERFIS VÁLIDOS DE EXEMPLO
SELECT 
  ur.name,
  CASE 
    WHEN tmp.is_expert THEN 'Expert'
    WHEN tmp.is_coproducer THEN 'Coprodutor'
    ELSE 'Nenhum'
  END as tipo,
  tmp.photo_url,
  tmp.city,
  (SELECT COUNT(*) FROM expert_products ep WHERE ep.user_id = tmp.user_id) as produtos,
  (SELECT COUNT(*) FROM profile_projects pp WHERE pp.user_id = tmp.user_id) as projetos,
  (SELECT COUNT(*) FROM profile_skills ps WHERE ps.user_id = tmp.user_id) as habilidades
FROM public.tinder_mentor_profiles tmp
INNER JOIN public.user_roles ur ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO'
  AND (tmp.is_expert = true OR tmp.is_coproducer = true)
LIMIT 10;
