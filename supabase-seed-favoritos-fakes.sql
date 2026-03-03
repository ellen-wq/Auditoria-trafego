-- ============================================================
-- Seed: 3 favoritos para o primeiro MENTORADO ver na tela
-- Execute no Supabase SQL Editor (Dashboard > SQL Editor).
-- Faça login como o primeiro MENTORADO e acesse Tinder do Fluxo > Favoritos.
-- ============================================================

WITH viewer AS (
  SELECT user_id FROM public.user_roles WHERE role = 'MENTORADO' ORDER BY created_at ASC LIMIT 1
),
targets AS (
  SELECT user_id, rn FROM (
    SELECT ur.user_id, row_number() OVER (ORDER BY ur.created_at ASC) AS rn
    FROM public.user_roles ur, viewer v
    WHERE ur.user_id != v.user_id
  ) x WHERE rn <= 3
),
types AS (
  SELECT * FROM unnest(ARRAY['EXPERT', 'COMUNIDADE', 'EXPERT']) WITH ORDINALITY AS t(type_name, rn)
)
INSERT INTO public.tinder_favorites (user_id, target_user_id, type)
SELECT v.user_id, t.user_id, ty.type_name
FROM viewer v
JOIN targets t ON true
JOIN types ty ON ty.rn = t.rn
ON CONFLICT (user_id, target_user_id, type) DO NOTHING;

-- Verificar quantos favoritos o primeiro MENTORADO tem
SELECT
  ur.name AS mentorado_nome,
  COUNT(tf.id) AS total_favoritos
FROM public.user_roles ur
LEFT JOIN public.tinder_favorites tf ON tf.user_id = ur.user_id
WHERE ur.role = 'MENTORADO'
GROUP BY ur.user_id, ur.name
ORDER BY ur.created_at ASC
LIMIT 1;
