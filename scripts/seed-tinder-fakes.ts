import bcrypt from 'bcryptjs';
import { initDb, getSupabase } from '../src/db/database';

type SeedUser = {
  name: string;
  email: string;
  role: 'MENTORADO' | 'PRESTADOR' | 'LIDERANCA';
  password: string;
};

async function upsertUser(user: SeedUser): Promise<any> {
  const supabase = getSupabase();
  const normalizedEmail = user.email.toLowerCase().trim();
  const hash = bcrypt.hashSync(user.password, 10);

  const { data: existing } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('email', normalizedEmail)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('users')
      .update({
        name: user.name,
        role: user.role,
        password_hash: hash,
      })
      .eq('id', existing.id)
      .select('id, name, email, role')
      .single();
    if (error) throw new Error(`Erro ao atualizar usuário ${normalizedEmail}: ${error.message}`);
    return data;
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      name: user.name,
      email: normalizedEmail,
      role: user.role,
      password_hash: hash,
    })
    .select('id, name, email, role')
    .single();
  if (error) throw new Error(`Erro ao criar usuário ${normalizedEmail}: ${error.message}`);
  return data;
}

async function run(): Promise<void> {
  await initDb({ seedUsers: false, ensureStorageBucket: false });
  const supabase = getSupabase();

  const mentorados: SeedUser[] = [
    { name: 'Mentorado Alpha', email: 'mentorado.alpha.tinder@fluxo.fake', role: 'MENTORADO', password: '123456' },
    { name: 'Mentorado Beta', email: 'mentorado.beta.tinder@fluxo.fake', role: 'MENTORADO', password: '123456' },
    { name: 'Mentorado Gama', email: 'mentorado.gama.tinder@fluxo.fake', role: 'MENTORADO', password: '123456' },
  ];

  const prestadores: SeedUser[] = [
    { name: 'Prestador Copy', email: 'prestador.copy.tinder@fluxo.fake', role: 'PRESTADOR', password: '123456' },
    { name: 'Prestador Tráfego', email: 'prestador.trafego.tinder@fluxo.fake', role: 'PRESTADOR', password: '123456' },
    { name: 'Prestador Automação', email: 'prestador.automacao.tinder@fluxo.fake', role: 'PRESTADOR', password: '123456' },
  ];

  const liderancas: SeedUser[] = [
    { name: 'Liderança Norte', email: 'lider.norte.tinder@fluxo.fake', role: 'LIDERANCA', password: '123456' },
    { name: 'Liderança Sul', email: 'lider.sul.tinder@fluxo.fake', role: 'LIDERANCA', password: '123456' },
    { name: 'Liderança Centro', email: 'lider.centro.tinder@fluxo.fake', role: 'LIDERANCA', password: '123456' },
  ];

  const createdMentorados = await Promise.all(mentorados.map(upsertUser));
  const createdPrestadores = await Promise.all(prestadores.map(upsertUser));
  const createdLiderancas = await Promise.all(liderancas.map(upsertUser));

  await Promise.all(
    createdMentorados.map((u, idx) =>
      supabase.from('tinder_mentor_profiles').upsert(
        {
          user_id: u.id,
          city: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte'][idx],
          instagram: `@mentor_${idx + 1}`,
          niche: ['Info produtos', 'E-commerce', 'Local'][idx],
          nivel_fluxo: ['SOFT', 'HARD', 'PRO'][idx],
          bio: `Perfil fake de mentorado ${idx + 1} para testes do Tinder do Fluxo.`,
          whatsapp: `+55 11 90000-100${idx}`,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    )
  );

  await Promise.all(
    createdMentorados.map((u, idx) =>
      supabase.from('tinder_expert_profiles').upsert(
        {
          user_id: u.id,
          is_expert: idx !== 1,
          is_coproducer: idx !== 0,
          goal_text: `Objetivo fake ${idx + 1}`,
          search_bio: `Busco parceria estratégica fake ${idx + 1}.`,
          preferences_json: { niches: ['Perpétuo', 'Lançamento', 'Local'], idx },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    )
  );

  await Promise.all(
    createdPrestadores.map((u, idx) =>
      supabase.from('tinder_service_profiles').upsert(
        {
          user_id: u.id,
          city: ['Curitiba', 'Florianópolis', 'Porto Alegre'][idx],
          instagram: `@prestador_${idx + 1}`,
          whatsapp: `+55 41 90000-200${idx}`,
          specialty: ['COPY', 'TRAFEGO', 'AUTOMACAO'][idx],
          certification: ['LIGHTCOPY', 'SUPERHEADS', 'AUTOMACOES_INTELIGENTES'][idx],
          portfolio: `https://portfolio-fake-${idx + 1}.example.com`,
          experience: `Experiência fake do prestador ${idx + 1}.`,
          bio: `Bio fake do prestador ${idx + 1} para testes.`,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    )
  );

  const m1 = createdMentorados[0].id;
  const m2 = createdMentorados[1].id;
  const m3 = createdMentorados[2].id;

  await supabase.from('tinder_interests').upsert(
    [
      { from_user_id: m1, to_user_id: m2, type: 'COMUNIDADE' },
      { from_user_id: m2, to_user_id: m1, type: 'COMUNIDADE' },
      { from_user_id: m1, to_user_id: m3, type: 'EXPERT' },
      { from_user_id: m3, to_user_id: m1, type: 'EXPERT' },
    ],
    { onConflict: 'from_user_id,to_user_id,type' }
  );

  const user1Community = Math.min(m1, m2);
  const user2Community = Math.max(m1, m2);
  const user1Expert = Math.min(m1, m3);
  const user2Expert = Math.max(m1, m3);
  await supabase.from('tinder_matches').upsert(
    [
      { user1_id: user1Community, user2_id: user2Community, type: 'COMUNIDADE' },
      { user1_id: user1Expert, user2_id: user2Expert, type: 'EXPERT' },
    ],
    { onConflict: 'user1_id,user2_id,type' }
  );

  await supabase.from('tinder_favorites').upsert(
    [
      { user_id: m1, target_user_id: m2, type: 'COMUNIDADE' },
      { user_id: m1, target_user_id: m3, type: 'EXPERT' },
      { user_id: m2, target_user_id: m3, type: 'EXPERT' },
    ],
    { onConflict: 'user_id,target_user_id,type' }
  );

  const jobsPayload = [
    {
      creator_id: m1,
      title: 'Copy para página de vendas',
      description: 'Preciso de revisão de copy para página principal.',
      specialty: 'COPY',
      model: 'FREELA',
      value: 250000,
      location: 'Remoto',
      status: 'OPEN',
    },
    {
      creator_id: m2,
      title: 'Gestão de tráfego Meta Ads',
      description: 'Operação full para campanha de low ticket.',
      specialty: 'TRAFEGO',
      model: 'TESTE_3_MESES',
      value: 400000,
      location: 'Remoto',
      status: 'OPEN',
    },
    {
      creator_id: m3,
      title: 'Automação de follow-up',
      description: 'Implementar automação para leads sem resposta.',
      specialty: 'AUTOMACAO',
      model: 'PARCERIA',
      value: 300000,
      location: 'São Paulo',
      status: 'OPEN',
    },
  ];

  const jobIds: number[] = [];
  for (const job of jobsPayload) {
    const { data: existing } = await supabase
      .from('tinder_jobs')
      .select('id')
      .eq('creator_id', job.creator_id)
      .eq('title', job.title)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      jobIds.push(existing.id);
      continue;
    }

    const { data: inserted, error } = await supabase
      .from('tinder_jobs')
      .insert(job)
      .select('id')
      .single();
    if (error || !inserted) throw new Error(`Erro ao criar vaga fake: ${error?.message || 'desconhecido'}`);
    jobIds.push(inserted.id);
  }

  await supabase.from('tinder_applications').upsert(
    [
      { job_id: jobIds[0], candidate_id: createdPrestadores[0].id, message: 'Tenho experiência em copy perpétuo.' },
      { job_id: jobIds[1], candidate_id: createdPrestadores[1].id, message: 'Posso operar e otimizar diariamente.' },
      { job_id: jobIds[2], candidate_id: createdPrestadores[2].id, message: 'Especialista em automações no ecossistema.' },
    ],
    { onConflict: 'job_id,candidate_id' }
  );

  const { data: serviceProfiles, error: serviceProfilesError } = await supabase
    .from('tinder_service_profiles')
    .select('id, user_id')
    .in('user_id', createdPrestadores.map((u) => u.id));
  if (serviceProfilesError || !serviceProfiles) {
    throw new Error(`Erro ao carregar perfis de prestador: ${serviceProfilesError?.message || 'desconhecido'}`);
  }
  const serviceByUserId = new Map<number, number>(serviceProfiles.map((s: any) => [s.user_id, s.id]));

  await supabase.from('tinder_reviews').upsert(
    [
      {
        reviewer_id: m1,
        service_profile_id: serviceByUserId.get(createdPrestadores[0].id),
        rating: 5,
        comment: 'Excelente no prazo e na qualidade.',
      },
      {
        reviewer_id: m2,
        service_profile_id: serviceByUserId.get(createdPrestadores[1].id),
        rating: 4,
        comment: 'Bom desempenho em otimização de CPA.',
      },
      {
        reviewer_id: m3,
        service_profile_id: serviceByUserId.get(createdPrestadores[2].id),
        rating: 5,
        comment: 'Automação muito bem estruturada.',
      },
    ],
    { onConflict: 'reviewer_id,service_profile_id' }
  );

  for (const serviceProfile of serviceProfiles) {
    const { data: ratings } = await supabase
      .from('tinder_reviews')
      .select('rating')
      .eq('service_profile_id', serviceProfile.id);
    const values = (ratings || []).map((r: any) => Number(r.rating)).filter((n: number) => Number.isFinite(n));
    const avg = values.length ? values.reduce((a: number, b: number) => a + b, 0) / values.length : 0;
    await supabase
      .from('tinder_service_profiles')
      .update({ rating_avg: avg, rating_count: values.length, updated_at: new Date().toISOString() })
      .eq('id', serviceProfile.id);
  }

  await supabase.from('tinder_do_fluxo_logs').insert(
    [
      { actor_user_id: createdLiderancas[0].id, action: 'FAKE_SEED_CREATED', meta: { area: 'comunidade' } },
      { actor_user_id: createdLiderancas[1].id, action: 'FAKE_SEED_CREATED', meta: { area: 'prestadores' } },
      { actor_user_id: createdLiderancas[2].id, action: 'FAKE_SEED_CREATED', meta: { area: 'vagas' } },
    ]
  );

  console.log('Seed fake do Tinder do Fluxo concluído com sucesso.');
  console.log('Credencial padrão dos fakes: senha 123456');
  console.log('Mentorados:', mentorados.map((u) => u.email).join(', '));
  console.log('Prestadores:', prestadores.map((u) => u.email).join(', '));
  console.log('Lideranças:', liderancas.map((u) => u.email).join(', '));
}

run().catch((err) => {
  console.error('Falha no seed fake do Tinder do Fluxo:', err);
  process.exit(1);
});
