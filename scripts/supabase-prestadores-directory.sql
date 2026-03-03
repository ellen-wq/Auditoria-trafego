-- ============================================
-- Diretório de Prestadores – ajustes no Supabase
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================

-- 1. Coluna opcional para exibir "Cidade, UF" nos cards (ex.: "São Paulo, SP")
ALTER TABLE public.tinder_service_profiles
  ADD COLUMN IF NOT EXISTS state TEXT DEFAULT '';

COMMENT ON COLUMN public.tinder_service_profiles.state IS 'Sigla do estado (UF) para exibição no formato Cidade, UF no diretório de prestadores.';

-- 2. Garantir que colunas usadas pelo diretório existam (caso tabela seja antiga)
ALTER TABLE public.tinder_service_profiles
  ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS specialty TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS certification TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS experience TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS rating_avg REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- 3. Índices para filtros e ordenação (se ainda não existirem)
CREATE INDEX IF NOT EXISTS idx_tinder_service_profiles_rating_avg
  ON public.tinder_service_profiles (rating_avg DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_tinder_service_profiles_specialty
  ON public.tinder_service_profiles (specialty)
  WHERE specialty IS NOT NULL AND specialty != '';

CREATE INDEX IF NOT EXISTS idx_tinder_service_profiles_city
  ON public.tinder_service_profiles (city)
  WHERE city IS NOT NULL AND city != '';

-- 4. (Opcional) Atualizar state para registros que já tenham cidade no formato "Cidade, UF"
-- Descomente e ajuste se quiser preencher state a partir de city existente, ex.:
-- UPDATE public.tinder_service_profiles
-- SET state = trim(split_part(city, ',', 2))
-- WHERE city LIKE '%,%' AND (state IS NULL OR state = '');
