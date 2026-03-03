-- ============================================================
-- FEED EXPERT: garantir que os cards apareçam na página Expert & Coprodutor
-- Execute no Supabase SQL Editor (Dashboard > SQL Editor > New query)
--
-- O que este script faz:
-- 1. Garante colunas em tinder_mentor_profiles (headline, is_expert, is_coproducer, average_rating, etc.)
-- 2. Cria perfil em tinder_mentor_profiles para todo MENTORADO que ainda não tem
-- 3. Marca cada perfil como Expert OU Coprodutor (mutuamente exclusivo) e preenche bio/objetivo/nicho
-- 4. Adiciona produtos (Experts), habilidades e projetos (Coprodutores) para o card ficar completo
-- 8. Atribui average_rating (1–5) para smart ordering: cards com maior rating aparecem primeiro
--
-- Importante: o feed só mostra OUTROS usuários (exclui quem está logado).
-- Se você for o único MENTORADO, rode também o script supabase-criar-mentorados-fake.sql
-- depois de criar usuários em Authentication > Users > Add user.
-- ============================================================

-- 1. Colunas em tinder_mentor_profiles (se não existirem)
ALTER TABLE public.tinder_mentor_profiles
  ADD COLUMN IF NOT EXISTS headline TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS goal_text TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS modelo_trabalho TEXT DEFAULT 'remoto',
  ADD COLUMN IF NOT EXISTS is_expert BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_coproducer BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS search_bio TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS preferences_json JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS precisa_trafego_pago BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS precisa_copy BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS precisa_automacoes BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS precisa_estrategista BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS faz_perpetuo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS faz_pico_vendas BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS faz_trafego_pago BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS faz_copy BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS faz_automacoes BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT NULL;

-- 2. Todo MENTORADO precisa ter linha em tinder_mentor_profiles
INSERT INTO public.tinder_mentor_profiles (
  user_id, photo_url, city, bio, whatsapp, headline, goal_text, modelo_trabalho,
  is_expert, is_coproducer, search_bio, created_at, updated_at
)
SELECT
  ur.user_id,
  '',
  '',
  '',
  '',
  '',
  '',
  'remoto',
  false,
  false,
  '',
  NOW(),
  NOW()
FROM public.user_roles ur
WHERE ur.role = 'MENTORADO'
  AND NOT EXISTS (
    SELECT 1 FROM public.tinder_mentor_profiles tmp WHERE tmp.user_id = ur.user_id
  )
ON CONFLICT (user_id) DO NOTHING;

-- 3. Atribuir Expert ou Coprodutor (mutuamente exclusivo) e preencher dados do card
DO $$
DECLARE
  r RECORD;
  idx INT := 0;
  is_expert_val BOOLEAN;
  is_coproducer_val BOOLEAN;
  v_head TEXT;
  v_bio TEXT;
  v_niche TEXT;
  v_formato TEXT;
  p_trafego BOOLEAN; p_copy BOOLEAN; p_automacoes BOOLEAN; p_estrategista BOOLEAN;
  f_perpetuo BOOLEAN; f_pico BOOLEAN; f_trafego BOOLEAN; f_copy BOOLEAN; f_automacoes BOOLEAN;
BEGIN
  FOR r IN
    SELECT tmp.user_id, ur.name
    FROM public.tinder_mentor_profiles tmp
    JOIN public.user_roles ur ON ur.user_id = tmp.user_id
    WHERE ur.role = 'MENTORADO'
    ORDER BY tmp.user_id
  LOOP
    idx := idx + 1;
    -- Alternar Expert (ímpares) e Coprodutor (pares) para ter variedade no feed
    is_expert_val := (idx % 2) = 1;
    is_coproducer_val := NOT is_expert_val;

    IF is_expert_val THEN
      v_head := 'Escalar negócio e buscar parcerias de alto impacto';
      v_bio := 'Expert em busca de coprodutores e oportunidades de crescimento. Foco em resultados e métricas.';
      v_niche := CASE (idx % 4) WHEN 0 THEN 'Infoprodutos' WHEN 1 THEN 'E-commerce' WHEN 2 THEN 'Saúde' ELSE 'Educação' END;
      v_formato := CASE (idx % 3) WHEN 0 THEN 'remoto' WHEN 1 THEN 'hibrido' ELSE 'presencial' END;
      p_trafego := (idx % 2) = 0;
      p_copy := (idx % 3) <> 0;
      p_automacoes := (idx % 4) = 0;
      p_estrategista := (idx % 5) = 0;
      f_perpetuo := false; f_pico := false; f_trafego := false; f_copy := false; f_automacoes := false;
    ELSE
      v_head := 'Coproduções e parcerias estratégicas';
      v_bio := 'Coprodutor com experiência em lançamentos e funis. Busco experts com produto validado para parcerias.';
      v_niche := CASE (idx % 4) WHEN 0 THEN 'Marketing Digital' WHEN 1 THEN 'Lançamentos' WHEN 2 THEN 'Conteúdo' ELSE 'Consultoria' END;
      v_formato := CASE (idx % 3) WHEN 0 THEN 'remoto' WHEN 1 THEN 'hibrido' ELSE 'presencial' END;
      p_trafego := false; p_copy := false; p_automacoes := false; p_estrategista := false;
      f_perpetuo := (idx % 2) = 0;
      f_pico := (idx % 3) <> 0;
      f_trafego := (idx % 4) = 0;
      f_copy := (idx % 5) <> 0;
      f_automacoes := (idx % 6) = 0;
    END IF;

    UPDATE public.tinder_mentor_profiles AS tmp
    SET
      headline = COALESCE(NULLIF(trim(tmp.headline), ''), v_head),
      goal_text = COALESCE(NULLIF(trim(tmp.goal_text), ''), v_head),
      bio = COALESCE(NULLIF(trim(tmp.bio), ''), v_bio),
      search_bio = COALESCE(NULLIF(trim(tmp.search_bio), ''), v_bio),
      niche = COALESCE(NULLIF(trim(tmp.niche), ''), v_niche),
      modelo_trabalho = COALESCE(NULLIF(trim(tmp.modelo_trabalho), ''), v_formato),
      is_expert = is_expert_val,
      is_coproducer = is_coproducer_val,
      precisa_trafego_pago = p_trafego,
      precisa_copy = p_copy,
      precisa_automacoes = p_automacoes,
      precisa_estrategista = p_estrategista,
      faz_perpetuo = f_perpetuo,
      faz_pico_vendas = f_pico,
      faz_trafego_pago = f_trafego,
      faz_copy = f_copy,
      faz_automacoes = f_automacoes,
      updated_at = NOW()
    WHERE tmp.user_id = r.user_id;
  END LOOP;
END $$;

-- 4. Produtos para Experts (1 por expert que ainda não tem)
INSERT INTO public.expert_products (user_id, tipo_produto, preco, modelo, nicho, publico, created_at, updated_at)
SELECT tmp.user_id, 'Curso Online', 997, 'perpétuo', 'Marketing Digital', 'Iniciantes', NOW(), NOW()
FROM public.tinder_mentor_profiles tmp
JOIN public.user_roles ur ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO' AND tmp.is_expert = true AND tmp.is_coproducer = false
  AND NOT EXISTS (SELECT 1 FROM public.expert_products ep WHERE ep.user_id = tmp.user_id);

-- 5. Habilidades (profile_skills) para Expert e Coprodutor
INSERT INTO public.profile_skills (user_id, categoria, nivel, created_at, updated_at)
SELECT tmp.user_id, v.cat, v.nivel, NOW(), NOW()
FROM public.tinder_mentor_profiles tmp
JOIN public.user_roles ur ON tmp.user_id = ur.user_id
CROSS JOIN (VALUES ('copywriter', 85), ('trafego_pago', 90), ('automacao_ia', 75)) AS v(cat, nivel)
WHERE ur.role = 'MENTORADO' AND (tmp.is_expert OR tmp.is_coproducer)
  AND NOT EXISTS (SELECT 1 FROM public.profile_skills ps WHERE ps.user_id = tmp.user_id AND ps.categoria = v.cat);

-- 6. Habilidades extras (profile_skills_extra)
INSERT INTO public.profile_skills_extra (user_id, nome, nivel, created_at, updated_at)
SELECT tmp.user_id, v.nome, v.nivel, NOW(), NOW()
FROM public.tinder_mentor_profiles tmp
JOIN public.user_roles ur ON tmp.user_id = ur.user_id
CROSS JOIN (VALUES ('Facebook Ads', 88), ('Google Ads', 72), ('Copywriting', 90)) AS v(nome, nivel)
WHERE ur.role = 'MENTORADO' AND (tmp.is_expert OR tmp.is_coproducer)
  AND NOT EXISTS (SELECT 1 FROM public.profile_skills_extra pse WHERE pse.user_id = tmp.user_id AND pse.nome = v.nome);

-- 7. Projetos para Coprodutores
INSERT INTO public.profile_projects (user_id, nome, descricao, ano, tags, link_portfolio, created_at, updated_at)
SELECT tmp.user_id, 'Projeto Coprodução', 'Parceria em lançamento e funil', 2024, ARRAY['Lançamento']::TEXT[], '', NOW(), NOW()
FROM public.tinder_mentor_profiles tmp
JOIN public.user_roles ur ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO' AND tmp.is_coproducer = true AND tmp.is_expert = false
  AND NOT EXISTS (SELECT 1 FROM public.profile_projects pp WHERE pp.user_id = tmp.user_id AND pp.nome = 'Projeto Coprodução');

-- 8. average_rating para smart ordering (ordenar cards por rating depois compatibilidade)
--    Atribui valores 1.0 a 5.0 para teste; perfis com rating maior aparecem primeiro no feed
WITH ranked AS (
  SELECT tmp.user_id,
         (1 + (ROW_NUMBER() OVER (ORDER BY tmp.user_id) % 5))::NUMERIC(3,2) AS r
  FROM public.tinder_mentor_profiles tmp
  JOIN public.user_roles ur ON ur.user_id = tmp.user_id
  WHERE ur.role = 'MENTORADO' AND (tmp.is_expert = true OR tmp.is_coproducer = true)
)
UPDATE public.tinder_mentor_profiles tmp
SET average_rating = ranked.r
FROM ranked
WHERE tmp.user_id = ranked.user_id;

-- 9. Conferência: quem aparece no feed (com average_rating para ordenação)
SELECT
  ur.name,
  tmp.headline AS objetivo,
  tmp.niche AS nicho,
  tmp.modelo_trabalho AS formato,
  tmp.average_rating AS rating,
  CASE WHEN tmp.is_expert THEN 'Expert' WHEN tmp.is_coproducer THEN 'Coprodutor' ELSE '-' END AS tipo
FROM public.user_roles ur
JOIN public.tinder_mentor_profiles tmp ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO'
  AND (tmp.is_expert = true OR tmp.is_coproducer = true)
ORDER BY tmp.average_rating DESC NULLS LAST, ur.name;
