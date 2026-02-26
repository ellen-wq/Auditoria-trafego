# 🚀 PASSO A PASSO: Criar Tabelas no Supabase

## ⚡ Método Rápido (5 minutos)

### Passo 1: Acesse o Supabase Dashboard
1. Abra: https://supabase.com/dashboard
2. Faça login (se ainda não estiver logado)
3. Selecione o projeto correto

### Passo 2: Abra o SQL Editor
1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique no botão **"New query"** (canto superior direito)

### Passo 3: Cole o SQL
1. Abra o arquivo `create-tinder-tables.sql` que está na raiz do projeto
2. **Selecione TODO o conteúdo** (Ctrl+A / Cmd+A)
3. **Copie** (Ctrl+C / Cmd+C)
4. **Cole** no SQL Editor do Supabase (Ctrl+V / Cmd+V)

### Passo 4: Execute
1. Clique no botão **"Run"** (ou pressione **Ctrl+Enter** / **Cmd+Enter**)
2. Aguarde alguns segundos
3. Você deve ver uma mensagem de sucesso e uma tabela com 3 linhas mostrando que as tabelas foram criadas

### Passo 5: Verifique
Você deve ver algo assim no resultado:
```
tabela                      | registros
----------------------------|----------
tinder_mentor_profiles      | 0
tinder_expert_profiles      | 0
tinder_service_profiles     | 0
```

## ✅ Pronto!

Agora você pode:
- Salvar perfis na aplicação
- Os dados serão persistidos no Supabase
- O erro "table does not exist" não aparecerá mais

## 📋 SQL Completo (caso precise copiar manualmente)

```sql
-- Tabela de perfis de mentorado
CREATE TABLE IF NOT EXISTS tinder_mentor_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  photo_url TEXT DEFAULT '',
  city TEXT DEFAULT '',
  instagram TEXT DEFAULT '',
  niche TEXT DEFAULT '',
  nivel_fluxo TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de perfis de expert/coprodutor
CREATE TABLE IF NOT EXISTS tinder_expert_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  is_expert BOOLEAN DEFAULT FALSE,
  is_coproducer BOOLEAN DEFAULT FALSE,
  goal_text TEXT DEFAULT '',
  search_bio TEXT DEFAULT '',
  preferences_json JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de perfis de prestadores
CREATE TABLE IF NOT EXISTS tinder_service_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  photo_url TEXT DEFAULT '',
  city TEXT DEFAULT '',
  instagram TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  specialty TEXT DEFAULT '',
  certification TEXT DEFAULT '',
  portfolio TEXT DEFAULT '',
  experience TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  rating_avg REAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verificar se as tabelas foram criadas
SELECT 
  'tinder_mentor_profiles' as tabela,
  COUNT(*) as registros
FROM tinder_mentor_profiles
UNION ALL
SELECT 
  'tinder_expert_profiles' as tabela,
  COUNT(*) as registros
FROM tinder_expert_profiles
UNION ALL
SELECT 
  'tinder_service_profiles' as tabela,
  COUNT(*) as registros
FROM tinder_service_profiles;
```

## 🆘 Problemas?

**Erro: "relation already exists"**
- ✅ As tabelas já foram criadas! Pode usar normalmente.

**Erro: "permission denied"**
- Verifique se você tem permissões de administrador no projeto

**Erro: "users table does not exist"**
- A tabela `users` precisa existir primeiro. Execute a migration completa do projeto.
