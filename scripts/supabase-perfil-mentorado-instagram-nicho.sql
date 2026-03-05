-- ============================================
-- Perfil do Mentorado – instagram e nicho
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================

-- Garantir colunas em tinder_mentor_profiles
ALTER TABLE public.tinder_mentor_profiles
  ADD COLUMN IF NOT EXISTS instagram TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS niche TEXT DEFAULT '';

COMMENT ON COLUMN public.tinder_mentor_profiles.instagram IS 'Instagram do mentorado (ex: usuario sem @)';
COMMENT ON COLUMN public.tinder_mentor_profiles.niche IS 'Nicho de atuação (ex: Marketing Digital, E-commerce)';

-- Garantir nivel_fluxo (caso add-nivel-fluxo-mentor-profiles.sql não tenha sido executado)
ALTER TABLE public.tinder_mentor_profiles
  ADD COLUMN IF NOT EXISTS nivel_fluxo_label TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS nivel_fluxo_percent INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.tinder_mentor_profiles.nivel_fluxo_label IS 'Nível no Fluxo: newbie (0 vendas), soft (1-10k), hard (10-100k), pro (100k-1M), pro-plus (1-2M), master (2M+)';
COMMENT ON COLUMN public.tinder_mentor_profiles.nivel_fluxo_percent IS 'Percentual de progresso para próximo nível (0-100), opcional';
