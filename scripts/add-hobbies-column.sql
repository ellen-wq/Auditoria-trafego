-- ============================================================
-- Adicionar coluna hobbies em tinder_mentor_profiles e tinder_service_profiles
-- Execute no SQL Editor do Supabase Dashboard (Project > SQL Editor > New query)
-- Necessário para o fluxo de registo que envia niche, hobbies, cidade e nível.
-- ============================================================

-- tinder_mentor_profiles (mentorados)
ALTER TABLE public.tinder_mentor_profiles
  ADD COLUMN IF NOT EXISTS hobbies TEXT DEFAULT '';

COMMENT ON COLUMN public.tinder_mentor_profiles.hobbies IS 'Hobbies do mentorado (texto livre ou lista separada por vírgulas)';

-- tinder_service_profiles (prestadores)
ALTER TABLE public.tinder_service_profiles
  ADD COLUMN IF NOT EXISTS hobbies TEXT DEFAULT '';

COMMENT ON COLUMN public.tinder_service_profiles.hobbies IS 'Hobbies do prestador (texto livre)';
