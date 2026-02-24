import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { getSupabase } from '../db/database';
import type { JwtPayload, SafeUser } from '../types';

const JWT_SECRET: string = process.env.JWT_SECRET || 'fluxer_auditoria_secret_2024';

function generateToken(user: { id: number; email: string; role: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const supabase = getSupabase();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      res.status(401).json({ error: 'Usuário não encontrado' });
      return;
    }
    req.user = user as SafeUser;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }
    if (req.user.role !== role) {
      res.status(403).json({ error: 'Sem permissão' });
      return;
    }
    next();
  };
}

export { generateToken, requireAuth, requireRole, JWT_SECRET };
