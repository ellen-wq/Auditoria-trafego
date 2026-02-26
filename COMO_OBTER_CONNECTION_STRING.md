# 🔑 Como Obter a Connection String do Supabase

## Método 1: Via Dashboard (Mais Fácil)

1. **Acesse o Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Faça login e selecione seu projeto

2. **Vá em Settings:**
   - Menu lateral > **Settings** > **Database**

3. **Copie a Connection String:**
   - Role até encontrar **"Connection string"**
   - Selecione **"URI"** (não "Session mode")
   - Clique em **"Copy"** ao lado da connection string
   - Ela terá o formato: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

4. **Adicione no .env:**
   ```bash
   SUPABASE_DB_URL="postgresql://postgres:SUA_SENHA@db.xxxxx.supabase.co:5432/postgres"
   ```

## Método 2: Construir Manualmente

Se preferir usar variáveis separadas:

1. No Dashboard > Settings > Database, você verá:
   - **Host:** `db.xxxxx.supabase.co`
   - **Database name:** `postgres`
   - **Port:** `5432`
   - **User:** `postgres`
   - **Password:** (sua senha do banco)

2. Adicione no .env:
   ```bash
   SUPABASE_DB_HOST=db.xxxxx.supabase.co
   SUPABASE_DB_PORT=5432
   SUPABASE_DB_NAME=postgres
   SUPABASE_DB_USER=postgres
   SUPABASE_DB_PASSWORD=sua_senha_aqui
   ```

## ⚠️ Importante

- A senha é diferente da senha da sua conta Supabase
- Se você não souber a senha, pode resetá-la em Settings > Database > Reset database password
- Mantenha a connection string segura (não commite no Git!)

## 🚀 Depois de Configurar

Execute um dos scripts:

```bash
# Opção 1: Via Node.js (recomendado)
npx ts-node scripts/create-tables-node.ts

# Opção 2: Via psql (se tiver PostgreSQL instalado)
bash scripts/create-tables-psql.sh
```
