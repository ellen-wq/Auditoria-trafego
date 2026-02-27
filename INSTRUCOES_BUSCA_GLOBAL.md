# 🚀 Instruções - Busca Global e Skeleton Loading

## ✅ Implementação Completa

Todas as melhorias de UX foram implementadas:

### 📦 Componentes Criados

1. **Skeletons**
   - `GlobalSkeleton` - Componente principal
   - `SkeletonFeed` - Para feeds (5 itens)
   - `SkeletonCard` - Para grids (8 cards)
   - `SkeletonList` - Para listas (10 itens)
   - `SkeletonProfile` - Para perfis

2. **Busca**
   - `GlobalSearch` - Barra de busca fixa no topo
   - `useDebounce` - Hook para debounce (400ms)
   - `useGlobalSearch` - Hook para busca global com React Query

3. **Filtros**
   - `StarRatingFilter` - Filtro por avaliação (estrelas)
   - `WorkModeFilter` - Filtro por modo de trabalho
   - `ProximityFilter` - Filtro por proximidade (geolocalização)

4. **Layout**
   - `PageLayout` - Componente padronizado para páginas

### 🔧 Páginas Atualizadas

1. **Comunidade** (`/tinder-do-fluxo/comunidade`)
   - ✅ Busca por tema, autor, título, conteúdo
   - ✅ Skeleton loading
   - ✅ Debounce 400ms

2. **Expert & Coprodutor** (`/tinder-do-fluxo/expert`)
   - ✅ Busca por objetivo, nome
   - ✅ Filtro por tipo de perfil (Expert/Coprodutor)
   - ✅ Skeleton loading

3. **Prestadores** (`/tinder-do-fluxo/prestadores`)
   - ✅ Busca por nome, especialidade
   - ✅ Filtro por tipo de serviço
   - ✅ Filtro por avaliação mínima
   - ✅ Filtro por modo de trabalho
   - ✅ Skeleton loading

4. **Vagas** (`/tinder-do-fluxo/vagas`)
   - ✅ Busca por título, empresa, cidade
   - ✅ Skeleton loading
   - ✅ Filtros existentes mantidos

### 🗄️ Backend Atualizado

Todas as rotas foram atualizadas para suportar busca:

- `GET /api/tinder-do-fluxo/comunidade/posts?q=...`
- `GET /api/tinder-do-fluxo/feed/expert?q=...&tipo_perfil=...`
- `GET /api/tinder-do-fluxo/services?q=...&tipo_servico=...&rating_min=...`
- `GET /api/tinder-do-fluxo/jobs?q=...` (já existia)

## 📊 Índices de Busca (Supabase)

### ⚠️ IMPORTANTE: Execute este script no Supabase SQL Editor

O arquivo `create-search-indexes.sql` contém todos os índices necessários para buscas performáticas.

**Como executar:**

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo de `create-search-indexes.sql`
4. Execute o script

### Índices Criados

- `idx_posts_search_titulo` - Busca em títulos de posts
- `idx_posts_search_conteudo` - Busca em conteúdo de posts
- `idx_posts_search_full` - Busca full-text em posts
- `idx_user_roles_name_search` - Busca em nomes de usuários
- `idx_expert_profiles_goal_search` - Busca em objetivos
- `idx_expert_profiles_bio_search` - Busca em biografias
- `idx_service_profiles_specialty` - Busca em especialidades
- `idx_jobs_search_title` - Busca em títulos de vagas
- `idx_jobs_search_description` - Busca em descrições

### Extensões Necessárias

O script ativa automaticamente:
- `pg_trgm` - Para busca fuzzy (similaridade de texto)

## 🎨 Estilos

A animação `pulse` para skeletons está definida em:
- `client/src/components/skeletons/skeleton.css`

**Importe no seu arquivo principal:**

```tsx
import './components/skeletons/skeleton.css';
```

Ou adicione ao seu CSS global:

```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

## 🧪 Testando

1. **Comunidade:**
   - Acesse `/tinder-do-fluxo/comunidade`
   - Digite na busca: "teste"
   - Verifique skeleton durante carregamento

2. **Expert & Coprodutor:**
   - Acesse `/tinder-do-fluxo/expert`
   - Use busca e filtros
   - Verifique skeleton

3. **Prestadores:**
   - Acesse `/tinder-do-fluxo/prestadores`
   - Teste busca, filtros de avaliação e tipo de serviço
   - Verifique skeleton

4. **Vagas:**
   - Acesse `/tinder-do-fluxo/vagas`
   - Teste busca e filtros existentes
   - Verifique skeleton

## 📝 Próximos Passos (Opcional)

### Adicionar Proximidade (PostGIS)

Se quiser implementar busca por proximidade:

1. Execute no Supabase:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE tinder_service_profiles
ADD COLUMN IF NOT EXISTS location geography(Point,4326);
```

2. Use o componente `ProximityFilter` nas páginas

### Salvar Filtros no localStorage

Os filtros podem ser salvos automaticamente:

```tsx
useEffect(() => {
  localStorage.setItem(`filters_${pageName}`, JSON.stringify(filters));
}, [filters]);
```

## ✅ Checklist

- [x] Componentes de Skeleton criados
- [x] GlobalSearch implementado
- [x] Hooks de busca criados
- [x] Filtros implementados
- [x] Páginas atualizadas
- [x] Backend atualizado
- [x] Script SQL de índices criado
- [ ] **Execute o script SQL no Supabase**
- [ ] **Importe o CSS de skeletons**
- [ ] Teste todas as páginas

## 🐛 Troubleshooting

### Busca não funciona
- Verifique se os índices foram criados no Supabase
- Verifique os logs do backend para erros

### Skeleton não aparece
- Verifique se o CSS foi importado
- Verifique se `isLoading` está sendo passado corretamente

### Filtros não aplicam
- Verifique os logs do backend
- Verifique se os parâmetros estão sendo enviados corretamente
