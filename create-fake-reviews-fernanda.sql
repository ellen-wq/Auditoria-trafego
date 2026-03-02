-- ============================================================
-- Criar 3 depoimentos fake para fernanda@gmail.com
-- ============================================================

-- 1. Buscar user_id do email fernanda@gmail.com
DO $$
DECLARE
  target_user_id UUID;
  reviewer1_id UUID;
  reviewer2_id UUID;
  reviewer3_id UUID;
BEGIN
  -- Buscar user_id de fernanda@gmail.com
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'fernanda@gmail.com'
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'Usuário fernanda@gmail.com não encontrado. Pulando criação de depoimentos.';
    RETURN;
  END IF;

  RAISE NOTICE 'Usuário encontrado: %', target_user_id;

  -- Buscar 3 user_ids diferentes para serem os autores dos depoimentos
  -- Vamos buscar usuários que não sejam a própria Fernanda
  SELECT id INTO reviewer1_id
  FROM auth.users
  WHERE email != 'fernanda@gmail.com'
  LIMIT 1;

  SELECT id INTO reviewer2_id
  FROM auth.users
  WHERE email != 'fernanda@gmail.com' AND id != reviewer1_id
  LIMIT 1;

  SELECT id INTO reviewer3_id
  FROM auth.users
  WHERE email != 'fernanda@gmail.com' AND id != reviewer1_id AND id != reviewer2_id
  LIMIT 1;

  -- Se não houver usuários suficientes, criar depoimentos sem autor_user_id
  -- Inserir 3 depoimentos fake
  INSERT INTO profile_reviews (
    profile_user_id,
    rating,
    depoimento,
    autor_nome,
    autor_user_id,
    created_at
  ) VALUES
  (
    target_user_id,
    5,
    'Trabalhei com a Fernanda em um projeto de lançamento e fiquei impressionado com a qualidade do trabalho. Profissionalismo e dedicação em cada etapa do processo. Recomendo muito!',
    'João Silva',
    reviewer1_id,
    NOW() - INTERVAL '30 days'
  ),
  (
    target_user_id,
    5,
    'Parceria incrível! A Fernanda tem uma visão estratégica única e consegue executar com excelência. Os resultados superaram todas as expectativas. Sem dúvida, uma das melhores profissionais que já trabalhei.',
    'Maria Santos',
    reviewer2_id,
    NOW() - INTERVAL '15 days'
  ),
  (
    target_user_id,
    5,
    'Experiência fantástica trabalhando junto com a Fernanda. Comunicação clara, prazos respeitados e resultados excepcionais. Já estamos planejando o próximo projeto juntos!',
    'Carlos Oliveira',
    reviewer3_id,
    NOW() - INTERVAL '7 days'
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '3 depoimentos fake criados para fernanda@gmail.com';
END $$;
