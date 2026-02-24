import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const STORAGE_BUCKET_NAME = process.env.SUPABASE_UPLOADS_BUCKET || 'auditoria-uploads';

let supabase: SupabaseClient | null = null;
let initialized = false;

function getSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Supabase não inicializado. Aguarde initDb().');
  return supabase;
}

interface InitDbOptions {
  seedUsers?: boolean;
  ensureStorageBucket?: boolean;
}

async function initDb(options: InitDbOptions = {}): Promise<void> {
  const seedUsers = options.seedUsers ?? true;
  const ensureStorageBucket = options.ensureStorageBucket ?? true;

  if (initialized && supabase) return;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env');
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  if (ensureStorageBucket) {
    const { data: buckets } = await supabase.storage.listBuckets();
    const hasUploadsBucket = (buckets || []).some((b) => b.name === STORAGE_BUCKET_NAME);
    if (!hasUploadsBucket) {
      const { error: bucketError } = await supabase.storage.createBucket(STORAGE_BUCKET_NAME, {
        public: false,
        fileSizeLimit: 10 * 1024 * 1024,
        allowedMimeTypes: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv',
          'application/csv'
        ]
      });
      if (bucketError) {
        console.warn('Não foi possível criar bucket de uploads automaticamente:', bucketError.message);
      }
    }
  }

  if (seedUsers) {
    const bcrypt = await import('bcryptjs');
    const seedData = [
      { name: 'Ellen', email: 'ellen@vtsd.com.br', password: '123', role: 'LIDERANCA' },
      { name: 'Fernanda', email: 'fernanda@vtsd.com.br', password: '123', role: 'LIDERANCA' }
    ];

    for (const u of seedData) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', u.email)
        .maybeSingle();

      const hash = bcrypt.hashSync(u.password, 10);

      if (existing) {
        await supabase.from('users')
          .update({ password_hash: hash, role: u.role })
          .eq('email', u.email);
      } else {
        await supabase.from('users')
          .insert({ name: u.name, email: u.email, password_hash: hash, role: u.role });
      }
    }
  }

  initialized = true;
  console.log('Supabase conectado e seed executado.');
}

export { getSupabase, initDb, STORAGE_BUCKET_NAME };
