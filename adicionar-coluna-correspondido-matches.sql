-- ============================================
-- ADICIONAR COLUNA DE CORRESPONDÊNCIA EM tinder_matches
-- ============================================
-- Este script adiciona uma coluna para indicar se a conexão teve correspondência mútua

-- 1. Adicionar coluna is_mutual (ou correspondido) na tabela tinder_matches
DO $$ 
BEGIN
  -- Verificar se a coluna já existe antes de adicionar
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tinder_matches' AND column_name = 'is_mutual'
  ) THEN
    ALTER TABLE tinder_matches ADD COLUMN is_mutual BOOLEAN DEFAULT TRUE;
    
    -- Como tinder_matches só é criado quando há conexão mútua, todos os registros existentes são mútuos
    UPDATE tinder_matches SET is_mutual = TRUE WHERE is_mutual IS NULL;
    
    -- Adicionar comentário na coluna
    COMMENT ON COLUMN tinder_matches.is_mutual IS 'Indica se a conexão teve correspondência mútua (ambos deram like). TRUE = conexão mútua, FALSE = interesse unilateral';
  END IF;
END $$;

-- 2. Verificar resultado
SELECT 
  id,
  user1_id,
  user2_id,
  type,
  is_mutual,
  created_at
FROM tinder_matches
ORDER BY created_at DESC
LIMIT 10;
