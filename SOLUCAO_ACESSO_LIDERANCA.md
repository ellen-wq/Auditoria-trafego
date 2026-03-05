# 🔧 Solução: LIDERANCA não consegue ver dados

## ⚠️ Importante

O backend usa `SUPABASE_SERVICE_ROLE_KEY` que **deve bypassar RLS automaticamente**. Se você não consegue ver dados, siga estes passos:

## 📋 Passos para Resolver

### 1. Verificar logs do servidor

Reinicie o servidor e acesse o dashboard. Verifique os logs do terminal. Você deve ver erros específicos como:
```
[Admin Dashboard] Erro mentorProfiles: ...
[Admin Summary] Erro ao buscar user_roles: ...
```

### 2. Executar script de correção

Execute `fix-rls-leadership-access.sql` no Supabase SQL Editor:

1. Acesse: https://supabase.com/dashboard
2. Vá em SQL Editor
3. Cole o conteúdo de `fix-rls-leadership-access.sql`
4. Execute (Ctrl+Enter)

Este script garante que:
- LIDERANCA tem acesso total a todas as tabelas
- A função `is_leadership()` está funcionando corretamente
- Todas as políticas permitem LIDERANCA ver tudo

### 3. Verificar SERVICE_ROLE_KEY

Confirme que o `.env` tem a chave correta:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**O SERVICE_ROLE_KEY deve bypassar RLS completamente.** Se ainda está bloqueando, pode ser:
- Chave incorreta ou expirada
- Problema na configuração do Supabase

### 4. Testar diretamente

No Supabase SQL Editor, teste se consegue ver dados:
```sql
SELECT COUNT(*) FROM tinder_mentor_profiles;
SELECT COUNT(*) FROM tinder_jobs;
SELECT COUNT(*) FROM user_roles;
```

Se funcionar no SQL Editor, o problema **não é RLS**.

## 🔍 Debug

### Verificar erros no console do navegador

1. Abra o DevTools (F12)
2. Vá em Console
3. Acesse o dashboard
4. Veja se há erros nas requisições

### Verificar Network tab

1. Abra o DevTools (F12)
2. Vá em Network
3. Acesse o dashboard
4. Veja as requisições para `/api/admin/*`
5. Clique em cada uma e veja a resposta

## 📊 Permissões Esperadas

### LIDERANCA
- ✅ **Acesso total** a todas as tabelas (CRUD completo)
- ✅ Pode ver todos os usuários, vagas, conexões, reviews, logs
- ✅ Backend usa SERVICE_ROLE_KEY que bypassa RLS

### MENTORADO
- ✅ Pode ver/editar próprio perfil
- ✅ Pode ver outros mentorados/experts no feed
- ✅ Pode criar vagas
- ✅ Pode ver conexões e favorites próprios

### PRESTADOR
- ✅ Pode ver/editar próprio perfil de prestador
- ✅ Pode ver reviews do próprio perfil
- ✅ Pode ver vagas abertas
- ✅ Pode criar aplicações para vagas

## 🚨 Se ainda não funcionar

1. **Verifique os logs do servidor** - devem mostrar erros específicos
2. **Teste no Supabase SQL Editor** - se funcionar lá, não é RLS
3. **Verifique se SERVICE_ROLE_KEY está correto** no `.env`
4. **Execute `fix-rls-leadership-access.sql`** novamente
