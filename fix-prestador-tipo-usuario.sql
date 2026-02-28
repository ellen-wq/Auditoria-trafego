-- ============================================
-- CORRIGIR tipo_usuario PARA PRESTADOR
-- ============================================
-- Execute este script para corrigir os PRESTADOR que estão com tipo_usuario = 'mentorado'

-- Corrigir todos os PRESTADOR para ter tipo_usuario = 'aluno'
UPDATE user_roles 
SET tipo_usuario = 'aluno'
WHERE role = 'PRESTADOR' AND (tipo_usuario IS NULL OR tipo_usuario != 'aluno');

-- Verificar resultado
SELECT 
  user_id,
  name,
  role,
  tipo_usuario,
  CASE 
    WHEN role = 'PRESTADOR' AND tipo_usuario = 'aluno' THEN '✓ OK - Corrigido!'
    WHEN role = 'PRESTADOR' AND tipo_usuario = 'mentorado' THEN '❌ Ainda errado!'
    WHEN role = 'PRESTADOR' AND tipo_usuario IS NULL THEN '⚠️ Precisa ser aluno'
    ELSE '✓ OK'
  END as status
FROM user_roles
WHERE role = 'PRESTADOR'
ORDER BY name;
