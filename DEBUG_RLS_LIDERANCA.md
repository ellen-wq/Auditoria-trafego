# 🔍 Debug: LIDERANCA não consegue ver dados

## ⚠️ Importante

O backend usa `SUPABASE_SERVICE_ROLE_KEY` que **deve bypassar RLS automaticamente**. Se você não consegue ver dados, o problema pode ser:

1. **Erro nas queries** (não relacionado a RLS)
2. **Problema na função `is_leadership()`**
3. **Políticas RLS muito restritivas** (improvável com SERVICE_ROLE_KEY)

## 🔧 Passos para Debug

### 1. Verificar logs do servidor

Quando acessar o dashboard, verifique os logs do servidor. Você deve ver:
- `[Admin Dashboard] Erro mentorProfiles: ...` (se houver erro)
- `[Admin Summary] Erro ao buscar user_roles: ...` (se houver erro)

### 2. Executar script de verificação

Execute `verify-rls-leadership.sql` no Supabase SQL Editor para verificar:
- Se a função `is_leadership()` existe
- Se as políticas estão aplicadas
- Se RLS está habilitado

### 3. Executar script de correção

Execute `fix-rls-leadership-access.sql` no Supabase SQL Editor para garantir que:
- LIDERANCA tem acesso total a todas as tabelas
- A função `is_leadership()` está funcionando corretamente

### 4. Verificar SERVICE_ROLE_KEY

Confirme que o `.env` tem:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

O `SERVICE_ROLE_KEY` **deve bypassar RLS completamente**. Se ainda está bloqueando, pode ser:
- Chave incorreta
- Problema na configuração do Supabase

### 5. Testar diretamente no Supabase

No Supabase SQL Editor, teste:
```sql
-- Verificar se consegue ver dados como service role
SELECT COUNT(*) FROM tinder_mentor_profiles;
SELECT COUNT(*) FROM tinder_jobs;
SELECT COUNT(*) FROM user_roles;
```

Se funcionar no SQL Editor, o problema não é RLS.

## 📋 Permissões por Role

### LIDERANCA
- ✅ **Acesso total** a todas as tabelas (CRUD completo)
- ✅ Pode ver todos os usuários, vagas, matches, reviews, logs
- ✅ Backend usa SERVICE_ROLE_KEY que bypassa RLS

### MENTORADO
- ✅ Pode ver/editar próprio perfil (mentor e expert)
- ✅ Pode ver outros mentorados/experts no feed
- ✅ Pode criar vagas
- ✅ Pode ver matches e favorites próprios
- ✅ Pode criar reviews de prestadores
- ✅ Pode criar aplicações para vagas

### PRESTADOR
- ✅ Pode ver/editar próprio perfil de prestador
- ✅ Pode ver reviews do próprio perfil
- ✅ Pode ver vagas abertas
- ✅ Pode criar aplicações para vagas
- ✅ Pode ver matches e favorites próprios

## 🚨 Se ainda não funcionar

1. **Verifique os logs do servidor** - devem mostrar erros específicos
2. **Teste no Supabase SQL Editor** - se funcionar lá, não é RLS
3. **Verifique se SERVICE_ROLE_KEY está correto** no `.env`
4. **Execute `fix-rls-leadership-access.sql`** para garantir políticas corretas
