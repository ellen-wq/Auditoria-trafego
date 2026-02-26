import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../services/api';
import type { User } from '../services/api';

interface Props {
  children: React.ReactNode;
  requiredRole?: 'MENTORADO' | 'LIDERANCA';
  allowedRoles?: Array<'MENTORADO' | 'LIDERANCA' | 'PRESTADOR'>;
  redirectTo?: string;
}

function getMainDashboardPath(role?: string): string {
  if (role === 'LIDERANCA') return '/admin/dashboard';
  return '/app/upload';
}

export default function ProtectedRoute({ children, requiredRole, allowedRoles, redirectTo }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Verificar usuário do localStorage primeiro (rápido)
    try {
      const cachedUser = api.getUser();
      if (cachedUser) {
        setUser(cachedUser);
        setIsChecking(false);
        // Verificar no servidor em background (não bloqueia)
        api.get<{ user: User }>('/api/auth/me')
          .then((res) => {
            if (res?.user) {
              api.setUser(res.user);
              setUser(res.user);
            }
          })
          .catch(() => {
            // Se falhar, usar cache
          });
        return;
      }
    } catch (err) {
      console.error('[ProtectedRoute] Erro ao ler cache:', err);
    }

    // Se não tem cache, verificar no servidor
    let mounted = true;
    const timeoutId = setTimeout(() => {
      if (mounted) {
        setIsChecking(false);
        const cached = api.getUser();
        setUser(cached);
      }
    }, 2000); // Timeout de 2 segundos

    api.get<{ user: User }>('/api/auth/me')
      .then((res) => {
        clearTimeout(timeoutId);
        if (!mounted) return;
        if (res?.user) {
          api.setUser(res.user);
          setUser(res.user);
        } else {
          setUser(null);
        }
        setIsChecking(false);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        if (!mounted) return;
        setUser(null);
        setIsChecking(false);
      });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []); // Executar apenas uma vez

  if (isChecking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div className="loading-spinner" />
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={redirectTo || getMainDashboardPath(user.role)} replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo || getMainDashboardPath(user.role)} replace />;
  }

  return <>{children}</>;
}
