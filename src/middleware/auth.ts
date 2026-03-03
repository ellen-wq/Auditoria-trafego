import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { getSupabase } from '../db/database';
import type { JwtPayload, SafeUser } from '../types';

const JWT_SECRET: string = process.env.JWT_SECRET || 'fluxer_auditoria_secret_2024';

function generateToken(user: { id: string; email: string; role: string }): string {
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
    
    console.log('[requireAuth] Verificando usuário:', { id: decoded.id, email: decoded.email });
    
    // Buscar role do usuário na tabela user_roles
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id, name, role, has_seen_tinder_do_fluxo_tutorial, created_at')
      .eq('user_id', decoded.id)
      .maybeSingle();

    if (roleError) {
      console.error('[requireAuth] Erro ao buscar role:', {
        error: roleError,
        userId: decoded.id,
        errorCode: roleError?.code,
        errorMessage: roleError?.message
      });
      res.status(500).json({ 
        error: 'Erro ao verificar autenticação.',
        details: process.env.NODE_ENV === 'development' ? roleError.message : undefined
      });
      return;
    }

    if (!roleData) {
      console.error('[requireAuth] Usuário não encontrado na tabela user_roles:', decoded.id);
      res.status(401).json({ error: 'Usuário não encontrado' });
      return;
    }

    const user: SafeUser = {
      id: roleData.user_id,
      name: roleData.name || '',
      email: decoded.email || '',
      role: roleData.role as 'LIDERANCA' | 'MENTORADO' | 'PRESTADOR',
      has_seen_tinder_do_fluxo_tutorial: roleData.has_seen_tinder_do_fluxo_tutorial || false,
      created_at: roleData.created_at
    };

    console.log('[requireAuth] Usuário autenticado:', { id: user.id, email: user.email, role: user.role });
    req.user = user;
    next();
  } catch (err: any) {
    console.error('[requireAuth] Erro ao verificar token:', err);
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
