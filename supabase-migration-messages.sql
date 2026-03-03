-- ============================================================
-- Tabela de mensagens do Tinder do Fluxo (chat entre matches)
-- Como executar: Supabase Dashboard > SQL Editor > New query >
--   cole este arquivo e execute (Run).
-- ============================================================

-- tinder_messages: mensagens entre dois usuários que deram match
CREATE TABLE IF NOT EXISTS tinder_messages (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES tinder_matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tinder_messages_match_id ON tinder_messages(match_id);
CREATE INDEX IF NOT EXISTS idx_tinder_messages_created_at ON tinder_messages(match_id, created_at DESC);

COMMENT ON TABLE tinder_messages IS 'Mensagens trocadas entre usuários que deram match no Tinder do Fluxo';
