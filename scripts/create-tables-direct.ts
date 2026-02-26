/**
 * Script para criar tabelas do Tinder do Fluxo no Supabase via API
 * Execute: npx ts-node scripts/create-tables-direct.ts
 * 
 * NOTA: Este script tenta criar as tabelas, mas pode não funcionar se o Supabase
 * não tiver uma função RPC customizada. Se falhar, use o método manual no Dashboard.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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

async function createTablesDirect(): Promise<void> {
  console.log('🚀 Tentando criar tabelas do Tinder do Fluxo via API do Supabase...\n');

  const tables = [
    {
      name: 'tinder_mentor_profiles',
      sql: `CREATE TABLE IF NOT EXISTS tinder_mentor_profiles (
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
      );`
    },
    {
      name: 'tinder_expert_profiles',
      sql: `CREATE TABLE IF NOT EXISTS tinder_expert_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        is_expert BOOLEAN DEFAULT FALSE,
        is_coproducer BOOLEAN DEFAULT FALSE,
        goal_text TEXT DEFAULT '',
        search_bio TEXT DEFAULT '',
        preferences_json JSONB DEFAULT '{}'::JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`
    },
    {
      name: 'tinder_service_profiles',
      sql: `CREATE TABLE IF NOT EXISTS tinder_service_profiles (
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
    }
  ];

  const results: any[] = [];

  for (const table of tables) {
    console.log(`📋 Processando: ${table.name}...`);
    
    // Primeiro, verificar se já existe
    const { error: checkError } = await supabase
      .from(table.name)
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log(`   ✅ Tabela ${table.name} já existe!\n`);
      results.push({ table: table.name, status: 'exists' });
      continue;
    }

    if (checkError && !checkError.message?.includes('does not exist') && checkError.code !== '42P01') {
      console.log(`   ⚠️  Erro ao verificar: ${checkError.message}`);
      results.push({ table: table.name, status: 'error', error: checkError.message });
      continue;
    }

    // Tabela não existe, tentar criar
    console.log(`   🔨 Tentando criar ${table.name}...`);

    // Método 1: Tentar via RPC (se houver função customizada)
    try {
      const { error: rpcError } = await supabase.rpc('exec_sql', { sql: table.sql });
      if (!rpcError) {
        console.log(`   ✅ Tabela ${table.name} criada via RPC!\n`);
        results.push({ table: table.name, status: 'created', method: 'rpc' });
        continue;
      }
    } catch (err) {
      // RPC não disponível, continuar
    }

    // Método 2: Tentar via REST API diretamente (não funciona para DDL)
    // O Supabase não permite criar tabelas via REST API sem função RPC customizada
    
    console.log(`   ⚠️  Não foi possível criar ${table.name} automaticamente.`);
    console.log(`   💡 Execute o SQL manualmente no Supabase Dashboard.\n`);
    results.push({ 
      table: table.name, 
      status: 'needs_manual', 
      sql: table.sql 
    });
  }

  console.log('\n📊 Resumo:');
  let allCreated = true;
  results.forEach(r => {
    if (r.status === 'exists') {
      console.log(`   ✅ ${r.table}: Já existe`);
    } else if (r.status === 'created') {
      console.log(`   ✅ ${r.table}: Criada com sucesso`);
    } else if (r.status === 'needs_manual') {
      console.log(`   ⚠️  ${r.table}: Precisa criar manualmente`);
      allCreated = false;
    } else {
      console.log(`   ❌ ${r.table}: Erro - ${r.error}`);
      allCreated = false;
    }
  });

  if (!allCreated) {
    console.log('\n📝 INSTRUÇÕES PARA CRIAR MANUALMENTE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Acesse: https://supabase.com/dashboard');
    console.log('2. Selecione seu projeto');
    console.log('3. Clique em "SQL Editor" no menu lateral');
    console.log('4. Clique em "New query"');
    console.log('5. Copie e cole o conteúdo do arquivo: create-tinder-tables.sql');
    console.log('6. Clique no botão "Run" (ou pressione Ctrl+Enter / Cmd+Enter)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📄 SQL para copiar:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    results
      .filter(r => r.status === 'needs_manual' && r.sql)
      .forEach(r => {
        console.log(`\n-- ${r.table}\n${r.sql}\n`);
      });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } else {
    console.log('\n✅ Todas as tabelas estão prontas! Você pode usar o sistema normalmente.\n');
  }
}

createTablesDirect().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
