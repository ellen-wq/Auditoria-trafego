-- ============================================================
-- Políticas RLS para Comunidade
-- Execute este script no Supabase SQL Editor APÓS criar as tabelas
-- ============================================================

-- ============================================================
-- 1. temas
-- ============================================================

ALTER TABLE public.temas ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos autenticados podem ver temas
DROP POLICY IF EXISTS "Authenticated users can view temas" ON public.temas;
CREATE POLICY "Authenticated users can view temas"
  ON public.temas
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT/UPDATE/DELETE: Apenas LIDERANCA pode modificar temas
DROP POLICY IF EXISTS "Leadership can manage temas" ON public.temas;
CREATE POLICY "Leadership can manage temas"
  ON public.temas
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'LIDERANCA'
    )
  );

-- ============================================================
-- 2. posts
-- ============================================================

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos autenticados podem ver posts
DROP POLICY IF EXISTS "Authenticated users can view posts" ON public.posts;
CREATE POLICY "Authenticated users can view posts"
  ON public.posts
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT: Usuários autenticados podem criar posts
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
CREATE POLICY "Authenticated users can create posts"
  ON public.posts
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = autor_id AND
    (
      -- Verificar se o tema permite postagem
      tema_id IS NULL OR
      EXISTS (
        SELECT 1 FROM public.temas
        WHERE temas.id = tema_id
        AND temas.permite_postagem = true
      )
    )
  );

-- UPDATE: Autor pode editar próprio post, LIDERANCA pode editar qualquer
DROP POLICY IF EXISTS "Users can update own posts or leadership updates all" ON public.posts;
CREATE POLICY "Users can update own posts or leadership updates all"
  ON public.posts
  FOR UPDATE
  USING (
    auth.uid() = autor_id OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'LIDERANCA'
    )
  )
  WITH CHECK (
    auth.uid() = autor_id OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'LIDERANCA'
    )
  );

-- DELETE: Autor pode deletar próprio post, LIDERANCA pode deletar qualquer
DROP POLICY IF EXISTS "Users can delete own posts or leadership deletes all" ON public.posts;
CREATE POLICY "Users can delete own posts or leadership deletes all"
  ON public.posts
  FOR DELETE
  USING (
    auth.uid() = autor_id OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'LIDERANCA'
    )
  );

-- ============================================================
-- 3. post_media
-- ============================================================

ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos autenticados podem ver media
DROP POLICY IF EXISTS "Authenticated users can view post_media" ON public.post_media;
CREATE POLICY "Authenticated users can view post_media"
  ON public.post_media
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT: Usuários autenticados podem criar media para seus posts
DROP POLICY IF EXISTS "Users can create media for own posts" ON public.post_media;
CREATE POLICY "Users can create media for own posts"
  ON public.post_media
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_id
      AND posts.autor_id = auth.uid()
    )
  );

-- DELETE: Autor do post pode deletar media, LIDERANCA pode deletar qualquer
DROP POLICY IF EXISTS "Users can delete media from own posts or leadership deletes all" ON public.post_media;
CREATE POLICY "Users can delete media from own posts or leadership deletes all"
  ON public.post_media
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_id
      AND posts.autor_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'LIDERANCA'
    )
  );

-- ============================================================
-- 4. post_likes
-- ============================================================

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos autenticados podem ver likes
DROP POLICY IF EXISTS "Authenticated users can view post_likes" ON public.post_likes;
CREATE POLICY "Authenticated users can view post_likes"
  ON public.post_likes
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT: Usuários autenticados podem curtir posts
DROP POLICY IF EXISTS "Authenticated users can like posts" ON public.post_likes;
CREATE POLICY "Authenticated users can like posts"
  ON public.post_likes
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- DELETE: Usuários podem remover próprio like
DROP POLICY IF EXISTS "Users can delete own likes" ON public.post_likes;
CREATE POLICY "Users can delete own likes"
  ON public.post_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. post_saves
-- ============================================================

ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;

-- SELECT: Usuários podem ver apenas próprios saves
DROP POLICY IF EXISTS "Users can view own saves" ON public.post_saves;
CREATE POLICY "Users can view own saves"
  ON public.post_saves
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Usuários autenticados podem salvar posts
DROP POLICY IF EXISTS "Authenticated users can save posts" ON public.post_saves;
CREATE POLICY "Authenticated users can save posts"
  ON public.post_saves
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- DELETE: Usuários podem remover próprio save
DROP POLICY IF EXISTS "Users can delete own saves" ON public.post_saves;
CREATE POLICY "Users can delete own saves"
  ON public.post_saves
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 6. comentarios
-- ============================================================

ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos autenticados podem ver comentários
DROP POLICY IF EXISTS "Authenticated users can view comentarios" ON public.comentarios;
CREATE POLICY "Authenticated users can view comentarios"
  ON public.comentarios
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT: Usuários autenticados podem comentar
DROP POLICY IF EXISTS "Authenticated users can create comentarios" ON public.comentarios;
CREATE POLICY "Authenticated users can create comentarios"
  ON public.comentarios
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = autor_id);

-- UPDATE: Autor pode editar próprio comentário, LIDERANCA pode editar qualquer
DROP POLICY IF EXISTS "Users can update own comentarios or leadership updates all" ON public.comentarios;
CREATE POLICY "Users can update own comentarios or leadership updates all"
  ON public.comentarios
  FOR UPDATE
  USING (
    auth.uid() = autor_id OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'LIDERANCA'
    )
  )
  WITH CHECK (
    auth.uid() = autor_id OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'LIDERANCA'
    )
  );

-- DELETE: Autor pode deletar próprio comentário, LIDERANCA pode deletar qualquer
DROP POLICY IF EXISTS "Users can delete own comentarios or leadership deletes all" ON public.comentarios;
CREATE POLICY "Users can delete own comentarios or leadership deletes all"
  ON public.comentarios
  FOR DELETE
  USING (
    auth.uid() = autor_id OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'LIDERANCA'
    )
  );

-- ============================================================
-- Verificação
-- ============================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('temas', 'posts', 'post_media', 'post_likes', 'post_saves', 'comentarios')
ORDER BY tablename, policyname;
