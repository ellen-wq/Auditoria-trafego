# Migração para Supabase Auth

Este documento descreve a migração do sistema de autenticação customizado para o Supabase Auth.

## Mudanças Implementadas

### 1. Nova Estrutura de Dados

- **Antes**: Tabela `users` com `id` (SERIAL), `password_hash`, `name`, `email`, `role`
- **Depois**: 
  - `auth.users` (gerenciado pelo Supabase) com `id` (UUID)
  - `public.user_roles` com `user_id` (UUID) referenciando `auth.users.id`

### 2. Tabela `user_roles`

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MENTORADO',
  name TEXT,
  has_seen_tinder_do_fluxo_tutorial BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Tabelas que Precisam ser Atualizadas

Todas as tabelas que referenciam `users.id` precisam ser atualizadas para usar `UUID` ao invés de `INTEGER`:

- `tinder_mentor_profiles.user_id`
- `tinder_expert_profiles.user_id`
- `tinder_service_profiles.user_id`
- `tinder_jobs.creator_id`
- `tinder_matches.user1_id`, `tinder_matches.user2_id`
- `tinder_favorites.user_id`, `tinder_favorites.target_id`
- Outras tabelas que referenciam `users.id`

## Passos para Migração

### Passo 1: Executar Script SQL

Execute o arquivo `migrate-to-supabase-auth.sql` no Supabase Dashboard:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em SQL Editor
4. Cole o conteúdo de `migrate-to-supabase-auth.sql`
5. Execute

### Passo 2: Atualizar Tabelas Relacionadas

Para cada tabela que referencia `users.id`, execute:

```sql
-- Exemplo para tinder_mentor_profiles
ALTER TABLE tinder_mentor_profiles 
  ALTER COLUMN user_id TYPE UUID USING gen_random_uuid();

-- Adicionar foreign key para auth.users
ALTER TABLE tinder_mentor_profiles
  ADD CONSTRAINT tinder_mentor_profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

**⚠️ ATENÇÃO**: Se você já tem dados, precisará criar um script de migração que:
1. Cria usuários no `auth.users` para cada registro em `users`
2. Mapeia os IDs antigos (integer) para os novos (UUID)
3. Atualiza todas as referências

### Passo 3: Migrar Dados Existentes (se houver)

Se você já tem usuários cadastrados, será necessário:

1. Para cada usuário em `users`:
   - Criar conta no `auth.users` usando `supabase.auth.admin.createUser()`
   - Criar registro em `user_roles` com o UUID gerado
   - Atualizar todas as referências de `users.id` (integer) para o novo UUID

2. Script de migração será criado em `scripts/migrate-existing-users.ts`

### Passo 4: Atualizar Código

O código já foi atualizado para:
- ✅ Usar `supabase.auth.signUp()` e `supabase.auth.signInWithPassword()`
- ✅ Criar registros em `user_roles` após registro
- ✅ Buscar roles de `user_roles` ao invés de `users`
- ✅ Usar UUID ao invés de integer para IDs

### Passo 5: Testar

1. Testar registro de novo usuário
2. Testar login
3. Testar todas as funcionalidades que dependem de autenticação

## Variáveis de Ambiente Necessárias

Certifique-se de ter no `.env`:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
```

## Notas Importantes

- O Supabase Auth gerencia senhas automaticamente (não precisa mais de `bcrypt`)
- Tokens JWT customizados ainda são usados para compatibilidade com o frontend
- A tabela `users` antiga pode ser removida após migração completa
- Todas as queries que usam `users.id` precisam ser atualizadas para `user_roles.user_id`

## Próximos Passos

1. Executar `migrate-to-supabase-auth.sql`
2. Atualizar todas as tabelas relacionadas para usar UUID
3. Criar e executar script de migração de dados (se houver dados existentes)
4. Testar todas as funcionalidades
5. Remover tabela `users` antiga (após validação completa)
