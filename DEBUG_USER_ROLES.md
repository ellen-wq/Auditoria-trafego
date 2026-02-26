# 🔍 Debug: Não consegue ver usuários da tabela user_roles

## ⚠️ Problema

Você não consegue ver os usuários da tabela `user_roles` no Supabase, mesmo sendo LIDERANCA.

## 🔧 Passos para Debug

### 1. Verificar se a tabela tem dados

Execute no Supabase SQL Editor:
```sql
SELECT COUNT(*) as total FROM public.user_roles;
SELECT * FROM public.user_roles LIMIT 10;
```

Se retornar 0 ou vazio, a tabela não tem dados. Execute o seed:
```bash
npm run dev
```
(O seed cria usuários automaticamente)

### 2. Verificar se RLS está bloqueando

Execute `test-user-roles-query.sql` no Supabase SQL Editor para verificar:
- Se RLS está habilitado
- Quais políticas existem
- Se a função `is_leadership()` está funcionando

### 3. Testar desabilitando RLS temporariamente

Execute `disable-rls-temporarily.sql` no Supabase SQL Editor:
- Isso desabilita RLS na tabela `user_roles`
- Teste se consegue ver os dados
- **IMPORTANTE:** Reabilite RLS depois com:
  ```sql
  ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
  ```

### 4. Verificar logs do servidor

Quando acessar `/api/tinder-do-fluxo/admin/users`, verifique os logs do servidor. Você deve ver:
```
[Admin Users] Iniciando busca de usuários...
[Admin Users] Teste de query simples: { dataCount: X, error: ... }
[Admin Users] Query completa: { dataCount: X, error: ... }
```

### 5. Verificar SERVICE_ROLE_KEY

Confirme que o `.env` tem:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

O `SERVICE_ROLE_KEY` **deve bypassar RLS completamente**. Se ainda está bloqueando, pode ser:
- Chave incorreta ou expirada
- Problema na configuração do Supabase

### 6. Verificar no console do navegador

1. Abra o DevTools (F12)
2. Vá em Network
3. Acesse a página que lista usuários
4. Veja a requisição para `/api/tinder-do-fluxo/admin/users`
5. Clique na requisição e veja a resposta

## 🚨 Possíveis Causas

1. **Tabela vazia** - Execute o seed para criar usuários
2. **RLS bloqueando** - Mesmo com SERVICE_ROLE_KEY (improvável, mas possível)
3. **Erro na query** - Verifique os logs do servidor
4. **SERVICE_ROLE_KEY incorreto** - Verifique o `.env`

## ✅ Solução Rápida

Se você quer testar rapidamente se é RLS:

1. Execute `disable-rls-temporarily.sql` no Supabase SQL Editor
2. Teste se consegue ver os dados
3. Se funcionar, o problema é RLS
4. Execute `fix-all-rls-policies.sql` novamente
5. Reabilite RLS com:
   ```sql
   ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
   ```
