/**
 * Script para criar tabelas via Node.js usando a connection string do Supabase
 * Execute: npx ts-node scripts/create-tables-node.ts
 */

import { Client } from 'pg';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function createTablesWithPg(): Promise<void> {
  console.log('🚀 Criando tabelas do Tinder do Fluxo no Supabase via PostgreSQL...\n');

  // Tentar obter connection string de várias formas
  let connectionString = process.env.SUPABASE_DB_URL || 
                        process.env.DATABASE_URL ||
                        process.env.POSTGRES_URL;

  if (!connectionString) {
    console.log('⚠️  Connection string não encontrada no .env\n');
    console.log('📝 Para obter a connection string:');
    console.log('1. Acesse: https://supabase.com/dashboard');
    console.log('2. Selecione seu projeto');
    console.log('3. Vá em Settings > Database');
    console.log('4. Copie a "Connection string" (URI mode)');
    console.log('5. Adicione no .env como: SUPABASE_DB_URL="postgresql://..."\n');
    console.log('💡 Formato: postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres\n');
    
    // Tentar construir a partir de variáveis individuais
    const host = process.env.SUPABASE_DB_HOST;
    const port = process.env.SUPABASE_DB_PORT || '5432';
    const database = process.env.SUPABASE_DB_NAME || 'postgres';
    const user = process.env.SUPABASE_DB_USER || 'postgres';
    const password = process.env.SUPABASE_DB_PASSWORD;

    if (host && user && password) {
      connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;
      console.log('✅ Usando variáveis individuais do .env\n');
    } else {
      console.error('❌ Erro: Connection string não configurada.');
      console.error('   Configure SUPABASE_DB_URL ou as variáveis individuais no .env\n');
      process.exit(1);
    }
  }

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false // Supabase requer SSL
    }
  });

  try {
    console.log('📡 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado!\n');

    // Ler SQL do arquivo
    const sqlPath = path.join(__dirname, '..', 'create-tinder-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    // Remover a query de verificação final (vamos fazer separadamente)
    const createTablesSQL = sqlContent
      .split('-- Verificar se as tabelas foram criadas')[0]
      .trim();

    console.log('📋 Criando tabelas...\n');
    
    // Executar SQL de criação
    await client.query(createTablesSQL);

    console.log('✅ Tabelas criadas!\n');

    // Verificar se foram criadas
    console.log('🔍 Verificando tabelas criadas...\n');
    const result = await client.query(`
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
    `);

    console.log('📊 Resultado:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    result.rows.forEach((row: any) => {
      console.log(`   ✅ ${row.tabela.padEnd(30)} | ${row.registros} registros`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Todas as tabelas foram criadas com sucesso!\n');
    console.log('🎉 Agora você pode usar o sistema normalmente.\n');

  } catch (err: any) {
    console.error('❌ Erro ao criar tabelas:', err.message);
    
    if (err.message?.includes('already exists')) {
      console.log('\n✅ As tabelas já existem! Tudo certo.\n');
    } else if (err.message?.includes('password authentication failed')) {
      console.error('\n❌ Erro de autenticação. Verifique a connection string.\n');
    } else if (err.message?.includes('ENOTFOUND') || err.message?.includes('ECONNREFUSED')) {
      console.error('\n❌ Erro de conexão. Verifique o host e porta.\n');
    } else {
      console.error('\n❌ Erro desconhecido:', err);
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTablesWithPg().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
