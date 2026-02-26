# Próximos Passos - Migração Supabase Auth

## ✅ O que já foi feito:

1. ✅ Script `migrate-to-supabase-auth.sql` criado e executado
2. ✅ Tabela `user_roles` criada no Supabase
3. ✅ Código de autenticação atualizado para usar Supabase Auth
4. ✅ Middleware de autenticação atualizado
5. ✅ Tipos TypeScript atualizados para UUID

## ⚠️ O que ainda precisa ser feito:

### 1. Executar script de atualização das tabelas

Execute o arquivo `update-tables-to-uuid.sql` no Supabase Dashboard:

```sql
-- Este script atualiza todas as tabelas relacionadas para usar UUID
-- Execute no SQL Editor do Supabase
```

**⚠️ ATENÇÃO**: Se você já tem dados nas tabelas, este script vai gerar UUIDs aleatórios e perderá a relação com os dados existentes. Nesse caso, você precisa de um script de migração de dados primeiro.

### 2. Atualizar queries no código que ainda usam `users`

As seguintes rotas ainda precisam ser atualizadas:

- `src/routes/tinder.ts`:
  - `/users/:id` (linha ~600) - precisa aceitar UUID ao invés de integer
  - `/admin/users` (linha ~1068) - precisa buscar de `user_roles`
  
- `src/routes/admin.ts`:
  - `/users` (linha ~138) - precisa buscar de `user_roles`
  - `/users/:id/audits` (linha ~181) - precisa buscar de `user_roles`

### 3. Atualizar função `toPositiveInt`

A função `toPositiveInt` no `src/routes/tinder.ts` precisa ser atualizada ou substituída para aceitar UUIDs.

### 4. Testar

Após executar os scripts SQL e atualizar o código:

1. Testar registro de novo usuário
2. Testar login
3. Testar todas as funcionalidades que dependem de autenticação
4. Verificar se os perfis do Tinder estão funcionando

## Scripts SQL para executar:

1. ✅ `migrate-to-supabase-auth.sql` - JÁ EXECUTADO
2. ⏳ `update-tables-to-uuid.sql` - PRECISA SER EXECUTADO

## Notas Importantes:

- Se você tem dados existentes, precisa criar um script de migração que:
  1. Cria usuários no `auth.users` para cada registro em `users`
  2. Mapeia os IDs antigos (integer) para os novos (UUID)
  3. Atualiza todas as referências nas tabelas relacionadas

- A tabela `users` antiga pode ser removida após migração completa e validação
