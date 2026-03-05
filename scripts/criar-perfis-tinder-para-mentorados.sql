-- ============================================
-- Criar tinder_mentor_profiles para mentorados que ainda não têm
-- (para os cards aparecerem no feed Expert & Coprodutor)
-- Execute no SQL Editor do Supabase
-- ============================================

-- Inserir uma linha em tinder_mentor_profiles para cada MENTORADO que ainda não tem
INSERT INTO tinder_mentor_profiles (user_id)
SELECT ur.user_id
FROM user_roles ur
LEFT JOIN tinder_mentor_profiles tmp ON tmp.user_id = ur.user_id
WHERE ur.role = 'MENTORADO'
  AND tmp.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
