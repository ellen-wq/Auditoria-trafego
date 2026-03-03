-- ============================================
-- VAGAS FAKE PARA AS 3 CONDIÇÕES (ABERTAS, ENCERRADAS, MINHAS)
-- ============================================
-- Execute no SQL Editor do Supabase
-- Cada aba deve mostrar vagas DIFERENTES:
-- - Em aberto: status OPEN + (deadline null ou >= hoje)
-- - Encerrado: status CLOSED ou deadline < hoje
-- - Minhas vagas: creator_id = seu user_id (faça login para ver)

-- 0. Garantir coluna deadline existe
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tinder_jobs' AND column_name='deadline') THEN
    ALTER TABLE public.tinder_jobs ADD COLUMN deadline DATE DEFAULT NULL;
  END IF;
END $$;

-- 1. Coluna para identificar vagas fake (permite re-executar o script)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tinder_jobs' AND column_name='seed_batch') THEN
    ALTER TABLE public.tinder_jobs ADD COLUMN seed_batch TEXT DEFAULT NULL;
  END IF;
END $$;
DELETE FROM tinder_jobs WHERE seed_batch = 'fake_3_condicoes';

-- 2. Atualizar RLS: todos podem ver vagas abertas E encerradas (evita mesma vaga em todas as abas)
DROP POLICY IF EXISTS "Everyone can view open jobs, creator sees own, leadership sees all" ON public.tinder_jobs;
DROP POLICY IF EXISTS "prestador_mentorado_see_jobs" ON public.tinder_jobs;
DROP POLICY IF EXISTS "tinder_jobs_select_all" ON public.tinder_jobs;
CREATE POLICY "tinder_jobs_select_all"
  ON public.tinder_jobs
  FOR SELECT
  USING (true);

-- 2. Buscar user_id para "Minhas vagas" (primeiro usuário MENTORADO ou PRESTADOR)
DO $$
DECLARE
  meu_user_id UUID;
  expert_ids UUID[];
BEGIN
  -- Pegar primeiro usuário disponível para criar vagas
  SELECT user_id INTO meu_user_id FROM user_roles WHERE role IN ('MENTORADO', 'PRESTADOR', 'LIDERANCA') LIMIT 1;
  IF meu_user_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuário encontrado. Execute o seed primeiro.';
  END IF;

  -- Pegar vários usuários para distribuir vagas "de outros"
  SELECT ARRAY_AGG(user_id) INTO expert_ids FROM (
    SELECT user_id FROM user_roles WHERE role IN ('MENTORADO', 'PRESTADOR', 'LIDERANCA') LIMIT 5
  ) t;
  IF expert_ids IS NULL OR array_length(expert_ids, 1) IS NULL THEN
    expert_ids := ARRAY[meu_user_id, meu_user_id, meu_user_id];
  END IF;

  -- ========== VAGAS EM ABERTO (aba "Em aberto") ==========
  -- status OPEN, deadline null ou futuro - NUNCA aparecem em Encerrado
  INSERT INTO tinder_jobs (creator_id, title, description, specialty, model, location, value, deadline, status, seed_batch)
  VALUES
    (expert_ids[1], 'Gestor de Tráfego - Meta Ads', 'Buscamos gestor para escalar produto digital. Remoto, PJ.', 'TRAFEGO', 'Projeto', 'Remoto', 8000, NULL, 'OPEN', 'fake_3_condicoes'),
    (COALESCE(expert_ids[2], expert_ids[1]), 'Copywriter Sênior - Funil Perpétuo', 'Copy para funil evergreen. Contrato fixo mensal.', 'COPY', 'Fixo', 'Remoto', 5000, '2025-06-30'::date, 'OPEN', 'fake_3_condicoes'),
    (COALESCE(expert_ids[3], expert_ids[1]), 'Especialista Automações + IA', 'Automações com Zapier e Make. Parceria com participação.', 'AUTOMACOES', 'Parceria', 'Remoto', NULL, '2025-08-15'::date, 'OPEN', 'fake_3_condicoes'),
    (expert_ids[1], 'Social Media Estratégico', 'Planejamento e criação de conteúdo. Recorrente.', 'SOCIAL_MEDIA', 'Projeto', 'Remoto', 3500, NULL, 'OPEN', 'fake_3_condicoes'),
    (COALESCE(expert_ids[2], expert_ids[1]), 'Estrategista para Lançamento', 'Consultoria para lançamento de produto. 3 meses.', 'ESTRATEGIA', 'Projeto', 'Remoto', 12000, '2025-12-31'::date, 'OPEN', 'fake_3_condicoes');

  -- ========== VAGAS ENCERRADAS (aba "Encerrado") ==========
  -- status CLOSED ou deadline passado - NUNCA aparecem em Em aberto
  INSERT INTO tinder_jobs (creator_id, title, description, specialty, model, location, value, deadline, status, seed_batch)
  VALUES
    (COALESCE(expert_ids[2], expert_ids[1]), 'Gestor TikTok Ads', 'Vaga encerrada manualmente pelo criador.', 'TRAFEGO', 'Fixo', 'Remoto', 4500, NULL, 'CLOSED', 'fake_3_condicoes'),
    (COALESCE(expert_ids[3], expert_ids[1]), 'Copywriter Sequência E-mails', 'Prazo expirou em 2024.', 'COPY', 'Projeto', 'Remoto', 2500, '2024-01-15'::date, 'OPEN', 'fake_3_condicoes'),
    (expert_ids[1], 'Automação Atendimento IA', 'Vaga fechada. Projeto concluído.', 'AUTOMACOES', 'Fixo', 'Remoto', 4000, NULL, 'CLOSED', 'fake_3_condicoes'),
    (COALESCE(expert_ids[2], expert_ids[1]), 'Gestor Comunidade', 'Deadline passou.', 'SOCIAL_MEDIA', 'Parceria', 'Remoto', NULL, '2024-03-01'::date, 'OPEN', 'fake_3_condicoes'),
    (COALESCE(expert_ids[3], expert_ids[1]), 'Consultoria Estratégica', 'Vaga encerrada.', 'ESTRATEGIA', 'Projeto', 'Remoto', 12000, NULL, 'CLOSED', 'fake_3_condicoes');

  -- ========== MINHAS VAGAS (aba "Minhas vagas") ==========
  -- creator_id = seu user - faça login com este usuário para ver
  INSERT INTO tinder_jobs (creator_id, title, description, specialty, model, location, value, deadline, status, seed_batch)
  VALUES
    (meu_user_id, 'Minha vaga: Tráfego Pago', 'Vaga que eu criei - aberta.', 'TRAFEGO', 'Projeto', 'Remoto', 7000, '2025-07-01'::date, 'OPEN', 'fake_3_condicoes'),
    (meu_user_id, 'Minha vaga: Copywriter', 'Vaga que eu criei - aberta.', 'COPY', 'Fixo', 'Remoto', 4000, NULL, 'OPEN', 'fake_3_condicoes'),
    (meu_user_id, 'Minha vaga: Automações', 'Vaga que eu criei - encerrada.', 'AUTOMACOES', 'Parceria', 'Remoto', NULL, '2024-02-01'::date, 'OPEN', 'fake_3_condicoes'),
    (meu_user_id, 'Minha vaga: Social Media', 'Vaga que eu criei - fechada.', 'SOCIAL_MEDIA', 'Projeto', 'Remoto', 3000, NULL, 'CLOSED', 'fake_3_condicoes'),
    (meu_user_id, 'Minha vaga: Estratégia', 'Vaga que eu criei - aberta sem prazo.', 'ESTRATEGIA', 'Projeto', 'Remoto', 10000, NULL, 'OPEN', 'fake_3_condicoes');

  RAISE NOTICE 'Vagas criadas! Faça login como o usuário com ID % para ver "Minhas vagas"', meu_user_id;
END $$;

-- 3. Verificar distribuição
SELECT 
  CASE 
    WHEN status = 'OPEN' AND (deadline IS NULL OR (deadline::date >= CURRENT_DATE)) THEN 'Em aberto'
    WHEN status = 'CLOSED' OR (deadline IS NOT NULL AND deadline::date < CURRENT_DATE) THEN 'Encerrado'
  END as aba,
  COUNT(*) as total,
  array_agg(title ORDER BY id) as titulos
FROM tinder_jobs
WHERE created_at >= NOW() - INTERVAL '2 minutes'
GROUP BY 1;
