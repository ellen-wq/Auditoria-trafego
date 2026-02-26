# Como Criar as Tabelas do Tinder do Fluxo no Supabase

## Método 1: Via Supabase Dashboard (Recomendado)

1. **Acesse o Supabase Dashboard:**
   - Vá para https://supabase.com/dashboard
   - Faça login na sua conta
   - Selecione o projeto correto

2. **Abra o SQL Editor:**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute o Script:**
   - Abra o arquivo `create-tinder-tables.sql` na raiz do projeto
   - Copie TODO o conteúdo do arquivo
   - Cole no SQL Editor do Supabase
   - Clique em "Run" ou pressione Ctrl+Enter (Cmd+Enter no Mac)

4. **Verifique se funcionou:**
   - Você deve ver uma mensagem de sucesso
   - A query no final do script mostra quantos registros existem em cada tabela (deve ser 0 inicialmente)

## Método 2: Via API (Se você tem acesso de admin)

1. Faça login como usuário com role `LIDERANCA`
2. Acesse: `POST /api/tinder-do-fluxo/admin/create-tables`
3. Isso tentará criar as tabelas automaticamente

## Tabelas que serão criadas:

- `tinder_mentor_profiles` - Perfis de mentorados
- `tinder_expert_profiles` - Perfis de experts/coprodutores  
- `tinder_service_profiles` - Perfis de prestadores de serviço

## Verificação:

Após criar as tabelas, você pode verificar se foram criadas corretamente:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'tinder_%';
```

Isso deve retornar as 3 tabelas listadas acima.

## Problemas?

Se você encontrar erros ao executar o script:

1. Verifique se você tem permissões de administrador no Supabase
2. Verifique se a tabela `users` já existe (as tabelas do Tinder dependem dela)
3. Se houver erro de "relation already exists", as tabelas já foram criadas anteriormente
