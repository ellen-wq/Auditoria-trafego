/**
 * Cria 3 perfis fakes (auth + user_roles) e os adiciona como favoritos
 * do primeiro usuário MENTORADO, para visualizar a tela de Favoritos.
 *
 * Execute: npx ts-node scripts/seed-favoritos-fakes.ts
 * Requer: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env
 */

import { initDb, getSupabase } from '../src/db/database';

const FAKE_PROFILES = [
  { name: 'Bruno Silva', email: 'bruno.silva.fake@fluxo.fake', type: 'EXPERT' as const },
  { name: 'Maria Santos', email: 'maria.santos.fake@fluxo.fake', type: 'COMUNIDADE' as const },
  { name: 'Ana Costa', email: 'ana.costa.fake@fluxo.fake', type: 'EXPERT' as const },
];

const FAKE_PASSWORD = '123456';

async function run(): Promise<void> {
  await initDb({ seedUsers: false, ensureStorageBucket: false });
  const supabase = getSupabase();

  // 1. Pegar o primeiro MENTORADO (quem vai "ver" os favoritos na tela)
  const { data: mentorados, error: errMentorados } = await supabase
    .from('user_roles')
    .select('user_id, name')
    .eq('role', 'MENTORADO')
    .order('created_at', { ascending: true })
    .limit(1);

  if (errMentorados || !mentorados?.length) {
    console.error('Nenhum MENTORADO encontrado em user_roles. Crie um usuário e faça login como MENTORADO primeiro.');
    process.exit(1);
  }

  const viewerId = mentorados[0].user_id;
  console.log('Usuário que verá os favoritos:', mentorados[0].name, '(' + viewerId + ')');

  const createdTargetIds: string[] = [];

  // 2. Para cada perfil fake: criar no Auth + user_roles (se não existir) e guardar user_id
  const { data: authList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const authByEmail = new Map((authList?.users || []).map((u) => [u.email?.toLowerCase() ?? '', u]));

  for (const profile of FAKE_PROFILES) {
    const email = profile.email.toLowerCase().trim();
    const existingAuth = authByEmail.get(email);

    let userId: string;

    if (existingAuth) {
      userId = existingAuth.id;
      const { data: ur } = await supabase.from('user_roles').select('user_id').eq('user_id', userId).maybeSingle();
      if (!ur) {
        await supabase.from('user_roles').insert({
          user_id: userId,
          name: profile.name,
          role: 'MENTORADO',
        });
      } else {
        await supabase.from('user_roles').update({ name: profile.name }).eq('user_id', userId);
      }
      console.log('Perfil já existia (atualizado):', profile.name);
    } else {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: FAKE_PASSWORD,
        email_confirm: true,
      });

      if (authError || !authData.user) {
        console.error('Erro ao criar usuário', profile.email, authError?.message);
        continue;
      }

      userId = authData.user.id;

      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: userId,
        name: profile.name,
        role: 'MENTORADO',
      });

      if (roleError) {
        console.error('Erro ao criar user_roles para', profile.name, roleError.message);
        continue;
      }
      console.log('Criado:', profile.name, userId);
    }

    if (userId && userId !== viewerId) createdTargetIds.push(userId);
  }

  if (createdTargetIds.length === 0) {
    console.log('Nenhum perfil novo criado. Adicionando favoritos com usuários existentes...');
    const { data: others } = await supabase
      .from('user_roles')
      .select('user_id, name')
      .neq('user_id', viewerId)
      .limit(3);
    if (others?.length) {
      for (let i = 0; i < others.length; i++) {
        await supabase.from('tinder_favorites').upsert(
          {
            user_id: viewerId,
            target_user_id: others[i].user_id,
            type: FAKE_PROFILES[i]?.type ?? 'EXPERT',
          },
          { onConflict: 'user_id,target_user_id,type' }
        );
      }
      console.log('Inseridos', others.length, 'favoritos (nomes:', others.map((o) => o.name).join(', ') + ').');
    }
  }

  if (createdTargetIds.length > 0) {
    // 3. Inserir tinder_favorites: viewer + cada um dos 3 alvos
    for (let i = 0; i < createdTargetIds.length; i++) {
      const type = FAKE_PROFILES[i]?.type ?? 'EXPERT';
      const { error: favError } = await supabase.from('tinder_favorites').upsert(
        {
          user_id: viewerId,
          target_user_id: createdTargetIds[i],
          type,
        },
        { onConflict: 'user_id,target_user_id,type' }
      );
      if (favError) console.error('Erro ao favoritar:', favError.message);
    }
    console.log('Inseridos', createdTargetIds.length, 'favoritos.');
  }

  console.log('\nConcluído. Faça login como o MENTORADO que vê os favoritos e acesse Tinder do Fluxo > Favoritos.');
  console.log('Senha dos perfis fakes (se criados agora):', FAKE_PASSWORD);
}

run().catch((err) => {
  console.error('Falha:', err);
  process.exit(1);
});
