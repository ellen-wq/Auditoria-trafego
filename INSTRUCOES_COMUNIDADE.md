# Instruções - Implementação da Comunidade

## 📋 Resumo

Foi implementada uma funcionalidade completa de comunidade estilo rede social, incluindo:
- Feed de posts com filtro por tema
- Sistema de curtidas, salvamentos e comentários
- Trending posts (top 5 por score)
- Upload de mídia (preparado para Supabase Storage)
- Infinite scroll
- Optimistic updates

## 🗄️ Banco de Dados

### 1. Executar Scripts SQL

Execute os seguintes scripts no Supabase SQL Editor, **nesta ordem**:

1. **`create-comunidade-tables.sql`**
   - Cria todas as tabelas necessárias
   - Cria índices
   - Insere temas padrão

2. **`create-comunidade-rls.sql`**
   - Aplica políticas RLS (Row Level Security)
   - Define permissões de acesso

### 2. Criar Bucket no Supabase Storage

1. Acesse o Supabase Dashboard
2. Vá em **Storage**
3. Crie um bucket chamado: `comunidade-media`
4. Configure as políticas de acesso conforme necessário

## 📦 Dependências

### Backend
- Já possui `multer` para upload de arquivos (não implementado ainda)

### Frontend
- `@tanstack/react-query` - Adicionado ao `package.json`
- Execute: `cd client && npm install`

## 🚀 Funcionalidades Implementadas

### Backend (`src/routes/tinder.ts`)

- `GET /api/tinder-do-fluxo/comunidade/temas` - Lista temas
- `GET /api/tinder-do-fluxo/comunidade/posts` - Feed com paginação e filtro
- `GET /api/tinder-do-fluxo/comunidade/trending` - Top 5 posts por score
- `POST /api/tinder-do-fluxo/comunidade/posts` - Criar post
- `POST /api/tinder-do-fluxo/comunidade/posts/:id/like` - Curtir/descurtir
- `POST /api/tinder-do-fluxo/comunidade/posts/:id/save` - Salvar/remover
- `GET /api/tinder-do-fluxo/comunidade/posts/:id/comentarios` - Listar comentários
- `POST /api/tinder-do-fluxo/comunidade/posts/:id/comentarios` - Criar comentário

### Frontend

#### Componentes (`client/src/components/comunidade/`)
- `TemaSidebar.tsx` - Sidebar com lista de temas
- `FeedHeader.tsx` - Header com botão "Nova publicação" e ordenação
- `PostCard.tsx` - Card de post com ações
- `PostActions.tsx` - Botões de curtir, comentar, salvar
- `ComentariosDrawer.tsx` - Drawer de comentários
- `TrendingPosts.tsx` - Sidebar com posts trending
- `CreatePostForm.tsx` - Formulário de criação de post

#### Hooks (`client/src/hooks/useComunidade.ts`)
- `useTemas()` - Buscar temas
- `useFeed(temaId, page)` - Feed com infinite scroll
- `useTrending()` - Posts trending
- `useCreatePost()` - Criar post
- `useLikePost()` - Curtir post (optimistic update)
- `useSavePost()` - Salvar post (optimistic update)
- `useComentarios(postId)` - Buscar comentários
- `useCreateComentario()` - Criar comentário

#### Páginas
- `/tinder-do-fluxo/comunidade` - Feed principal
- `/tinder-do-fluxo/comunidade/nova-publicacao` - Criar post

## 📊 Score Trending

O score é calculado como:
```
score = (curtidas × 1) + (comentários × 2) + (salvamentos × 3)
```

Os top 5 posts por score aparecem na sidebar "Trending".

## ⚠️ Pendências

1. **Upload de Mídia**
   - O formulário já está preparado para receber arquivos
   - Backend precisa implementar upload para Supabase Storage
   - Salvar URLs em `post_media`

2. **Ordenação Trending**
   - Atualmente o feed sempre ordena por `created_at DESC`
   - A opção "Trending" no select ainda não está implementada

3. **RLS para Storage**
   - Configurar políticas de acesso ao bucket `comunidade-media`

## 🧪 Testes

1. Execute os scripts SQL
2. Instale as dependências: `cd client && npm install`
3. Reinicie o servidor
4. Acesse `/tinder-do-fluxo/comunidade`
5. Teste criar um post, curtir, comentar e salvar

## 📝 Notas

- Os perfis de mentorados não são mostrados (apenas `autor_nome`)
- LIDERANCA pode gerenciar temas (criar, editar, deletar)
- Todos os usuários autenticados podem criar posts, comentar, curtir e salvar
- O sistema usa optimistic updates para melhor UX
