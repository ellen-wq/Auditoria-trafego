#!/bin/bash

# Script para criar tabelas do Tinder do Fluxo via psql
# Execute: bash scripts/create-tables-psql.sh

echo "🚀 Criando tabelas do Tinder do Fluxo no Supabase..."

# Verificar se psql está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ Erro: psql não está instalado."
    echo "📦 Instale o PostgreSQL client:"
    echo "   macOS: brew install postgresql"
    echo "   Linux: sudo apt-get install postgresql-client"
    echo "   Windows: https://www.postgresql.org/download/windows/"
    exit 1
fi

# Carregar variáveis de ambiente
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Verificar se SUPABASE_DB_URL está definida
if [ -z "$SUPABASE_DB_URL" ]; then
    echo ""
    echo "⚠️  SUPABASE_DB_URL não encontrada no .env"
    echo ""
    echo "📝 Para obter a connection string:"
    echo "1. Acesse: https://supabase.com/dashboard"
    echo "2. Selecione seu projeto"
    echo "3. Vá em Settings > Database"
    echo "4. Copie a 'Connection string' (URI mode)"
    echo "5. Adicione no .env como: SUPABASE_DB_URL='postgresql://...'"
    echo ""
    echo "💡 Formato: postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
    echo ""
    read -p "Digite a connection string do Supabase (ou pressione Ctrl+C para cancelar): " CONN_STRING
    
    if [ -z "$CONN_STRING" ]; then
        echo "❌ Connection string não fornecida. Cancelando."
        exit 1
    fi
else
    CONN_STRING="$SUPABASE_DB_URL"
fi

echo ""
echo "📋 Executando SQL para criar tabelas..."
echo ""

# Executar o SQL
psql "$CONN_STRING" << EOF

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

EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Tabelas criadas com sucesso!"
    echo ""
else
    echo ""
    echo "❌ Erro ao criar tabelas. Verifique a connection string e permissões."
    echo ""
    exit 1
fi
