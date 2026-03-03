-- ============================================
-- CORRIGIR STATUS E ESTRUTURA DAS VAGAS
-- ============================================
-- Execute no SQL Editor do Supabase
-- Garante: status = OPEN ou CLOSED (binário), deadline correto, vagas nas abas certas

-- 1. Garantir coluna status existe (OPEN ou CLOSED)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tinder_jobs' AND column_name='status') THEN
    ALTER TABLE public.tinder_jobs ADD COLUMN status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED'));
  END IF;
END $$;

-- 2. Garantir coluna deadline existe
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tinder_jobs' AND column_name='deadline') THEN
    ALTER TABLE public.tinder_jobs ADD COLUMN deadline DATE DEFAULT NULL;
  END IF;
END $$;

-- 3. Normalizar status: apenas OPEN ou CLOSED (uppercase)
UPDATE public.tinder_jobs 
SET status = UPPER(TRIM(COALESCE(status, 'OPEN')))
WHERE status IS NULL OR status != UPPER(TRIM(status));

-- 4. Garantir que status inválidos viram OPEN
UPDATE public.tinder_jobs 
SET status = 'OPEN' 
WHERE status NOT IN ('OPEN', 'CLOSED');

-- 5. Marcar como CLOSED vagas com deadline passado (aparecem na aba Encerrado)
-- Funciona com deadline como DATE ou TEXT
UPDATE public.tinder_jobs 
SET status = 'CLOSED'
WHERE status = 'OPEN' 
  AND deadline IS NOT NULL 
  AND (deadline::text)::date < CURRENT_DATE;

-- 6. Verificar resultado
SELECT 
  status,
  COUNT(*) as total
FROM public.tinder_jobs
GROUP BY status
ORDER BY status;
