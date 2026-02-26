# 🔒 Instruções para Aplicar Políticas RLS

## ⚠️ IMPORTANTE: Execute na ordem correta!

### Passo 1: Criar tabelas faltantes
Execute primeiro o script `create-missing-tables-uuid.sql` no Supabase SQL Editor:

1. Acesse: https://supabase.com/dashboard
2. Vá em SQL Editor
3. Cole o conteúdo de `create-missing-tables-uuid.sql`
4. Execute (Ctrl+Enter)

Este script cria as tabelas que faltam:
- `tinder_matches`
- `tinder_favorites`
- `tinder_reviews`
- `tinder_applications`
- `tinder_interests`

### Passo 2: Aplicar políticas RLS
Depois, execute o script `rls-policies-complete.sql`:

1. No mesmo SQL Editor
2. Cole o conteúdo de `rls-policies-complete.sql`
3. Execute (Ctrl+Enter)

Este script:
- Cria a função `is_leadership()`
- Habilita RLS em todas as tabelas
- Cria políticas de segurança para cada tabela
- Verifica se as tabelas existem antes de aplicar políticas

## ✅ Verificação

Após executar ambos os scripts, você deve ver:
- Uma tabela no final mostrando todas as tabelas com `rls_enabled = true`
- Nenhum erro no console

## 🔍 Se der erro

Se ainda der erro sobre tabela não existir:
1. Verifique se executou `create-missing-tables-uuid.sql` primeiro
2. Verifique se a tabela foi criada:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'tinder_%';
   ```
