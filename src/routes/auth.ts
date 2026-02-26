import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
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
    
    console.log('[Register API] Verificando se email já existe:', normalizedEmail);
    const supabase = getSupabase();
    const { data: existing, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (checkError) {
      console.error('[Register API] Erro ao verificar email existente:', checkError);
    }

    if (existing) {
      console.log('[Register API] Email já cadastrado:', normalizedEmail, 'ID:', existing.id);
      res.status(409).json({ error: 'Email já cadastrado.' });
      return;
    }

    const role = LIDERANCA_EMAILS.includes(normalizedEmail) ? 'LIDERANCA' : 'MENTORADO';
    console.log('[Register API] Criando usuário com role:', role);
    const hash = bcrypt.hashSync(password, 10);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        name: normalizedName,
        email: normalizedEmail,
        password_hash: hash,
        role
      })
      .select('id, name, email, role, created_at')
      .single();

    if (error) {
      console.error('[Register API] Erro ao inserir usuário:', error);
      res.status(500).json({ error: 'Erro ao criar usuário: ' + error.message });
      return;
    }

    if (!newUser) {
      console.error('[Register API] Usuário não retornado após inserção');
      res.status(500).json({ error: 'Erro ao criar usuário.' });
      return;
    }

    console.log('[Register API] Usuário criado com sucesso:', { id: newUser.id, email: newUser.email, role: newUser.role });
    const user: SafeUser = newUser as SafeUser;
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
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email e senha são obrigatórios.' });
      return;
    }

    const supabase = getSupabase();
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .order('id', { ascending: false })
      .limit(5);

    if (error || !users || users.length === 0) {
      res.status(401).json({ error: 'Email ou senha inválidos.' });
      return;
    }

    const user = users[0];
    if (users.length > 1) {
      console.warn(`Login com email duplicado detectado: ${email.toLowerCase().trim()} (${users.length} registros).`);
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ error: 'Email ou senha inválidos.' });
      return;
    }

    const safeUser: SafeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      has_seen_tinder_do_fluxo_tutorial: user.has_seen_tinder_do_fluxo_tutorial,
      created_at: user.created_at
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
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .order('id', { ascending: false })
      .limit(5);

    if (error || !users || users.length === 0) {
      res.status(401).json({ error: 'Email ou senha inválidos.' });
      return;
    }

    const user = users[0];
    if (!bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ error: 'Email ou senha inválidos.' });
      return;
    }

    if (user.role !== 'PRESTADOR') {
      res.status(403).json({ error: 'Esta área é exclusiva para prestadores de serviço.' });
      return;
    }

    const safeUser: SafeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      has_seen_tinder_do_fluxo_tutorial: user.has_seen_tinder_do_fluxo_tutorial,
      created_at: user.created_at
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

    const supabase = getSupabase();
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      res.status(409).json({ error: 'Email já cadastrado.' });
      return;
    }

    const hash = bcrypt.hashSync(password, 10);
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: hash,
        role: 'PRESTADOR'
      })
      .select('id, name, email, role, created_at')
      .single();

    if (error || !newUser) {
      res.status(500).json({ error: 'Erro ao criar usuário prestador.' });
      return;
    }

    const user: SafeUser = newUser as SafeUser;
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

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado para este email.' });
      return;
    }

    const passwordHash = bcrypt.hashSync(String(newPassword), 10);
    const { error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', user.id);

    if (error) {
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
