-- ============================================================
-- Seed: 3 perfis fakes como favoritos para TODOS os usuários
-- Execute no Supabase SQL Editor (Dashboard > SQL Editor).
-- Os 3 fakes devem existir em user_roles com estes nomes.
-- Qualquer usuário que acessar Tinder do Fluxo > Favoritos verá os 3.
-- ============================================================

-- Perfis fake (nomes exatos em user_roles)
WITH fakes AS (
  SELECT user_id, row_number() OVER (ORDER BY name) AS rn
  FROM public.user_roles
  WHERE name IN ('Bruno Silva', 'Maria Santos', 'Ana Costa')
  LIMIT 3
),
types AS (
  SELECT * FROM unnest(ARRAY['EXPERT', 'COMUNIDADE', 'EXPERT']) WITH ORDINALITY AS t(type_name, rn)
),
-- Todos os usuários que não são os 3 fakes (cada um receberá os 3 favoritos)
viewers AS (
  SELECT user_id FROM public.user_roles
  WHERE user_id NOT IN (SELECT user_id FROM fakes)
)
INSERT INTO public.tinder_favorites (user_id, target_user_id, type)
SELECT v.user_id, f.user_id, ty.type_name
FROM viewers v
CROSS JOIN fakes f
JOIN types ty ON ty.rn = f.rn
ON CONFLICT (user_id, target_user_id, type) DO NOTHING;

-- Verificar: total de usuários com favoritos e totais por usuário
SELECT
  COUNT(DISTINCT tf.user_id) AS usuarios_com_favoritos,
  COUNT(*) AS total_linhas_favoritos
FROM public.tinder_favorites tf;
