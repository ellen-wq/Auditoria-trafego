/**
 * Script para criar tabelas do Tinder do Fluxo no Supabase
 * Execute: npx ts-node scripts/create-tables.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createTables(): Promise<void> {
  console.log('🚀 Iniciando criação das tabelas do Tinder do Fluxo...\n');

  // Ler o arquivo SQL
  const sqlPath = path.join(__dirname, '..', 'create-tinder-tables.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

  // Dividir em comandos individuais (removendo comentários e queries de verificação)
  const createStatements = [
    `CREATE TABLE IF NOT EXISTS tinder_mentor_profiles (
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
    );`,
    `CREATE TABLE IF NOT EXISTS tinder_expert_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      is_expert BOOLEAN DEFAULT FALSE,
      is_coproducer BOOLEAN DEFAULT FALSE,
      goal_text TEXT DEFAULT '',
      search_bio TEXT DEFAULT '',
      preferences_json JSONB DEFAULT '{}'::JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS tinder_service_profiles (
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
    );`
  ];

  const results: any[] = [];

  for (const sql of createStatements) {
    try {
      // O Supabase não permite execução direta de DDL via client
      // Vamos verificar se a tabela existe tentando fazer uma query
      const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
      if (!tableName) continue;

      console.log(`📋 Verificando tabela: ${tableName}...`);

      const { error: checkError } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);

      if (checkError && (checkError.message?.includes('does not exist') || checkError.code === '42P01')) {
        console.log(`   ⚠️  Tabela ${tableName} não existe.`);
        console.log(`   💡 Para criar, execute o SQL no Supabase Dashboard:`);
        console.log(`   ${sql.substring(0, 100)}...\n`);
        results.push({ table: tableName, status: 'missing', needsManualCreation: true });
      } else {
        console.log(`   ✅ Tabela ${tableName} já existe.\n`);
        results.push({ table: tableName, status: 'exists' });
      }
    } catch (err: any) {
      console.error(`   ❌ Erro ao verificar ${tableName}:`, err.message);
      results.push({ table: tableName, status: 'error', error: err.message });
    }
  }

  console.log('\n📊 Resumo:');
  results.forEach(r => {
    if (r.status === 'exists') {
      console.log(`   ✅ ${r.table}: Existe`);
    } else if (r.status === 'missing') {
      console.log(`   ⚠️  ${r.table}: Não existe - precisa criar manualmente`);
    } else {
      console.log(`   ❌ ${r.table}: Erro - ${r.error}`);
    }
  });

  const missing = results.filter(r => r.status === 'missing');
  if (missing.length > 0) {
    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('1. Acesse: https://supabase.com/dashboard');
    console.log('2. Selecione seu projeto');
    console.log('3. Vá em "SQL Editor" > "New query"');
    console.log('4. Copie e cole o conteúdo do arquivo: create-tinder-tables.sql');
    console.log('5. Clique em "Run" (ou Ctrl+Enter / Cmd+Enter)');
    console.log('\n💡 Arquivo SQL: create-tinder-tables.sql na raiz do projeto\n');
  } else {
    console.log('\n✅ Todas as tabelas existem! Você pode usar o sistema normalmente.\n');
  }
}

createTables().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
