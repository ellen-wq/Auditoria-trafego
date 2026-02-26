-- ============================================================
-- Fluxer Auditoria - Migração SQLite → Supabase (PostgreSQL)
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'MENTORADO',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de auditorias
CREATE TABLE IF NOT EXISTS audits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  product_price REAL NOT NULL,
  product_type TEXT DEFAULT 'low_ticket',
  has_pre_checkout INTEGER NOT NULL DEFAULT 0,
  filename TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de campanhas
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  audit_id INTEGER NOT NULL REFERENCES audits(id),
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

-- Tabela de recomendações
CREATE TABLE IF NOT EXISTS recommendations (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  steps_json TEXT DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de criativos
CREATE TABLE IF NOT EXISTS creatives (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  audit_id INTEGER NOT NULL REFERENCES audits(id),
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
  copy_text TEXT DEFAULT '',
  video_link TEXT DEFAULT '',
  analysis_result TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audits_user_id ON audits(user_id);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_audit_id ON campaigns(audit_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_scenario ON campaigns(scenario);
CREATE INDEX IF NOT EXISTS idx_recommendations_campaign_id ON recommendations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_creatives_user_id ON creatives(user_id);
CREATE INDEX IF NOT EXISTS idx_creatives_audit_id ON creatives(audit_id);

-- ============================================================
-- Funções RPC para queries complexas do dashboard admin
-- ============================================================

-- Função: Ranking de ROAS
CREATE OR REPLACE FUNCTION admin_roas_ranking(
  p_from TEXT DEFAULT NULL,
  p_to TEXT DEFAULT NULL,
  p_product_type TEXT DEFAULT NULL
)
RETURNS TABLE(
  id INTEGER, name TEXT, email TEXT,
  total_spend REAL, total_purchases BIGINT,
  total_revenue REAL, roas REAL
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email,
    SUM(c.spend)::REAL as total_spend,
    SUM(c.purchases)::BIGINT as total_purchases,
    SUM(c.purchases * a.product_price)::REAL as total_revenue,
    COALESCE(
      (SUM(c.purchases * a.product_price) / NULLIF(SUM(c.spend), 0)),
      0
    )::REAL as roas
  FROM users u
  JOIN audits a ON a.user_id = u.id
  JOIN campaigns c ON c.audit_id = a.id
  WHERE u.role = 'MENTORADO'
    AND (p_from IS NULL OR a.created_at >= p_from::TIMESTAMPTZ)
    AND (p_to IS NULL OR a.created_at <= p_to::TIMESTAMPTZ)
    AND (p_product_type IS NULL OR a.product_type = p_product_type)
  GROUP BY u.id, u.name, u.email
  HAVING SUM(c.spend) > 0
  ORDER BY roas DESC;
END;
$$;

-- ============================================================
-- Tinder do Fluxo (módulo)
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS has_seen_tinder_do_fluxo_tutorial BOOLEAN DEFAULT FALSE;

-- Garante novo role PRESTADOR
DO $$
BEGIN
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
  ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('MENTORADO', 'LIDERANCA', 'PRESTADOR'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

CREATE TABLE IF NOT EXISTS tinder_mentor_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  photo_url TEXT DEFAULT '',
  city TEXT DEFAULT '',
  instagram TEXT DEFAULT '',
  niche TEXT DEFAULT '',
  nivel_fluxo TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tinder_expert_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  is_expert BOOLEAN DEFAULT FALSE,
  is_coproducer BOOLEAN DEFAULT FALSE,
  goal_text TEXT DEFAULT '',
  search_bio TEXT DEFAULT '',
  preferences_json JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tinder_service_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  photo_url TEXT DEFAULT '',
  city TEXT DEFAULT '',
  instagram TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  specialty TEXT DEFAULT '',
  certification TEXT DEFAULT '',
  portfolio TEXT DEFAULT '',
  experience TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  rating_avg REAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tinder_interests (
  id SERIAL PRIMARY KEY,
  from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (from_user_id, to_user_id, type)
);

CREATE TABLE IF NOT EXISTS tinder_favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, target_user_id, type)
);

CREATE TABLE IF NOT EXISTS tinder_matches (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user1_id, user2_id, type)
);

CREATE TABLE IF NOT EXISTS tinder_reviews (
  id SERIAL PRIMARY KEY,
  reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_profile_id INTEGER NOT NULL REFERENCES tinder_service_profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tinder_jobs (
  id SERIAL PRIMARY KEY,
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  specialty TEXT DEFAULT '',
  model TEXT DEFAULT '',
  value BIGINT,
  deadline DATE,
  location TEXT DEFAULT '',
  status TEXT DEFAULT 'OPEN',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tinder_applications (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES tinder_jobs(id) ON DELETE CASCADE,
  candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT DEFAULT '',
  portfolio_link TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (job_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS tinder_partnerships (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES tinder_matches(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ,
  status TEXT DEFAULT 'NAO_INICIOU',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tinder_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  reference_id INTEGER,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tinder_do_fluxo_logs (
  id SERIAL PRIMARY KEY,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  meta JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tinder_interests_from ON tinder_interests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_tinder_interests_to ON tinder_interests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_tinder_matches_user1 ON tinder_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_tinder_matches_user2 ON tinder_matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_tinder_jobs_creator ON tinder_jobs(creator_id);
CREATE INDEX IF NOT EXISTS idx_tinder_jobs_status ON tinder_jobs(status);
CREATE INDEX IF NOT EXISTS idx_tinder_apps_job ON tinder_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_tinder_logs_created ON tinder_do_fluxo_logs(created_at DESC);

-- Função: Ranking de CTR
CREATE OR REPLACE FUNCTION admin_ctr_ranking(
  p_from TEXT DEFAULT NULL,
  p_to TEXT DEFAULT NULL,
  p_product_type TEXT DEFAULT NULL
)
RETURNS TABLE(
  id INTEGER, name TEXT, email TEXT,
  total_clicks BIGINT, total_impressions BIGINT, ctr REAL
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email,
    SUM(c.link_clicks)::BIGINT as total_clicks,
    SUM(c.impressions)::BIGINT as total_impressions,
    CASE WHEN SUM(c.impressions) > 0
      THEN (SUM(c.link_clicks)::REAL / SUM(c.impressions)::REAL)
      ELSE 0
    END::REAL as ctr
  FROM users u
  JOIN audits a ON a.user_id = u.id
  JOIN campaigns c ON c.audit_id = a.id
  WHERE u.role = 'MENTORADO'
    AND (p_from IS NULL OR a.created_at >= p_from::TIMESTAMPTZ)
    AND (p_to IS NULL OR a.created_at <= p_to::TIMESTAMPTZ)
    AND (p_product_type IS NULL OR a.product_type = p_product_type)
  GROUP BY u.id, u.name, u.email
  HAVING SUM(c.impressions) > 0
  ORDER BY ctr DESC;
END;
$$;

-- Função: Ranking de Conversão
CREATE OR REPLACE FUNCTION admin_conv_ranking(
  p_from TEXT DEFAULT NULL,
  p_to TEXT DEFAULT NULL,
  p_product_type TEXT DEFAULT NULL
)
RETURNS TABLE(
  id INTEGER, name TEXT, email TEXT,
  total_purchases BIGINT, total_lp_views BIGINT, conv_rate REAL
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email,
    SUM(c.purchases)::BIGINT as total_purchases,
    SUM(c.lp_views)::BIGINT as total_lp_views,
    CASE WHEN SUM(c.lp_views) > 0
      THEN (SUM(c.purchases)::REAL / SUM(c.lp_views)::REAL)
      ELSE 0
    END::REAL as conv_rate
  FROM users u
  JOIN audits a ON a.user_id = u.id
  JOIN campaigns c ON c.audit_id = a.id
  WHERE u.role = 'MENTORADO'
    AND (p_from IS NULL OR a.created_at >= p_from::TIMESTAMPTZ)
    AND (p_to IS NULL OR a.created_at <= p_to::TIMESTAMPTZ)
    AND (p_product_type IS NULL OR a.product_type = p_product_type)
  GROUP BY u.id, u.name, u.email
  HAVING SUM(c.lp_views) > 0
  ORDER BY conv_rate DESC;
END;
$$;

-- Função: Médias por usuário
CREATE OR REPLACE FUNCTION admin_per_user_avg(
  p_from TEXT DEFAULT NULL,
  p_to TEXT DEFAULT NULL,
  p_product_type TEXT DEFAULT NULL
)
RETURNS TABLE(
  avg_spend_per_user REAL,
  avg_purchases_per_user REAL,
  avg_cpa_per_user REAL,
  avg_revenue_per_user REAL
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    AVG(sub.user_spend)::REAL,
    AVG(sub.user_purchases)::REAL,
    AVG(CASE WHEN sub.user_purchases > 0 THEN sub.user_spend / sub.user_purchases ELSE 0 END)::REAL,
    AVG(sub.user_revenue)::REAL
  FROM (
    SELECT a.user_id,
      SUM(c.spend) as user_spend,
      SUM(c.purchases) as user_purchases,
      SUM(c.purchases * a.product_price) as user_revenue
    FROM campaigns c
    JOIN audits a ON c.audit_id = a.id
    WHERE (p_from IS NULL OR a.created_at >= p_from::TIMESTAMPTZ)
      AND (p_to IS NULL OR a.created_at <= p_to::TIMESTAMPTZ)
      AND (p_product_type IS NULL OR a.product_type = p_product_type)
    GROUP BY a.user_id
  ) sub;
END;
$$;
