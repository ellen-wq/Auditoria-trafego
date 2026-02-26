# 🔧 Instruções: Corrigir Políticas RLS Duplicadas

## ⚠️ Problema Identificado

Você tem **políticas RLS duplicadas**, especialmente em `user_roles` que tem **7 políticas** quando deveria ter apenas **3**.

## ✅ Solução

Execute o script `fix-all-rls-policies.sql` no Supabase SQL Editor:

### Passo a Passo

1. **Acesse o Supabase Dashboard**
   - https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - Menu lateral → SQL Editor

3. **Execute o script**
   - Abra o arquivo `fix-all-rls-policies.sql`
   - Cole todo o conteúdo no SQL Editor
   - Clique em "Run" ou pressione `Ctrl+Enter` (Windows/Linux) ou `Cmd+Enter` (Mac)

4. **Verifique o resultado**
   - O script mostrará uma tabela no final com o número de políticas por tabela
   - `user_roles` deve ter **3 políticas** (não 7)
   - Cada tabela deve ter o número correto de políticas

## 📊 Número Esperado de Políticas

| Tabela | Políticas Esperadas |
|--------|---------------------|
| `user_roles` | **3** (SELECT, UPDATE, INSERT) |
| `tinder_mentor_profiles` | **4** (SELECT, UPDATE, DELETE, INSERT) |
| `tinder_expert_profiles` | **4** (SELECT, UPDATE, DELETE, INSERT) |
| `tinder_service_profiles` | **4** (SELECT, UPDATE, DELETE, INSERT) |
| `tinder_jobs` | **4** (SELECT, UPDATE, DELETE, INSERT) |
| `tinder_matches` | **4** (SELECT, INSERT, UPDATE, DELETE) |
| `tinder_favorites` | **3** (SELECT, INSERT, DELETE) |
| `tinder_reviews` | **4** (SELECT, INSERT, UPDATE, DELETE) |
| `tinder_applications` | **4** (SELECT, INSERT, UPDATE, DELETE) |
| `tinder_interests` | **3** (SELECT, INSERT, DELETE) |
| `tinder_do_fluxo_logs` | **2** (SELECT, INSERT) |

## 🔍 O que o Script Faz

1. **Atualiza a função `is_leadership()`** para ser mais robusta
2. **Remove TODAS as políticas duplicadas** de cada tabela
3. **Recria apenas as políticas corretas** que permitem:
   - LIDERANCA ver tudo (acesso total)
   - Usuários verem seus próprios dados
   - Regras específicas por role (MENTORADO, PRESTADOR)

## ⚠️ Importante

- O backend usa `SUPABASE_SERVICE_ROLE_KEY` que **bypassa RLS automaticamente**
- As políticas RLS são para proteção caso alguém acesse diretamente via Supabase Client
- **LIDERANCA deve ter acesso total** a todas as tabelas

## 🚨 Se Ainda Não Funcionar

1. **Verifique os logs do servidor** - devem mostrar erros específicos
2. **Teste no Supabase SQL Editor** - se funcionar lá, não é RLS
3. **Verifique se SERVICE_ROLE_KEY está correto** no `.env`
4. **Execute o script novamente** se necessário
