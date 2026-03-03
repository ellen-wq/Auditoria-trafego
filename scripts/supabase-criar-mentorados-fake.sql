-- ============================================================
-- CRIAR MENTORADOS FAKE (para o feed Expert mostrar cards)
-- Use quando você for o ÚNICO MENTORADO e o feed estiver vazio.
--
-- Passo a passo:
-- 1. No Supabase: Authentication > Users > "Add user" > crie 2 ou 3 usuários
--    (ex.: email: mentorado1@teste.com, senha: teste123). Anote o UUID de cada um.
-- 2. Abaixo, substitua UUID_1, UUID_2, UUID_3 pelos UUIDs reais (ou use menos linhas).
-- 3. Execute este script no SQL Editor.
-- 4. Depois execute: scripts/supabase-feed-expert-funcionar.sql
-- ============================================================

-- Inserir em user_roles (role MENTORADO + nome) para os usuários que você criou no Auth.
-- OBRIGATÓRIO: os user_id precisam existir em auth.users (criados em Authentication > Add user).
--
-- 1. Crie 2 ou 3 usuários em: Supabase > Authentication > Users > "Add user"
--    (ex.: mentorado1@teste.com / senha teste123). Copie o UUID de cada um.
-- 2. Substitua abaixo COLE-UUID-1, COLE-UUID-2 pelos UUIDs reais (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).
-- 3. Execute este script. Se der erro de foreign key, o UUID não existe em auth.users.
-- 4. Depois execute: supabase-feed-expert-funcionar.sql
--
-- Exemplo (edite os UUIDs):
/*
INSERT INTO public.user_roles (user_id, name, role, created_at, updated_at)
VALUES
  ('COLE-UUID-1'::uuid, 'Mariana Alves', 'MENTORADO', NOW(), NOW()),
  ('COLE-UUID-2'::uuid, 'Juliana Santos', 'MENTORADO', NOW(), NOW()),
  ('COLE-UUID-3'::uuid, 'Camila Freitas', 'MENTORADO', NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();
*/
SELECT 'Edite este script: substitua COLE-UUID-1, COLE-UUID-2, etc. pelos UUIDs dos usuários criados em Authentication > Users. Depois descomente o INSERT acima e execute. Em seguida rode supabase-feed-expert-funcionar.sql.' AS instrucao;
