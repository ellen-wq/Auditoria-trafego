-- ============================================
-- Adicionar coluna niche em tinder_service_profiles
-- Resolve: "Could not find the 'niche' column of 'tinder_service_profiles' in the schema cache"
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================

ALTER TABLE public.tinder_service_profiles
  ADD COLUMN IF NOT EXISTS niche TEXT DEFAULT '';

COMMENT ON COLUMN public.tinder_service_profiles.niche IS 'Nicho/área de atuação do prestador (opcional).';
