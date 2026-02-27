-- ============================================================
-- Script para criar tabelas da Comunidade
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- 1. Tabela temas
CREATE TABLE IF NOT EXISTS public.temas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  permite_postagem BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela posts
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tema_id UUID REFERENCES public.temas(id) ON DELETE SET NULL,
  autor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela post_media
CREATE TABLE IF NOT EXISTS public.post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'image' -- 'image' ou 'video'
);

-- 4. Tabela post_likes
CREATE TABLE IF NOT EXISTS public.post_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, post_id)
);

-- 5. Tabela post_saves
CREATE TABLE IF NOT EXISTS public.post_saves (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, post_id)
);

-- 6. Tabela comentarios
CREATE TABLE IF NOT EXISTS public.comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tema ON public.posts(tema_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_post ON public.comentarios(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_post ON public.post_saves(post_id);
CREATE INDEX IF NOT EXISTS idx_post_media_post ON public.post_media(post_id);

-- ============================================================
-- DADOS INICIAIS - Temas padrão
-- ============================================================

INSERT INTO public.temas (nome, permite_postagem) VALUES
  ('Geral', true),
  ('Tráfego Pago', true),
  ('Copywriting', true),
  ('Automação', true),
  ('Estratégias', true),
  ('Dúvidas', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Verificação
-- ============================================================

SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('temas', 'posts', 'post_media', 'post_likes', 'post_saves', 'comentarios')
ORDER BY table_name, ordinal_position;
