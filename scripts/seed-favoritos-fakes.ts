/**
 * Cria 3 perfis fakes (auth + user_roles) e os adiciona como favoritos
 * para TODOS os usuários. Qualquer um que acessar Favoritos verá os 3.
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

  const fakeUserIds: string[] = [];

  // 1. Criar ou buscar os 3 perfis fake (Auth + user_roles)
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

    fakeUserIds.push(userId);
  }

  if (fakeUserIds.length === 0) {
    console.error('Nenhum perfil fake disponível. Crie os 3 perfis (Bruno Silva, Maria Santos, Ana Costa) ou rode o SQL após criá-los.');
    process.exit(1);
  }

  // 2. Todos os usuários que podem ver Favoritos (exceto os 3 fakes)
  const { data: allUsers, error: errUsers } = await supabase
    .from('user_roles')
    .select('user_id')
    .in('role', ['MENTORADO', 'LIDERANCA']);

  if (errUsers || !allUsers?.length) {
    console.error('Nenhum usuário MENTORADO/LIDERANCA em user_roles.');
    process.exit(1);
  }

  const fakeSet = new Set(fakeUserIds);
  const viewerIds = allUsers.map((u: any) => u.user_id).filter((id: string) => !fakeSet.has(id));

  if (viewerIds.length === 0) {
    console.log('Apenas os perfis fake existem. Adicione outro usuário (MENTORADO ou LIDERANCA) para ver os favoritos.');
  }

  // 3. Para cada usuário, inserir os 3 favoritos (um para cada fake)
  let inserted = 0;
  for (const viewerId of viewerIds) {
    for (let i = 0; i < fakeUserIds.length; i++) {
      const type = FAKE_PROFILES[i]?.type ?? 'EXPERT';
      const { error: favError } = await supabase.from('tinder_favorites').upsert(
        {
          user_id: viewerId,
          target_user_id: fakeUserIds[i],
          type,
        },
        { onConflict: 'user_id,target_user_id,type' }
      );
      if (favError) console.error('Erro ao favoritar:', favError.message);
      else inserted++;
    }
  }

  console.log('\nConcluído. Os 3 perfis fakes foram adicionados como favoritos para', viewerIds.length, 'usuário(s).');
  console.log('Total de linhas de favoritos inseridas/atualizadas:', inserted);
  console.log('Qualquer usuário MENTORADO ou LIDERANCA verá os 3 na aba Favoritos.');
  console.log('Senha dos perfis fakes (se criados agora):', FAKE_PASSWORD);
}

run().catch((err) => {
  console.error('Falha:', err);
  process.exit(1);
});
