-- ============================================================
-- Migrar tabelas audits/campaigns/recommendations/creatives para UUID
--
-- COMO USAR:
-- 1) Primeiro tente na aplicação: ao ver "Erro ao criar auditoria", clique
--    no botão "Corrigir banco de dados (executar migração)" na mesma tela.
-- 2) Se o botão não funcionar, execute ESTE ARQUIVO no Supabase:
--    Dashboard > SQL Editor > Cole o conteúdo abaixo > Run
--
-- ATENÇÃO: Esta migração RECRIA as tabelas. Dados existentes serão PERDIDOS.
-- Faça backup antes se necessário.
-- ============================================================

-- 1. Remover tabelas dependentes (em ordem)
DROP TABLE IF EXISTS creatives CASCADE;
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS audits CASCADE;

-- 2. Recriar audits com user_id UUID (auth.users)
CREATE TABLE public.audits (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_price REAL NOT NULL,
  product_type TEXT DEFAULT 'low_ticket',
  has_pre_checkout INTEGER NOT NULL DEFAULT 0,
  filename TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audits_user_id ON public.audits(user_id);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON public.audits(created_at);

-- 3. Recriar campaigns
CREATE TABLE public.campaigns (
  id SERIAL PRIMARY KEY,
  audit_id INTEGER NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  spend REAL DEFAULT 0,
  ctr_link REAL DEFAULT 0,
  link_clicks INTEGER DEFAULT 0,
  lp_views INTEGER DEFAULT 0,
  lp_rate REAL DEFAULT 0,
  checkouts INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  cpa REAL DEFAULT 0,
  cpc REAL DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  scenario INTEGER DEFAULT 0,
  hook_rate REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_audit_id ON public.campaigns(audit_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_scenario ON public.campaigns(scenario);

-- 4. Recriar recommendations
CREATE TABLE public.recommendations (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  steps_json TEXT DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_campaign_id ON public.recommendations(campaign_id);

-- 5. Recriar creatives com user_id UUID
CREATE TABLE public.creatives (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audit_id INTEGER NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  campaign_id INTEGER NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  copy_text TEXT DEFAULT '',
  video_link TEXT DEFAULT '',
  analysis_result TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creatives_user_id ON public.creatives(user_id);
CREATE INDEX IF NOT EXISTS idx_creatives_audit_id ON public.creatives(audit_id);
