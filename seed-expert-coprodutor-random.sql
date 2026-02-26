-- ============================================================
-- Atribuir aleatoriamente Expert/Coprodutor para MENTORADOS
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- 1. Criar ou atualizar perfis expert para MENTORADOS aleatoriamente
-- 50% chance de ser Expert, 30% chance de ser Coprodutor, 20% chance de ser ambos

DO $$
DECLARE
  mentorado_record RECORD;
  is_expert_val BOOLEAN;
  is_coproducer_val BOOLEAN;
  random_val NUMERIC;
BEGIN
  -- Loop através de todos os MENTORADOS
  FOR mentorado_record IN 
    SELECT user_id, name 
    FROM public.user_roles 
    WHERE role = 'MENTORADO'
  LOOP
    -- Gerar valores aleatórios
    random_val := random();
    
    -- 50% chance de ser Expert
    is_expert_val := random_val < 0.5;
    
    -- 30% chance de ser Coprodutor (independente de Expert)
    is_coproducer_val := random_val > 0.5 AND random_val < 0.8;
    
    -- 20% chance de ser ambos (últimos 20%)
    IF random_val >= 0.8 THEN
      is_expert_val := true;
      is_coproducer_val := true;
    END IF;
    
    -- Inserir ou atualizar perfil expert
    INSERT INTO public.tinder_expert_profiles (
      user_id,
      is_expert,
      is_coproducer,
      goal_text,
      search_bio,
      preferences_json,
      updated_at
    )
    VALUES (
      mentorado_record.user_id,
      is_expert_val,
      is_coproducer_val,
      CASE 
        WHEN is_expert_val AND is_coproducer_val THEN 'Objetivo: escalar meu negócio e criar parcerias estratégicas'
        WHEN is_expert_val THEN 'Objetivo: escalar meu negócio e buscar oportunidades de crescimento'
        WHEN is_coproducer_val THEN 'Objetivo: criar parcerias estratégicas e coproduções'
        ELSE 'Objetivo: crescer e expandir meu negócio'
      END,
      CASE 
        WHEN is_expert_val AND is_coproducer_val THEN 'Busco parcerias estratégicas e oportunidades de coprodução para escalar.'
        WHEN is_expert_val THEN 'Expert em busca de oportunidades de crescimento e expansão.'
        WHEN is_coproducer_val THEN 'Aberto para coproduções e parcerias estratégicas.'
        ELSE 'Em busca de conexões e oportunidades.'
      END,
      '{}'::jsonb,
      NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      is_expert = is_expert_val,
      is_coproducer = is_coproducer_val,
      goal_text = CASE 
        WHEN is_expert_val AND is_coproducer_val THEN 'Objetivo: escalar meu negócio e criar parcerias estratégicas'
        WHEN is_expert_val THEN 'Objetivo: escalar meu negócio e buscar oportunidades de crescimento'
        WHEN is_coproducer_val THEN 'Objetivo: criar parcerias estratégicas e coproduções'
        ELSE tinder_expert_profiles.goal_text
      END,
      search_bio = CASE 
        WHEN is_expert_val AND is_coproducer_val THEN 'Busco parcerias estratégicas e oportunidades de coprodução para escalar.'
        WHEN is_expert_val THEN 'Expert em busca de oportunidades de crescimento e expansão.'
        WHEN is_coproducer_val THEN 'Aberto para coproduções e parcerias estratégicas.'
        ELSE tinder_expert_profiles.search_bio
      END,
      updated_at = NOW();
    
    RAISE NOTICE 'Atualizado: % - Expert: %, Coprodutor: %', 
      mentorado_record.name, 
      is_expert_val, 
      is_coproducer_val;
  END LOOP;
END $$;

-- 2. Verificar resultados
SELECT 
  ur.name,
  ur.role,
  ep.is_expert,
  ep.is_coproducer,
  CASE 
    WHEN ep.is_expert AND ep.is_coproducer THEN 'Expert + Coprodutor'
    WHEN ep.is_expert THEN 'Expert'
    WHEN ep.is_coproducer THEN 'Coprodutor'
    ELSE 'Nenhum'
  END as tipo
FROM public.user_roles ur
LEFT JOIN public.tinder_expert_profiles ep ON ur.user_id = ep.user_id
WHERE ur.role = 'MENTORADO'
ORDER BY ur.name;

-- 3. Estatísticas
SELECT 
  COUNT(*) FILTER (WHERE is_expert = true AND is_coproducer = true) as ambos,
  COUNT(*) FILTER (WHERE is_expert = true AND is_coproducer = false) as apenas_expert,
  COUNT(*) FILTER (WHERE is_expert = false AND is_coproducer = true) as apenas_coprodutor,
  COUNT(*) FILTER (WHERE is_expert = false AND is_coproducer = false) as nenhum,
  COUNT(*) as total
FROM public.tinder_expert_profiles ep
JOIN public.user_roles ur ON ep.user_id = ur.user_id
WHERE ur.role = 'MENTORADO';
