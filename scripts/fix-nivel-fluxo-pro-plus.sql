-- Normaliza nivel_fluxo_label para o slug usado no formulário (pro-plus)
-- Executar no Supabase SQL Editor se existirem perfis com valor em formato de label

UPDATE public.tinder_mentor_profiles
SET nivel_fluxo_label = 'pro-plus'
WHERE nivel_fluxo_label IN ('Pro +', 'Pro+', 'Pro Plus');
