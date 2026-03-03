-- ============================================
-- Perfil do Prestador – alterações no banco (Supabase)
-- Execute no SQL Editor do Supabase Dashboard
-- Usado pela página /tinder-do-fluxo/prestadores/:id
-- ============================================

-- 1. Coluna state (UF) para exibir "Cidade, UF"
ALTER TABLE public.tinder_service_profiles
  ADD COLUMN IF NOT EXISTS state TEXT DEFAULT '';

COMMENT ON COLUMN public.tinder_service_profiles.state IS 'Sigla do estado (UF) para exibir no perfil e no diretório (ex.: SP, MG).';

-- 2. Headline (subtítulo do perfil, ex.: "Copywriter Especialista em Lançamentos")
ALTER TABLE public.tinder_service_profiles
  ADD COLUMN IF NOT EXISTS headline TEXT DEFAULT '';

-- 3. Preço mínimo para exibir "A partir de R$ X /projeto"
ALTER TABLE public.tinder_service_profiles
  ADD COLUMN IF NOT EXISTS preco_minimo INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.tinder_service_profiles.preco_minimo IS 'Valor mínimo em reais (ex.: 1500 para R$ 1.500). NULL = não informado.';

-- 4. Benefícios do serviço (lista para os checkmarks no card lateral)
-- Armazenado como array de texto; ex.: ['Análise de Avatar Gratuita', '2 Rodadas de Revisão', 'Entrega em até 7 dias úteis']
ALTER TABLE public.tinder_service_profiles
  ADD COLUMN IF NOT EXISTS beneficios TEXT[] DEFAULT ARRAY[]::TEXT[];

COMMENT ON COLUMN public.tinder_service_profiles.beneficios IS 'Lista de benefícios exibidos no card lateral do perfil (ex.: Análise de Avatar Gratuita).';

-- 5. Garantir created_at para "Membro desde XXXX"
-- (created_at já existe em create-tinder-tables; só garantir se migração antiga não tiver)
ALTER TABLE public.tinder_service_profiles
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 6. Garantir demais colunas usadas pelo perfil
ALTER TABLE public.tinder_service_profiles
  ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS instagram TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS whatsapp TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS specialty TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS certification TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS portfolio TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS experience TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS rating_avg REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 7. Tabela de reviews (avaliações) – garantir estrutura
-- tinder_reviews: reviewer_id, service_profile_id, rating, comment, created_at
SELECT 1 FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'tinder_reviews';
-- Se não existir, descomente e execute:
/*
CREATE TABLE IF NOT EXISTS public.tinder_reviews (
  id SERIAL PRIMARY KEY,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_profile_id INTEGER NOT NULL REFERENCES public.tinder_service_profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tinder_reviews_service_profile_id
  ON public.tinder_reviews (service_profile_id);
*/

-- 8. (Opcional) Exemplo de atualização para um prestador de teste
-- UPDATE public.tinder_service_profiles
-- SET
--   headline = 'Copywriter Especialista em Lançamentos e Vendas Diretas',
--   state = 'SP',
--   preco_minimo = 1500,
--   beneficios = ARRAY['Análise de Avatar Gratuita', '2 Rodadas de Revisão', 'Entrega em até 7 dias úteis']
-- WHERE id = 1;
