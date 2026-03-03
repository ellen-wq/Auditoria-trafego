-- Ajustar tabela tinder_jobs para suporte a deadline
-- Em aberto = status OPEN e (deadline nulo ou deadline >= hoje)
-- Encerrado = status CLOSED ou (deadline preenchido e deadline < hoje)

-- 1. Garantir que a coluna deadline existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tinder_jobs' AND column_name = 'deadline'
  ) THEN
    ALTER TABLE public.tinder_jobs ADD COLUMN deadline DATE DEFAULT NULL;
    RAISE NOTICE 'Coluna deadline adicionada.';
  ELSE
    RAISE NOTICE 'Coluna deadline já existe.';
  END IF;
END $$;

-- 2. Índice para filtrar por deadline (opcional, melhora performance)
CREATE INDEX IF NOT EXISTS idx_tinder_jobs_deadline ON public.tinder_jobs(deadline);
