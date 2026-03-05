-- Nível do Fluxo no perfil mentorado (preenchido no perfil, ex: PRO, MASTER)
-- Executar no Supabase SQL Editor

ALTER TABLE public.tinder_mentor_profiles
  ADD COLUMN IF NOT EXISTS nivel_fluxo_label TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS nivel_fluxo_percent INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.tinder_mentor_profiles.nivel_fluxo_label IS 'Label do nível no fluxo (ex: PRO, MASTER)';
COMMENT ON COLUMN public.tinder_mentor_profiles.nivel_fluxo_percent IS 'Percentual de progresso para próximo nível (0-100), opcional';
