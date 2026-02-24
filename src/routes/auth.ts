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

    const role = LIDERANCA_EMAILS.includes(email.toLowerCase().trim()) ? 'LIDERANCA' : 'MENTORADO';
    const hash = bcrypt.hashSync(password, 10);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: hash,
        role
      })
      .select('id, name, email, role, created_at')
      .single();

    if (error || !newUser) {
      res.status(500).json({ error: 'Erro ao criar usuário.' });
      return;
    }

    const user: SafeUser = newUser as SafeUser;
    const token = generateToken(user);

    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    res.json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
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
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) {
      res.status(401).json({ error: 'Email ou senha inválidos.' });
      return;
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ error: 'Email ou senha inválidos.' });
      return;
    }

    const safeUser: SafeUser = { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at };
    const token = generateToken(safeUser);

    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req: Request, res: Response): void => {
  res.json({ user: req.user });
});

export default router;
