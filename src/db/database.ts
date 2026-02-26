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
      { name: 'Fernanda', email: 'fernanda@vtsd.com.br', password: '123', role: 'LIDERANCA' },
      // Perfis fake para aparecer na página de Mentorados
      { name: 'João Silva', email: 'joao.silva@example.com', password: '123', role: 'MENTORADO' },
      { name: 'Maria Santos', email: 'maria.santos@example.com', password: '123', role: 'MENTORADO' },
      { name: 'Pedro Oliveira', email: 'pedro.oliveira@example.com', password: '123', role: 'MENTORADO' },
      { name: 'Ana Costa', email: 'ana.costa@example.com', password: '123', role: 'MENTORADO' },
      { name: 'Carlos Ferreira', email: 'carlos.ferreira@example.com', password: '123', role: 'MENTORADO' },
      // Perfis fake para o Tinder do Fluxo
      { name: 'Mentorado Alpha', email: 'mentorado.alpha.tinder@fluxo.fake', password: '123456', role: 'MENTORADO' },
      { name: 'Prestador Copy', email: 'prestador.copy.tinder@fluxo.fake', password: '123456', role: 'PRESTADOR' },
      { name: 'Expert Beta', email: 'expert.beta.tinder@fluxo.fake', password: '123456', role: 'MENTORADO' }
    ];

    const createdTinderUsers: Array<{ id: number; email: string; role: string }> = [];

    for (const u of seedData) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', u.email)
        .maybeSingle();

      const hash = bcrypt.hashSync(u.password, 10);
      let userId: number;

      if (existing) {
        await supabase.from('users')
          .update({ password_hash: hash, role: u.role })
          .eq('email', u.email);
        userId = existing.id;
      } else {
        const { data: inserted } = await supabase.from('users')
          .insert({ name: u.name, email: u.email, password_hash: hash, role: u.role })
          .select('id')
          .single();
        userId = inserted?.id || 0;
      }

      // Guarda IDs dos perfis fake do Tinder do Fluxo
      if (u.email.includes('tinder@fluxo.fake')) {
        createdTinderUsers.push({ id: userId, email: u.email, role: u.role });
      }
    }

    // Cria perfis completos do Tinder do Fluxo
    for (const user of createdTinderUsers) {
      if (user.role === 'MENTORADO') {
        // Perfil de mentorado
        await supabase.from('tinder_mentor_profiles').upsert({
          user_id: user.id,
          city: user.email.includes('alpha') ? 'São Paulo' : 'Rio de Janeiro',
          instagram: user.email.includes('alpha') ? '@mentor_alpha' : '@expert_beta',
          niche: user.email.includes('alpha') ? 'Info produtos' : 'E-commerce',
          nivel_fluxo: user.email.includes('alpha') ? 'SOFT' : 'HARD',
          bio: `Perfil fake ${user.email.includes('alpha') ? 'de mentorado' : 'de expert'} para testes do Tinder do Fluxo.`,
          whatsapp: user.email.includes('alpha') ? '+55 11 90000-1001' : '+55 21 90000-1002',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        // Perfil expert/coprodutor (apenas para expert.beta)
        if (user.email.includes('beta')) {
          await supabase.from('tinder_expert_profiles').upsert({
            user_id: user.id,
            is_expert: true,
            is_coproducer: true,
            goal_text: 'Objetivo fake de expert/coprodutor',
            search_bio: 'Busco parceria estratégica para lançamentos.',
            preferences_json: { niches: ['Perpétuo', 'Lançamento'], idx: 1 },
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        }
      } else if (user.role === 'PRESTADOR') {
        // Perfil de prestador
        await supabase.from('tinder_service_profiles').upsert({
          user_id: user.id,
          city: 'Curitiba',
          instagram: '@prestador_copy',
          whatsapp: '+55 41 90000-2001',
          specialty: 'COPY',
          certification: 'LIGHTCOPY',
          portfolio: 'https://portfolio-fake-copy.example.com',
          experience: 'Experiência fake em copy para produtos digitais.',
          bio: 'Bio fake do prestador de copy para testes.',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      }
    }
  }

  initialized = true;
  console.log('Supabase conectado e seed executado.');
}

export { getSupabase, initDb, STORAGE_BUCKET_NAME };
