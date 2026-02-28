-- ============================================
-- SCRIPT PARA UNIFICAR tinder_mentor_profiles E tinder_expert_profiles
-- ============================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- ⚠️ ATENÇÃO: Faça backup antes de executar!

-- 1. ADICIONAR CAMPOS DE tinder_expert_profiles EM tinder_mentor_profiles
ALTER TABLE tinder_mentor_profiles
  ADD COLUMN IF NOT EXISTS is_expert BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_coproducer BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS goal_text TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS search_bio TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS preferences_json JSONB DEFAULT '{}'::JSONB;

-- 2. MIGRAR DADOS DE tinder_expert_profiles PARA tinder_mentor_profiles
UPDATE tinder_mentor_profiles tmp
SET 
  is_expert = COALESCE(tep.is_expert, FALSE),
  is_coproducer = COALESCE(tep.is_coproducer, FALSE),
  goal_text = COALESCE(tep.goal_text, ''),
  search_bio = COALESCE(tep.search_bio, ''),
  preferences_json = COALESCE(tep.preferences_json, '{}'::JSONB)
FROM tinder_expert_profiles tep
WHERE tmp.user_id = tep.user_id;

-- 3. VERIFICAR MIGRAÇÃO
SELECT 
  'tinder_mentor_profiles' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN is_expert = TRUE THEN 1 END) as total_experts,
  COUNT(CASE WHEN is_coproducer = TRUE THEN 1 END) as total_coprodutores
FROM tinder_mentor_profiles;

-- 4. VERIFICAR SE HÁ DADOS EM tinder_expert_profiles QUE NÃO FORAM MIGRADOS
SELECT 
  tep.user_id,
  tep.is_expert,
  tep.is_coproducer,
  CASE 
    WHEN tmp.user_id IS NULL THEN '⚠️ Usuário não existe em tinder_mentor_profiles'
    ELSE '✓ OK'
  END as status
FROM tinder_expert_profiles tep
LEFT JOIN tinder_mentor_profiles tmp ON tep.user_id = tmp.user_id;

-- 5. REMOVER TABELA tinder_expert_profiles (APENAS SE A MIGRAÇÃO ESTIVER OK)
-- ⚠️ DESCOMENTE APENAS APÓS VERIFICAR QUE A MIGRAÇÃO FOI BEM-SUCEDIDA
-- DROP TABLE IF EXISTS tinder_expert_profiles CASCADE;

-- 6. VERIFICAR ESTRUTURA FINAL
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'tinder_mentor_profiles'
  AND column_name IN ('is_expert', 'is_coproducer', 'goal_text', 'search_bio', 'preferences_json')
ORDER BY column_name;
