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

async function ensureTables(): Promise<void> {
  if (!supabase) return;
  
  console.log('[initDb] Verificando existência das tabelas do Tinder do Fluxo...');
  
  // Verificar se as tabelas existem tentando fazer uma query simples
  const tables = ['tinder_mentor_profiles', 'tinder_expert_profiles', 'tinder_service_profiles'];
  const missingTables: string[] = [];
  
  for (const tableName of tables) {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);
      
      if (error && (error.message?.includes('does not exist') || error.message?.includes('relation') || error.code === '42P01')) {
        missingTables.push(tableName);
        console.warn(`[initDb] Tabela ${tableName} não encontrada.`);
      } else {
        console.log(`[initDb] Tabela ${tableName} existe.`);
      }
    } catch (err: any) {
      if (err.message?.includes('does not exist') || err.message?.includes('relation')) {
        missingTables.push(tableName);
        console.warn(`[initDb] Tabela ${tableName} não encontrada (erro: ${err.message}).`);
      }
    }
  }
  
  if (missingTables.length > 0) {
    console.error(`[initDb] As seguintes tabelas não existem: ${missingTables.join(', ')}`);
    console.error('[initDb] Execute o script SQL no Supabase Dashboard: create-tinder-tables.sql');
    console.error('[initDb] Ou acesse: Supabase Dashboard > SQL Editor > Cole o conteúdo do arquivo create-tinder-tables.sql');
  } else {
    console.log('[initDb] Todas as tabelas do Tinder do Fluxo existem.');
  }
}

async function initDb(options: InitDbOptions = {}): Promise<void> {
  const seedUsers = options.seedUsers ?? true;
  const ensureStorageBucket = options.ensureStorageBucket ?? true;

  // Sempre reconecta ao Supabase se necessário
  if (!supabase) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env');
    }

    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }

  // Garantir que as tabelas existem
  if (!initialized) {
    await ensureTables();
  }

  if (ensureStorageBucket && !initialized) {
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
      // Perfis fake para o Tinder do Fluxo - COMUNIDADE
      { name: 'Ana Social', email: 'ana.social@gmail.com', password: '123456', role: 'MENTORADO' },
      { name: 'Bruno Copy', email: 'bruno.copy@gmail.com', password: '123456', role: 'MENTORADO' },
      { name: 'Carla Design', email: 'carla.design@gmail.com', password: '123456', role: 'MENTORADO' },
      // Perfis fake para o Tinder do Fluxo - EXPERTS
      { name: 'Renata Expert', email: 'renata.expert@gmail.com', password: '123456', role: 'MENTORADO' },
      { name: 'Patrícia English', email: 'patricia.english@gmail.com', password: '123456', role: 'MENTORADO' },
      { name: 'Fernanda Confeitaria', email: 'fernanda.confeitaria@gmail.com', password: '123456', role: 'MENTORADO' },
      // Perfis fake para o Tinder do Fluxo - PRESTADORES
      { name: 'Lucas Tráfego', email: 'lucas.trafego@gmail.com', password: '123456', role: 'PRESTADOR' },
      { name: 'Ana Copywriter', email: 'ana.copywriter@gmail.com', password: '123456', role: 'PRESTADOR' },
      { name: 'Rafael Dev', email: 'rafael.dev@gmail.com', password: '123456', role: 'PRESTADOR' },
      // Perfis fake antigos (mantidos para compatibilidade)
      { name: 'Mariana Alves', email: 'mariana.alves.tinder@fluxo.fake', password: '123456', role: 'MENTORADO' },
      { name: 'Juliana Rocha Santos', email: 'juliana.rocha.tinder@fluxo.fake', password: '123456', role: 'MENTORADO' },
      { name: 'Camila Freitas', email: 'camila.freitas.tinder@fluxo.fake', password: '123456', role: 'MENTORADO' },
      { name: 'Renata Souza', email: 'renata.souza.tinder@fluxo.fake', password: '123456', role: 'MENTORADO' },
      { name: 'Patrícia Lima', email: 'patricia.lima.tinder@fluxo.fake', password: '123456', role: 'MENTORADO' },
      { name: 'Fernanda Martins', email: 'fernanda.martins.tinder@fluxo.fake', password: '123456', role: 'MENTORADO' },
      { name: 'Lucas Tráfego Old', email: 'lucas.trafego.tinder@fluxo.fake', password: '123456', role: 'PRESTADOR' },
      { name: 'Ana Carolina Copywriter', email: 'ana.carolina.tinder@fluxo.fake', password: '123456', role: 'PRESTADOR' },
      { name: 'Rafael Dev de Funis', email: 'rafael.dev.tinder@fluxo.fake', password: '123456', role: 'PRESTADOR' },
      { name: 'Fernanda Brier', email: 'fernanda.brier.tinder@fluxo.fake', password: '123456', role: 'MENTORADO' },
      { name: 'Teste Layout', email: 'teste.layout@fluxo.fake', password: '123456', role: 'MENTORADO' }
    ];

    const tinderUsersMap: Map<string, number> = new Map();

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
        tinderUsersMap.set(u.name, userId);
        console.log(`[SEED] Criado usuário Tinder: ${u.name} (ID: ${userId})`);
      }
    }

    console.log(`[SEED] Total de usuários Tinder criados: ${tinderUsersMap.size}`);

    // Cria perfis de COMUNIDADE
    const comunidadeProfiles = [
      { name: 'Ana Social', city: 'São Paulo - SP', instagram: '@ana.social', niche: 'Social Media para Experts', bio: 'Transformo conteúdo em vendas todos os dias. +120 lançamentos atendidos. Amo dashboards, testes rápidos e café.', nivel: 'HARD' },
      { name: 'Bruno Copy', city: 'Rio de Janeiro - RJ', instagram: '@bruno.copy', niche: 'Copy para funil perpétuo low ticket', bio: 'Copy direta ao ponto para páginas, anúncios e e-mails. Foco total em conversão e escala previsível.', nivel: 'PRO' },
      { name: 'Carla Design', city: 'Belo Horizonte - MG', instagram: '@carla.design', niche: 'Design de criativos para Meta Ads', bio: 'Especialista em criativos que aumentam CTR e reduzem CPA. Disponível para projetos fixos e freelas.', nivel: 'SOFT' },
      // Perfis antigos mantidos
      { name: 'Mariana Alves', city: 'Belo Horizonte - MG', instagram: '@mariana.socialmediafake', niche: 'Social Media para Experts', bio: 'Transformo conteúdo em vendas todos os dias. +120 lançamentos atendidos. Amo dashboards, testes rápidos e café.', nivel: 'HARD' },
      { name: 'Juliana Rocha Santos', city: 'Curitiba - PR', instagram: '@copy.julianarochafake', niche: 'Copy para funil perpétuo low ticket', bio: 'Copy direta ao ponto para páginas, anúncios e e-mails. Foco total em conversão e escala previsível.', nivel: 'PRO' },
      { name: 'Camila Freitas', city: 'Recife - PE', instagram: '@camilacriativosmeta', niche: 'Design de criativos para Meta Ads', bio: 'Especialista em criativos que aumentam CTR e reduzem CPA. Disponível para projetos fixos e freelas.', nivel: 'SOFT' },
      { name: 'Teste Layout', city: 'São Paulo - SP', instagram: '@fake', niche: 'Nicho fake', bio: 'Bio fake para teste de layout em todas as telas', nivel: 'PRO' }
    ];

    for (const profile of comunidadeProfiles) {
      const userId = tinderUsersMap.get(profile.name);
      if (userId) {
        const { error } = await supabase.from('tinder_mentor_profiles').upsert({
          user_id: userId,
          city: profile.city,
          instagram: profile.instagram,
          niche: profile.niche,
          nivel_fluxo: profile.nivel,
          bio: profile.bio,
          whatsapp: `+55 11 90000-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        if (error) {
          console.error(`[SEED] Erro ao criar perfil comunidade ${profile.name}:`, error);
        } else {
          console.log(`[SEED] Perfil comunidade criado: ${profile.name}`);
        }
      } else {
        console.warn(`[SEED] Usuário não encontrado para perfil comunidade: ${profile.name}`);
      }
    }

    // Cria perfis de EXPERTS
    const expertProfiles = [
      { name: 'Renata Expert', city: 'São Paulo - SP', instagram: '@renata.expert', niche: 'Estética avançada', bio: 'Ensino esteticistas a faturarem 20k+ com procedimentos premium. Produto perpétuo validado e escalando.', nivel: 'PRO' },
      { name: 'Patrícia English', city: 'Rio de Janeiro - RJ', instagram: '@patricia.english', niche: 'Inglês para adultos do zero à conversação', bio: 'Método próprio com mais de 3.000 alunas. Estruturando funil evergreen e buscando time para escalar.', nivel: 'HARD' },
      { name: 'Fernanda Confeitaria', city: 'Porto Alegre - RS', instagram: '@fernanda.confeitaria', niche: 'Confeitaria lucrativa', bio: 'Ajudo confeiteiras a viverem da confeitaria em casa com vendas todos os dias através do digital.', nivel: 'SOFT' },
      // Perfis antigos mantidos
      { name: 'Renata Souza', city: 'São Paulo - SP', instagram: '@renata.esteticafake', niche: 'Estética avançada', bio: 'Ensino esteticistas a faturarem 20k+ com procedimentos premium. Produto perpétuo validado e escalando.', nivel: 'PRO' },
      { name: 'Patrícia Lima', city: 'Rio de Janeiro - RJ', instagram: '@patricia.englishcoursefake', niche: 'Inglês para adultos do zero à conversação', bio: 'Método próprio com mais de 3.000 alunas. Estruturando funil evergreen e buscando time para escalar.', nivel: 'HARD' },
      { name: 'Fernanda Martins', city: 'Porto Alegre - RS', instagram: '@confeitaria.fernandafake', niche: 'Confeitaria lucrativa', bio: 'Ajudo confeiteiras a viverem da confeitaria em casa com vendas todos os dias através do digital.', nivel: 'SOFT' },
      { name: 'Teste Layout', city: 'São Paulo - SP', instagram: '@fake', niche: 'Nicho fake', bio: 'Bio fake para teste de layout em todas as telas', nivel: 'PRO' }
    ];

    for (const profile of expertProfiles) {
      const userId = tinderUsersMap.get(profile.name);
      if (userId) {
        await supabase.from('tinder_mentor_profiles').upsert({
          user_id: userId,
          city: profile.city,
          instagram: profile.instagram,
          niche: profile.niche,
          nivel_fluxo: profile.nivel,
          bio: profile.bio,
          whatsapp: `+55 11 90000-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        await supabase.from('tinder_expert_profiles').upsert({
          user_id: userId,
          is_expert: true,
          is_coproducer: true,
          goal_text: `Objetivo: escalar ${profile.niche.toLowerCase()}`,
          search_bio: `Busco parceria estratégica para ${profile.niche.toLowerCase()}.`,
          preferences_json: { niches: [profile.niche], nivel: profile.nivel },
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      }
    }

    // Cria perfis de PRESTADORES
    const prestadorProfiles = [
      { name: 'Lucas Tráfego', city: 'São Paulo - SP', instagram: '@lucas.trafego', specialty: 'TRAFEGO', certification: 'SUPERHEADS', bio: '+2M investidos em anúncios. Escala de low ticket com foco em ROI e previsibilidade.', rating: 5.0 },
      { name: 'Ana Copywriter', city: 'Rio de Janeiro - RJ', instagram: '@ana.copywriter', specialty: 'COPY', certification: 'LIGHTCOPY', bio: 'Especialista em páginas de vendas, VSL curta e e-mails para funis perpétuos.', rating: 4.8 },
      { name: 'Rafael Dev', city: 'Belo Horizonte - MG', instagram: '@rafael.dev', specialty: 'AUTOMACAO', certification: 'AUTOMACOES_INTELIGENTES', bio: 'Criação de páginas rápidas, integradas e com tracking validado para produtos digitais.', rating: 4.9 },
      // Perfis antigos mantidos
      { name: 'Lucas Tráfego Old', city: 'São Paulo - SP', instagram: '@lucas.metaadsfake', specialty: 'TRAFEGO', certification: 'SUPERHEADS', bio: '+2M investidos em anúncios. Escala de low ticket com foco em ROI e previsibilidade.', rating: 5.0 },
      { name: 'Ana Carolina Copywriter', city: 'Rio de Janeiro - RJ', instagram: '@anacopy.conversao', specialty: 'COPY', certification: 'LIGHTCOPY', bio: 'Especialista em páginas de vendas, VSL curta e e-mails para funis perpétuos.', rating: 4.8 },
      { name: 'Rafael Dev de Funis', city: 'Belo Horizonte - MG', instagram: '@rafael.devfunnelsfake', specialty: 'AUTOMACAO', certification: 'AUTOMACOES_INTELIGENTES', bio: 'Criação de páginas rápidas, integradas e com tracking validado para produtos digitais.', rating: 4.9 }
    ];

    for (const profile of prestadorProfiles) {
      const userId = tinderUsersMap.get(profile.name);
      if (userId) {
        await supabase.from('tinder_service_profiles').upsert({
          user_id: userId,
          city: profile.city,
          instagram: profile.instagram,
          whatsapp: `+55 11 90000-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          specialty: profile.specialty,
          certification: profile.certification,
          portfolio: `https://portfolio-${profile.name.toLowerCase().replace(/\s+/g, '-')}.example.com`,
          experience: `Experiência em ${profile.specialty.toLowerCase()} para produtos digitais.`,
          bio: profile.bio,
          rating_avg: profile.rating,
          rating_count: 10,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      }
    }

    // Perfil de teste - Fernanda Brier
    const fernandaBrierId = tinderUsersMap.get('Fernanda Brier');
    if (fernandaBrierId) {
      await supabase.from('tinder_mentor_profiles').upsert({
        user_id: fernandaBrierId,
        city: 'São Paulo - SP',
        instagram: '@fake',
        niche: 'Estratégia para experts e gestão de comunidades',
        nivel_fluxo: 'PRO',
        bio: 'Ajudo experts a estruturarem o perpétuo com processos claros, métricas e previsibilidade. Gestora do Fluxo e responsável pela operação da mentoria. Apaixonada por transformar operações complexas em sistemas simples e escaláveis.',
        whatsapp: '+55 11 90000-0000',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    }

    // Cria MATCHES (7 matches: comunidade ↔ experts e comunidade ↔ prestadores)
    const matches = [
      // Comunidade ↔ Experts
      { user1: 'Ana Social', user2: 'Renata Expert', type: 'COMUNIDADE' },
      { user1: 'Bruno Copy', user2: 'Patrícia English', type: 'COMUNIDADE' },
      { user1: 'Carla Design', user2: 'Fernanda Confeitaria', type: 'COMUNIDADE' },
      // Comunidade ↔ Prestadores
      { user1: 'Ana Social', user2: 'Lucas Tráfego', type: 'SERVICO' },
      { user1: 'Bruno Copy', user2: 'Ana Copywriter', type: 'SERVICO' },
      { user1: 'Carla Design', user2: 'Rafael Dev', type: 'SERVICO' },
      { user1: 'Ana Social', user2: 'Ana Copywriter', type: 'SERVICO' }
    ];

    for (const match of matches) {
      const id1 = tinderUsersMap.get(match.user1);
      const id2 = tinderUsersMap.get(match.user2);
      if (id1 && id2) {
        const [u1, u2] = id1 < id2 ? [id1, id2] : [id2, id1];
        await supabase.from('tinder_matches').upsert({
          user1_id: u1,
          user2_id: u2,
          type: match.type || 'COMUNIDADE'
        }, { onConflict: 'user1_id,user2_id,type' });
        console.log(`[SEED] Match criado: ${match.user1} ↔ ${match.user2} (${match.type || 'COMUNIDADE'})`);
      } else {
        console.warn(`[SEED] Usuários não encontrados para match: ${match.user1} ↔ ${match.user2}`);
      }
    }

    // Cria VAGAS (vinculadas aos novos experts)
    const vagas = [
      { expert: 'Renata Expert', title: 'Gestor de Tráfego para escalar produto low ticket validado', description: 'Produto com vendas diárias, estrutura pronta e criativos validados. Preciso de gestor para escalar no Meta Ads com foco em ROI.', specialty: 'TRAFEGO', model: 'PRESTACAO_SERVICO', location: 'Remoto' },
      { expert: 'Patrícia English', title: 'Copywriter para reestruturação de funil perpétuo evergreen', description: 'Revisão completa de página, sequência de e-mails e novos anúncios. Experiência com CPL e produtos educacionais é diferencial.', specialty: 'COPY', model: 'PROJETO_FECHADO', location: 'Remoto' },
      { expert: 'Fernanda Confeitaria', title: 'Social Media estratégico com foco em conteúdo que gera vendas', description: 'Planejamento mensal, linha editorial e acompanhamento de métricas. Contrato recorrente para crescimento da marca.', specialty: 'SOCIAL_MEDIA', model: 'MENSAL', location: 'Remoto' }
    ];

    for (const vaga of vagas) {
      const expertId = tinderUsersMap.get(vaga.expert);
      if (expertId) {
        // Verifica se a vaga já existe
        const { data: existing } = await supabase
          .from('tinder_jobs')
          .select('id')
          .eq('creator_id', expertId)
          .eq('title', vaga.title)
          .maybeSingle();

        if (!existing) {
          const { error: jobError } = await supabase.from('tinder_jobs').insert({
            creator_id: expertId,
            title: vaga.title,
            description: vaga.description,
            specialty: vaga.specialty,
            model: vaga.model,
            location: vaga.location,
            status: 'OPEN'
          });
          if (jobError) {
            console.error(`[SEED] Erro ao criar vaga para ${vaga.expert}:`, jobError);
          } else {
            console.log(`[SEED] Vaga criada: ${vaga.title} (${vaga.expert})`);
          }
        }
      } else {
        console.warn(`[SEED] Expert não encontrado para vaga: ${vaga.expert}`);
      }
    }
  }

  if (!initialized) {
    initialized = true;
  }
  console.log('✅ Supabase conectado e seed executado.');
  if (seedUsers) {
    console.log('✅ Perfis fake do Tinder do Fluxo criados com sucesso!');
  }
}

export { getSupabase, initDb, STORAGE_BUCKET_NAME };
