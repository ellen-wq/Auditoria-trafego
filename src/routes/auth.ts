import { Router, Request, Response } from 'express';
import { getSupabase } from '../db/database';
import { generateToken, requireAuth } from '../middleware/auth';
import type { SafeUser } from '../types';

const router = Router();

const LIDERANCA_EMAILS = ['ellen@vtsd.com.br', 'fernanda@vtsd.com.br'];

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    console.log('[Register API] Recebido:', { name, email: email?.toLowerCase()?.trim(), hasPassword: !!password });
    
    if (!name || !email || !password) {
      console.log('[Register API] Validação falhou: campos obrigatórios faltando');
      res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedName = name.trim();
    const supabase = getSupabase();
    
    // 1. Criar usuário no Supabase Auth usando Admin API (não envia email)
    console.log('[Register API] Criando usuário no Supabase Auth via Admin API...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      user_metadata: {
        name: normalizedName
      },
      email_confirm: true // Confirmar email automaticamente (não precisa de confirmação)
    });

    if (authError) {
      console.error('[Register API] Erro ao criar usuário no Auth:', authError);
      if (authError.message.includes('already registered')) {
        res.status(409).json({ error: 'Email já cadastrado.' });
      } else {
        res.status(500).json({ error: 'Erro ao criar usuário: ' + authError.message });
      }
      return;
    }

    if (!authData.user) {
      console.error('[Register API] Usuário não retornado do Auth');
      res.status(500).json({ error: 'Erro ao criar usuário.' });
      return;
    }

    const userId = authData.user.id;
    console.log('[Register API] Usuário criado no Auth:', { userId, email: normalizedEmail });
    const role = LIDERANCA_EMAILS.includes(normalizedEmail) ? 'LIDERANCA' : 'MENTORADO';
    
    // 2. Criar registro na tabela user_roles
    console.log('[Register API] Criando role para usuário:', { userId, role });
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        name: normalizedName,
        role
      })
      .select('user_id, name, role, created_at')
      .single();

    if (roleError) {
      console.error('[Register API] Erro ao criar role:', roleError);
      // Tentar deletar o usuário do auth se falhar
      await supabase.auth.admin.deleteUser(userId);
      res.status(500).json({ error: 'Erro ao criar perfil: ' + roleError.message });
      return;
    }

    console.log('[Register API] Usuário criado com sucesso:', { userId, email: normalizedEmail, role });
    
    // 3. Criar token JWT customizado (ou usar session do Supabase)
    const user: SafeUser = {
      id: userId,
      name: normalizedName,
      email: normalizedEmail,
      role,
      has_seen_tinder_do_fluxo_tutorial: false,
      created_at: roleData.created_at
    };
    
    const token = generateToken(user);
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    console.log('[Register API] Token gerado, enviando resposta');
    res.json({ user, token });
  } catch (err) {
    console.error('[Register API] Erro não tratado:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[Login API] Iniciando login...');
    const { email, password } = req.body;
    if (!email || !password) {
      console.log('[Login API] Email ou senha faltando');
      res.status(400).json({ error: 'Email e senha são obrigatórios.' });
      return;
    }

    const supabase = getSupabase();
    const normalizedEmail = email.toLowerCase().trim();
    console.log('[Login API] Tentando autenticar:', normalizedEmail);

    // 1. Autenticar no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password
    });

    if (authError || !authData.user) {
      console.error('[Login API] Erro na autenticação:', authError);
      res.status(401).json({ error: 'Email ou senha inválidos.' });
      return;
    }

    const userId = authData.user.id;
    console.log('[Login API] Usuário autenticado, userId:', userId);

    // 2. Buscar role do usuário
    // Primeiro tenta com tipo_usuario, se falhar tenta sem
    let roleData: any = null;
    let roleError: any = null;
    
    const firstAttempt = await supabase
      .from('user_roles')
      .select('user_id, name, role, has_seen_tinder_do_fluxo_tutorial, created_at, tipo_usuario')
      .eq('user_id', userId)
      .single();
    
    roleData = firstAttempt.data;
    roleError = firstAttempt.error;
    
    // Se falhar por causa de tipo_usuario, tenta sem essa coluna
    if (roleError && (roleError.code === 'PGRST116' || roleError.message?.includes('tipo_usuario'))) {
      console.log('[Login API] tipo_usuario não existe, buscando sem essa coluna...');
      const result = await supabase
        .from('user_roles')
        .select('user_id, name, role, has_seen_tinder_do_fluxo_tutorial, created_at')
        .eq('user_id', userId)
        .single();
      roleData = result.data;
      roleError = result.error;
    }

    if (roleError || !roleData) {
      console.error('[Login API] Erro ao buscar role:', roleError);
      console.error('[Login API] roleError details:', JSON.stringify(roleError, null, 2));
      res.status(500).json({ error: 'Erro ao buscar perfil do usuário.' });
      return;
    }
    
    console.log('[Login API] Role encontrado:', roleData.role);

    const safeUser: SafeUser = {
      id: userId,
      name: roleData.name || authData.user.user_metadata?.name || '',
      email: normalizedEmail,
      role: roleData.role,
      has_seen_tinder_do_fluxo_tutorial: roleData.has_seen_tinder_do_fluxo_tutorial || false,
      created_at: roleData.created_at
    };
    
    const token = generateToken(safeUser);
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/login-prestador', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email e senha são obrigatórios.' });
      return;
    }

    const supabase = getSupabase();
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Autenticar no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password
    });

    if (authError || !authData.user) {
      res.status(401).json({ error: 'Email ou senha inválidos.' });
      return;
    }

    const userId = authData.user.id;

    // 2. Buscar role do usuário
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (roleError || !roleData) {
      res.status(401).json({ error: 'Email ou senha inválidos.' });
      return;
    }

    if (roleData.role !== 'PRESTADOR') {
      res.status(403).json({ error: 'Esta área é exclusiva para prestadores de serviço.' });
      return;
    }

    const safeUser: SafeUser = {
      id: userId,
      name: roleData.name || authData.user.user_metadata?.name || '',
      email: normalizedEmail,
      role: roleData.role,
      has_seen_tinder_do_fluxo_tutorial: roleData.has_seen_tinder_do_fluxo_tutorial || false,
      created_at: roleData.created_at
    };
    
    const token = generateToken(safeUser);
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Login prestador error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/register-prestador', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedName = name.trim();
    const supabase = getSupabase();

    // 1. Criar usuário no Supabase Auth usando Admin API (não envia email)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      user_metadata: {
        name: normalizedName
      },
      email_confirm: true // Confirmar email automaticamente
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        res.status(409).json({ error: 'Email já cadastrado.' });
      } else {
        res.status(500).json({ error: 'Erro ao criar usuário: ' + authError.message });
      }
      return;
    }

    if (!authData.user) {
      res.status(500).json({ error: 'Erro ao criar usuário.' });
      return;
    }

    const userId = authData.user.id;

    // 2. Criar registro na tabela user_roles
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        name: normalizedName,
        role: 'PRESTADOR'
      })
      .select('user_id, name, role, created_at')
      .single();

    if (roleError) {
      console.error('[Register Prestador] Erro ao criar role:', roleError);
      await supabase.auth.admin.deleteUser(userId);
      res.status(500).json({ error: 'Erro ao criar perfil: ' + roleError.message });
      return;
    }

    const user: SafeUser = {
      id: userId,
      name: normalizedName,
      email: normalizedEmail,
      role: 'PRESTADOR',
      has_seen_tinder_do_fluxo_tutorial: false,
      created_at: roleData.created_at
    };
    
    const token = generateToken(user);
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    res.json({ user, token });
  } catch (err) {
    console.error('Register prestador error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.post('/recover-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      res.status(400).json({ error: 'Email e nova senha são obrigatórios.' });
      return;
    }

    if (String(newPassword).length < 6) {
      res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    const supabase = getSupabase();
    const normalizedEmail = String(email).toLowerCase().trim();

    // Buscar usuário pelo email no auth
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.users?.find(u => u.email === normalizedEmail);

    if (!authUser) {
      res.status(404).json({ error: 'Usuário não encontrado para este email.' });
      return;
    }

    // Atualizar senha usando admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authUser.id,
      { password: String(newPassword) }
    );

    if (updateError) {
      res.status(500).json({ error: 'Não foi possível atualizar a senha.' });
      return;
    }

    res.json({ ok: true, message: 'Senha atualizada com sucesso.' });
  } catch (err) {
    console.error('Recover password error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.get('/me', requireAuth, (req: Request, res: Response): void => {
  res.json({ user: req.user });
});

export default router;
