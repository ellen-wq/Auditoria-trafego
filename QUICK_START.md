# ⚡ Quick Start: Criar Tabelas via Terminal

## Passo 1: Obter Connection String do Supabase

1. Acesse: **https://supabase.com/dashboard**
2. Selecione seu projeto
3. Vá em **Settings** > **Database**
4. Role até **"Connection string"**
5. Selecione **"URI"** (não "Session mode")
6. Clique em **"Copy"**

A connection string terá este formato:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

## Passo 2: Adicionar no .env

Abra o arquivo `.env` na raiz do projeto e adicione:

```bash
SUPABASE_DB_URL="postgresql://postgres:SUA_SENHA@db.xxxxx.supabase.co:5432/postgres"
```

**⚠️ IMPORTANTE:** Substitua:
- `SUA_SENHA` pela senha do banco de dados (não é a senha da sua conta Supabase!)
- `db.xxxxx.supabase.co` pelo host correto do seu projeto

## Passo 3: Executar o Script

```bash
npm run create-tables
```

## ✅ Pronto!

Se tudo der certo, você verá:
```
✅ Tabelas criadas!
✅ tinder_mentor_profiles      | 0 registros
✅ tinder_expert_profiles       | 0 registros
✅ tinder_service_profiles      | 0 registros
```

## 🆘 Problemas?

**"password authentication failed"**
- Verifique se a senha está correta
- A senha pode ser resetada em Settings > Database > Reset database password

**"Connection string não encontrada"**
- Verifique se adicionou `SUPABASE_DB_URL` no `.env`
- Certifique-se de que o arquivo `.env` está na raiz do projeto

**"ENOTFOUND" ou "ECONNREFUSED"**
- Verifique se o host está correto
- Verifique sua conexão com a internet
