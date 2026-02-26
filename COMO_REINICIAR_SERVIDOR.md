# 🔄 Como Reiniciar o Servidor e Verificar Logs

## 1. Parar o Servidor Atual

Se o servidor está rodando, você precisa pará-lo primeiro:

### Opção A: No terminal onde está rodando
- Pressione `Ctrl + C` (ou `Cmd + C` no Mac)

### Opção B: Matar o processo pela porta
```bash
lsof -ti:3000 | xargs kill -9
```

## 2. Reiniciar o Servidor

No terminal, execute:
```bash
npm run dev
```

Ou se preferir rodar em background:
```bash
npm run dev &
```

## 3. Verificar os Logs

Os logs aparecerão diretamente no terminal onde você executou `npm run dev`.

### Logs que você deve ver:

#### Quando o servidor inicia:
```
[initDb] Verificando existência das tabelas...
✅ Supabase conectado e seed executado.
Fluxer Auditoria rodando em http://localhost:3000
```

#### Quando acessar páginas que listam usuários:
```
[Feed Comunidade] Iniciando busca...
[Feed Comunidade] Query resultado: { dataCount: X, error: ... }
[Feed Comunidade] Retornando X usuários

[Feed Expert] Iniciando busca...
[Feed Expert] Query resultado: { dataCount: X, error: ... }
[Feed Expert] Retornando X usuários (filtrados de Y)

[Services] Iniciando busca de prestadores...
[Services] Query resultado: { dataCount: X, error: ... }
[Services] Retornando X prestadores

[Admin Users] Iniciando busca de usuários...
[Admin Users] Teste de query simples: { dataCount: X, error: ... }
[Admin Users] Query completa: { dataCount: X, error: ... }
```

## 4. O que Procurar nos Logs

### ✅ Logs Normais (Tudo OK):
- `dataCount: X` onde X > 0
- `error: null` ou sem campo `error`
- `Retornando X usuários/prestadores`

### ❌ Logs com Erro:
- `error: { code: '...', message: '...' }`
- `errorCode: '42501'` ou `'42P01'` (problemas de RLS)
- `dataCount: 0` quando deveria ter dados

## 5. Exemplos de Erros Comuns

### Erro de RLS:
```
errorCode: '42501'
errorMessage: 'permission denied for table user_roles'
```
**Solução:** Execute `fix-all-rls-policies.sql` no Supabase

### Erro de Tabela Não Encontrada:
```
errorCode: '42P01'
errorMessage: 'relation "public.users" does not exist'
```
**Solução:** Tabela foi migrada para `user_roles`, verifique o código

### Erro de Tipo:
```
errorCode: '42883'
errorMessage: 'operator does not exist: uuid = integer'
```
**Solução:** Coluna ainda está como INTEGER, precisa migrar para UUID

## 6. Salvar Logs em Arquivo (Opcional)

Se quiser salvar os logs em um arquivo:
```bash
npm run dev > server.log 2>&1
```

Depois, veja os logs com:
```bash
tail -f server.log
```

## 7. Ver Logs da Vercel (Produção)

Se estiver em produção na Vercel:
1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto
3. Vá em "Deployments"
4. Clique no deployment mais recente
5. Vá em "Functions" → "View Function Logs"

## 📝 Dica

Mantenha o terminal do servidor visível enquanto testa a aplicação. Assim você vê os logs em tempo real quando acessar as páginas.
