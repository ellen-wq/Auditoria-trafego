# 🔒 Guia de Políticas RLS (Row Level Security)

## 📋 Visão Geral

Este documento explica as políticas de segurança (RLS) aplicadas às tabelas do Supabase, garantindo que cada usuário só acesse os dados que tem permissão.

## 🎯 Níveis de Acesso

### **LIDERANCA**
- ✅ Acesso total a todas as tabelas
- ✅ Pode ver, criar, editar e deletar qualquer registro
- ✅ Único role que pode ver logs do sistema

### **MENTORADO**
- ✅ Pode gerenciar próprio perfil (mentor e expert)
- ✅ Pode ver outros mentorados e experts (feed)
- ✅ Pode criar e ver próprias vagas (jobs)
- ✅ Pode ver conexões e favorites próprios
- ✅ Pode criar reviews de prestadores
- ✅ Pode criar aplicações para vagas
- ✅ Pode gerenciar próprias auditorias, campanhas e criativos

### **PRESTADOR**
- ✅ Pode gerenciar próprio perfil de prestador
- ✅ Pode ver reviews do próprio perfil
- ✅ Pode ver vagas abertas
- ✅ Pode criar aplicações para vagas
- ✅ Pode ver conexões e favorites próprios

## 📊 Políticas por Tabela

### 1. **user_roles**
- **SELECT**: Próprio role ou LIDERANCA vê todos
- **UPDATE**: Próprio perfil (exceto role) ou LIDERANCA atualiza qualquer
- **INSERT**: Apenas via service role (backend)

### 2. **tinder_mentor_profiles**
- **SELECT**: Próprio perfil ou LIDERANCA vê todos
- **INSERT/UPDATE/DELETE**: Próprio perfil ou LIDERANCA gerencia qualquer

### 3. **tinder_expert_profiles**
- **SELECT**: Próprio perfil ou LIDERANCA vê todos
- **INSERT/UPDATE/DELETE**: Próprio perfil ou LIDERANCA gerencia qualquer

### 4. **tinder_service_profiles**
- **SELECT**: Próprio perfil ou LIDERANCA vê todos
- **INSERT/UPDATE/DELETE**: Próprio perfil ou LIDERANCA gerencia qualquer

### 5. **tinder_jobs**
- **SELECT**: Todos podem ver vagas abertas, criador vê próprias, LIDERANCA vê todas
- **INSERT**: MENTORADO e LIDERANCA podem criar
- **UPDATE/DELETE**: Criador ou LIDERANCA

### 6. **tinder_matches**
- **SELECT/INSERT/UPDATE/DELETE**: Usuários envolvidos na conexão ou LIDERANCA

### 7. **tinder_favorites**
- **SELECT/INSERT/DELETE**: Próprios favoritos ou LIDERANCA

### 8. **tinder_reviews**
- **SELECT**: Todos podem ver, PRESTADOR vê reviews do próprio perfil, LIDERANCA vê todos
- **INSERT**: MENTORADO e LIDERANCA podem criar
- **UPDATE/DELETE**: Apenas LIDERANCA

### 9. **tinder_applications**
- **SELECT**: Candidato vê próprias, criador da vaga vê aplicações, LIDERANCA vê todas
- **INSERT**: PRESTADOR, MENTORADO e LIDERANCA podem criar
- **UPDATE/DELETE**: Candidato, criador da vaga ou LIDERANCA

### 10. **audits**
- **SELECT/INSERT/UPDATE/DELETE**: Próprias auditorias ou LIDERANCA

### 11. **campaigns**
- **SELECT/INSERT/UPDATE/DELETE**: Via auditoria própria ou LIDERANCA

### 12. **recommendations**
- **SELECT/INSERT/UPDATE/DELETE**: Via campanha/auditoria própria ou LIDERANCA

### 13. **creatives**
- **SELECT/INSERT/UPDATE/DELETE**: Via auditoria própria ou LIDERANCA

### 14. **tinder_do_fluxo_logs**
- **SELECT**: Apenas LIDERANCA
- **INSERT**: Usuários podem inserir próprios logs (backend controla)

## 🚀 Como Aplicar

1. **Acesse o Supabase Dashboard**
   - https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - Menu lateral → SQL Editor
   - Clique em "New query"

3. **Execute o Script**
   - Abra o arquivo `rls-policies-complete.sql`
   - Copie TODO o conteúdo (Ctrl+A / Cmd+A)
   - Cole no SQL Editor
   - Clique em "Run" (ou Ctrl+Enter / Cmd+Enter)

4. **Verifique**
   - O script mostra uma tabela no final com todas as tabelas e se RLS está habilitado
   - Todas devem mostrar `rls_enabled = true`

## ⚠️ Importante

- **Service Role Key**: O backend usa `SUPABASE_SERVICE_ROLE_KEY`, que **bypassa todas as políticas RLS**. Isso é necessário para operações administrativas.

- **Políticas RLS**: Protegem acesso direto ao banco via Supabase Client (frontend), mas o backend sempre tem acesso total.

- **Função `is_leadership()`**: Função auxiliar que verifica se um usuário é LIDERANCA. Usa `SECURITY DEFINER` para evitar recursão.

## 🔍 Testando as Políticas

### Teste 1: MENTORADO tentando ver perfil de outro MENTORADO
```sql
-- Deve funcionar (pode ver outros mentorados no feed)
SELECT * FROM tinder_mentor_profiles;
```

### Teste 2: MENTORADO tentando editar perfil de outro
```sql
-- Deve falhar (só pode editar próprio)
UPDATE tinder_mentor_profiles SET bio = 'test' WHERE user_id != auth.uid();
```

### Teste 3: LIDERANCA vendo todos os dados
```sql
-- Deve funcionar (LIDERANCA vê tudo)
SELECT * FROM tinder_do_fluxo_logs;
```

## 📝 Notas

- As políticas são aplicadas **automaticamente** quando o Supabase Client é usado
- O backend (usando Service Role) **não é afetado** pelas políticas
- Se precisar ajustar alguma política, edite o script e execute novamente (as políticas antigas serão substituídas)
