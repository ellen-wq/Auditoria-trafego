# Debug de Autenticação

## Problema
Após cadastro, a página `/app/upload` trava e não é possível clicar em nada.

## Correções Aplicadas

### 1. ✅ Tipo User atualizado
- `client/src/services/api.ts`: `id: number` → `id: string` (UUID)

### 2. ✅ Logs adicionados no middleware
- Logs detalhados em `requireAuth` para debug
- Tratamento de erros melhorado

### 3. ✅ ProtectedRoute melhorado
- Timeout de 5 segundos
- Melhor tratamento de erros
- Loading spinner visível

## Como Debugar

### 1. Verificar logs do servidor
Quando acessar `/app/upload`, verifique os logs do servidor. Você deve ver:
```
[requireAuth] Verificando usuário: { id: '...', email: '...' }
[requireAuth] Usuário autenticado: { id: '...', email: '...', role: '...' }
```

### 2. Verificar console do navegador
Abra o DevTools (F12) e verifique:
- Se há erros no console
- Se a requisição `/api/auth/me` está sendo feita
- Qual é a resposta da requisição

### 3. Verificar se o usuário existe em user_roles
Execute no Supabase SQL Editor:
```sql
SELECT * FROM user_roles;
```

### 4. Verificar se o token está sendo enviado
No console do navegador:
```javascript
localStorage.getItem('token')
localStorage.getItem('user')
```

## Possíveis Causas

1. **Usuário não existe em `user_roles`**
   - Solução: Verificar se o registro criou o registro em `user_roles`

2. **Token inválido ou expirado**
   - Solução: Fazer logout e login novamente

3. **Erro no middleware `requireAuth`**
   - Solução: Verificar logs do servidor

4. **Problema com RLS (Row Level Security)**
   - Solução: Executar `fix-rls-recursion.sql`

## Próximos Passos

1. Reiniciar o servidor
2. Limpar localStorage do navegador
3. Fazer login novamente
4. Verificar logs do servidor e console do navegador
