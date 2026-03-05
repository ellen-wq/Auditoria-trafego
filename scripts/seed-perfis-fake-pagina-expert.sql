-- ============================================================
-- PERFIS FAKE PARA A PÁGINA EXPERT (CARD COM OBJETIVO, BIO, NICHO, FORMATO)
-- Execute no Supabase SQL Editor para ver o card completo na /tinder-do-fluxo/expert
--
-- Pré-requisito: usuários MENTORADO já existem (rode o backend com seed uma vez:
--   npm run dev  ou  seed no initDb). Nomes usados: Mariana Alves, Juliana Rocha
--   Santos, Camila Freitas, Renata Souza, Patrícia Lima, Fernanda Martins, Fernanda Brier.
-- ============================================================

-- 1. Garantir coluna headline em tinder_mentor_profiles (se não existir)
ALTER TABLE public.tinder_mentor_profiles
  ADD COLUMN IF NOT EXISTS headline TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS goal_text TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS modelo_trabalho TEXT DEFAULT 'remoto';

-- 2. Atualizar perfis com dados ricos (objetivo, bio, nicho, formato) por nome
UPDATE public.tinder_mentor_profiles tmp
SET
  headline = v.headline,
  goal_text = v.headline,
  bio = v.bio,
  niche = v.niche,
  modelo_trabalho = v.modelo_trabalho,
  is_expert = v.is_expert,
  is_coproducer = v.is_coproducer,
  precisa_trafego_pago = v.precisa_trafego_pago,
  precisa_copy = v.precisa_copy,
  precisa_automacoes = v.precisa_automacoes,
  precisa_estrategista = v.precisa_estrategista,
  faz_perpetuo = v.faz_perpetuo,
  faz_pico_vendas = v.faz_pico_vendas,
  faz_trafego_pago = v.faz_trafego_pago,
  faz_copy = v.faz_copy,
  faz_automacoes = v.faz_automacoes,
  updated_at = NOW()
FROM public.user_roles ur
JOIN (VALUES
  -- name, headline, bio, niche, modelo_trabalho, is_expert, is_coproducer, p_trafego, p_copy, p_automacoes, p_estrategista, f_perpetuo, f_pico, f_trafego, f_copy, f_automacoes
  ('Mariana Alves', 'Especialista em Tráfego Pago', 'Meu foco é transformar investimento em lucro real através de estratégias validadas de tráfego direto e lançamentos meteóricos. Especialista em escala vertical e horizontal com faturamento acima de 7 dígitos.', 'Infoprodutos & Lançamentos', 'remoto', true, false, true, true, true, false, false, false, false, false, false),
  ('Juliana Rocha Santos', 'Copywriter para funis de alta conversão', 'Mais de 5 anos escrevendo páginas e VSLs que vendem. Trabalhei em lançamentos de 7 e 8 dígitos. Busco coprodutores para escalar novos produtos.', 'E-commerce & Cursos', 'remoto', true, false, false, true, false, true, false, false, false, false, false),
  ('Camila Freitas', 'Coprodutora de lançamentos e perpétuo', 'Atuo com tráfego pago, copy e automações. Já coproduzi 12+ lançamentos. Busco experts com produto validado para parcerias de longo prazo.', 'Saúde & Bem-estar', 'hibrido', false, true, false, false, false, false, true, true, true, true, true),
  ('Renata Souza', 'Expert em Estética Avançada', 'Ensino esteticistas a faturarem 20k+ com procedimentos premium. Produto perpétuo validado e escalando. Busco tráfego e copy para escalar.', 'Estética avançada', 'remoto', true, false, true, true, false, false, false, false, false, false, false),
  ('Patrícia Lima', 'Mentora de Inglês do zero à conversação', 'Método próprio com mais de 3.000 alunas. Estruturando funil evergreen e buscando time para escalar. Preciso de tráfego e estrategista.', 'Inglês para adultos', 'remoto', true, false, true, false, true, true, false, false, false, false, false),
  ('Fernanda Martins', 'Coprodutora em Confeitaria e Digital', 'Ajudo confeiteiras a viverem da confeitaria em casa. Faço tráfego, copy e automações. Projetos de lançamento e perpétuo.', 'Confeitaria lucrativa', 'presencial', false, true, false, false, false, false, true, true, false, true, true),
  ('Fernanda Brier', 'Estratégia para experts e gestão de comunidades', 'Ajudo experts a estruturarem o perpétuo com processos claros, métricas e previsibilidade. Gestora do Fluxo. Busco parcerias estratégicas.', 'Estratégia para experts', 'remoto', true, false, false, true, true, true, false, false, false, false, false)
) AS v(name, headline, bio, niche, modelo_trabalho, is_expert, is_coproducer,
  precisa_trafego_pago, precisa_copy, precisa_automacoes, precisa_estrategista,
  faz_perpetuo, faz_pico_vendas, faz_trafego_pago, faz_copy, faz_automacoes)
ON ur.name = v.name
WHERE ur.role = 'MENTORADO' AND tmp.user_id = ur.user_id;

-- 3. Expert products para Experts (1 produto por expert para não duplicar)
INSERT INTO public.expert_products (user_id, tipo_produto, preco, modelo, nicho, publico, created_at, updated_at)
SELECT tmp.user_id, 'Curso Tráfego Meta Ads', 997, 'perpétuo', 'Infoprodutos', 'Iniciantes', NOW(), NOW()
FROM public.tinder_mentor_profiles tmp
JOIN public.user_roles ur ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO' AND tmp.is_expert = true AND tmp.is_coproducer = false
  AND NOT EXISTS (SELECT 1 FROM public.expert_products ep WHERE ep.user_id = tmp.user_id);

INSERT INTO public.expert_products (user_id, tipo_produto, preco, modelo, nicho, publico, created_at, updated_at)
SELECT tmp.user_id, 'Mentoria Lançamentos', 2497, 'lançamento', 'E-commerce', 'Intermediários', NOW(), NOW()
FROM public.tinder_mentor_profiles tmp
JOIN public.user_roles ur ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO' AND tmp.is_expert = true AND tmp.is_coproducer = false
  AND (SELECT COUNT(*) FROM public.expert_products ep WHERE ep.user_id = tmp.user_id) = 1;

INSERT INTO public.expert_products (user_id, tipo_produto, preco, modelo, nicho, publico, created_at, updated_at)
SELECT tmp.user_id, 'Grupo VIP Copy', 497, 'assinatura', 'Marketing Digital', 'Avançados', NOW(), NOW()
FROM public.tinder_mentor_profiles tmp
JOIN public.user_roles ur ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO' AND tmp.is_expert = true AND tmp.is_coproducer = false
  AND (SELECT COUNT(*) FROM public.expert_products ep WHERE ep.user_id = tmp.user_id) = 2;

-- 4. Habilidades principais (profile_skills) para TODOS Expert e Coprodutor (para tags do card)
INSERT INTO public.profile_skills (user_id, categoria, nivel, created_at, updated_at)
SELECT tmp.user_id, v.cat, v.nivel, NOW(), NOW()
FROM public.tinder_mentor_profiles tmp
JOIN public.user_roles ur ON tmp.user_id = ur.user_id
CROSS JOIN (VALUES ('copywriter', 85), ('trafego_pago', 90), ('automacao_ia', 75)) AS v(cat, nivel)
WHERE ur.role = 'MENTORADO' AND (tmp.is_expert = true OR tmp.is_coproducer = true)
  AND NOT EXISTS (
    SELECT 1 FROM public.profile_skills ps
    WHERE ps.user_id = tmp.user_id AND ps.categoria = v.cat
  );

-- 5. Habilidades extras (profile_skills_extra) para TODOS – aparecem como tags no rodapé do card
INSERT INTO public.profile_skills_extra (user_id, nome, nivel, created_at, updated_at)
SELECT tmp.user_id, v.nome, v.nivel, NOW(), NOW()
FROM public.tinder_mentor_profiles tmp
JOIN public.user_roles ur ON tmp.user_id = ur.user_id
CROSS JOIN (VALUES ('Facebook Ads', 88), ('Google Ads', 72), ('Copywriting', 90)) AS v(nome, nivel)
WHERE ur.role = 'MENTORADO' AND (tmp.is_expert = true OR tmp.is_coproducer = true)
  AND NOT EXISTS (
    SELECT 1 FROM public.profile_skills_extra pse
    WHERE pse.user_id = tmp.user_id AND pse.nome = v.nome
  );

-- 6. Projetos para Coprodutores
INSERT INTO public.profile_projects (user_id, nome, descricao, ano, tags, link_portfolio, created_at, updated_at)
SELECT tmp.user_id, v.nome, v.descricao, v.ano, v.tags, '', NOW(), NOW()
FROM public.tinder_mentor_profiles tmp
JOIN public.user_roles ur ON tmp.user_id = ur.user_id
CROSS JOIN (VALUES
  ('Coprodução Lançamento Saúde', 'Lançamento em parceria no nicho saúde', 2024, ARRAY['Lançamento', 'Saúde']::TEXT[]),
  ('Funil Perpétuo E-commerce', 'Estruturação de funil perpétuo para e-commerce', 2024, ARRAY['Perpétuo', 'E-commerce']::TEXT[]),
  ('Automação de Vendas', 'Sistema de automação pós-venda', 2023, ARRAY['Automação', 'Vendas']::TEXT[])
) AS v(nome, descricao, ano, tags)
WHERE ur.role = 'MENTORADO' AND tmp.is_coproducer = true AND tmp.is_expert = false
  AND NOT EXISTS (
    SELECT 1 FROM public.profile_projects pp
    WHERE pp.user_id = tmp.user_id AND pp.nome = v.nome
  );

-- 7. Conferência: listar perfis que aparecerão no feed Expert
SELECT
  ur.name,
  tmp.headline AS objetivo,
  tmp.niche AS nicho,
  tmp.modelo_trabalho AS formato,
  CASE WHEN tmp.is_expert THEN 'Expert' WHEN tmp.is_coproducer THEN 'Coprodutor' ELSE '-' END AS tipo
FROM public.user_roles ur
JOIN public.tinder_mentor_profiles tmp ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO'
  AND (tmp.is_expert = true OR tmp.is_coproducer = true)
ORDER BY ur.name;
