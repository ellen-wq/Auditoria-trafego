-- ============================================
-- Diagnóstico: por que o feed Expert & Coprodutor não mostra cards?
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1) Total de mentorados (user_roles) – o feed exclui o usuário logado na hora da requisição
SELECT COUNT(*) AS total_mentorados
FROM user_roles
WHERE role = 'MENTORADO';

-- 2) Quantos mentorados têm linha em tinder_mentor_profiles?
SELECT COUNT(*) AS mentorados_com_perfil
FROM user_roles ur
INNER JOIN tinder_mentor_profiles tmp ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO';

-- 3) Quantos aparecem no feed? (Expert OU Coprodutor, mutuamente exclusivo)
SELECT COUNT(*) AS total_no_feed
FROM user_roles ur
INNER JOIN tinder_mentor_profiles tmp ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO'
  AND (
    (tmp.is_expert = true AND (tmp.is_coproducer = false OR tmp.is_coproducer IS NULL))
    OR
    (tmp.is_coproducer = true AND (tmp.is_expert = false OR tmp.is_expert IS NULL))
  );

-- 4) Lista dos perfis que DEVERIAM aparecer no feed (nome, is_expert, is_coproducer)
SELECT ur.user_id, ur.name, tmp.is_expert, tmp.is_coproducer
FROM user_roles ur
INNER JOIN tinder_mentor_profiles tmp ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO'
  AND (
    (tmp.is_expert = true AND (tmp.is_coproducer = false OR tmp.is_coproducer IS NULL))
    OR
    (tmp.is_coproducer = true AND (tmp.is_expert = false OR tmp.is_expert IS NULL))
  )
ORDER BY ur.name;

-- 5) Mentorados SEM perfil em tinder_mentor_profiles (nunca aparecem no feed)
SELECT ur.user_id, ur.name
FROM user_roles ur
LEFT JOIN tinder_mentor_profiles tmp ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO' AND tmp.user_id IS NULL
ORDER BY ur.name;

-- 6) Mentorados COM perfil mas is_expert e is_coproducer ambos false/null (também não aparecem)
SELECT ur.user_id, ur.name, tmp.is_expert, tmp.is_coproducer
FROM user_roles ur
INNER JOIN tinder_mentor_profiles tmp ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO'
  AND NOT (
    (tmp.is_expert = true AND (tmp.is_coproducer = false OR tmp.is_coproducer IS NULL))
    OR
    (tmp.is_coproducer = true AND (tmp.is_expert = false OR tmp.is_expert IS NULL))
  )
ORDER BY ur.name;
