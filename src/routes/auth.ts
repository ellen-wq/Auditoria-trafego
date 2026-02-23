import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/database';
import { generateToken, requireAuth } from '../middleware/auth';
import type { User, SafeUser } from '../types';

const router = Router();

const LIDERANCA_EMAILS = ['ellen@vtsd.com.br', 'fernanda@vtsd.com.br'];

router.post('/register', (req: Request, res: Response): void => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
      return;
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      res.status(409).json({ error: 'Email já cadastrado.' });
      return;
    }

    const role = LIDERANCA_EMAILS.includes(email.toLowerCase().trim()) ? 'LIDERANCA' : 'MENTORADO';
    const hash = bcrypt.hashSync(password, 10);

    const result = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
      name.trim(),
      email.toLowerCase().trim(),
      hash,
      role
    );

    const user: SafeUser = { id: result.lastInsertRowid, name: name.trim(), email: email.toLowerCase().trim(), role, created_at: '' };
    const token = generateToken(user);

    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    res.json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/login', (req: Request, res: Response): void => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email e senha são obrigatórios.' });
      return;
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as User | null;
    if (!user) {
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
