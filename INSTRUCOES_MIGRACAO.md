# Instruções para Migração UUID

## ⚠️ Erro Encontrado

O erro `violates foreign key constraint` ocorre porque o script estava tentando converter INTEGER para UUID usando `gen_random_uuid()`, gerando UUIDs aleatórios que não existem em `auth.users`.

## Soluções Disponíveis

### Opção 1: Recriar Tabelas (Recomendado se não há dados importantes)

Se você **NÃO tem dados importantes** nas tabelas do Tinder, use:

```sql
-- Execute no Supabase SQL Editor:
-- recreate-tables-with-uuid.sql
```

Este script:
- ✅ Dropa as tabelas existentes
- ✅ Recria com UUID desde o início
- ✅ Configura foreign keys corretamente

### Opção 2: Verificar Dados Primeiro

Execute primeiro para ver o que você tem:

```sql
-- Execute no Supabase SQL Editor:
-- check-data-before-migration.sql
```

### Opção 3: Migrar Dados Existentes

Se você **TEM dados importantes**, precisa:

1. Criar usuários no `auth.users` para cada registro em `users`
2. Mapear IDs antigos (INTEGER) para novos UUIDs
3. Atualizar todas as referências

Use o template:
```sql
-- migrate-existing-data.sql (template - precisa ser adaptado)
```

## Script Atualizado

O arquivo `update-tables-to-uuid.sql` foi atualizado para:
- ✅ Verificar se há dados antes de tentar converter
- ✅ Dropar e recriar tabelas se estiverem vazias
- ✅ Dar erro claro se houver dados

## Recomendação

**Se você está começando do zero ou não tem dados importantes:**

1. Execute `recreate-tables-with-uuid.sql` no Supabase Dashboard
2. Teste criando um novo usuário e perfil

**Se você tem dados importantes:**

1. Execute `check-data-before-migration.sql` para ver o que tem
2. Crie um script de migração customizado baseado em `migrate-existing-data.sql`
3. Ou entre em contato para ajuda com a migração de dados
