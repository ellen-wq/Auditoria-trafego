import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import type { User } from '../services/api';
import ProfileRequired from './ProfileRequired';

interface Props {
  children: React.ReactNode;
  requiredRole?: 'MENTORADO' | 'LIDERANCA';
  allowedRoles?: Array<'MENTORADO' | 'LIDERANCA' | 'PRESTADOR'>;
  redirectTo?: string;
  skipProfileCheck?: boolean; // For profile page itself
}

function getMainDashboardPath(role?: string): string {
  if (role === 'LIDERANCA') return '/admin/dashboard';
  if (role === 'PRESTADOR') return '/tinder-do-fluxo/perfil';
  return '/tinder-do-fluxo/perfil'; // MENTORADO must create profile first
}

export default function ProtectedRoute({ children, requiredRole, allowedRoles, redirectTo, skipProfileCheck }: Props) {
  const location = useLocation();
  const userFromLogin = (location.state as { fromLogin?: boolean; user?: User } | null)?.fromLogin && (location.state as { user?: User })?.user
    ? (location.state as { user: User }).user
    : null;

  const [user, setUser] = useState<User | null>(() => userFromLogin ?? null);
  const [isChecking, setIsChecking] = useState(() => !userFromLogin);

  useEffect(() => {
    // Se já temos usuário vindo do login, só sincronizar em background
    if (userFromLogin) {
      api.get<{ user: User }>('/api/auth/me')
        .then((res) => {
          if (res?.user) {
            api.setUser(res.user);
            setUser(res.user);
          }
        })
        .catch(() => {});
      return;
    }

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
  }, []);

  useEffect(() => {
    if (location.pathname === '/tinder-do-fluxo/matches' && !user) {
      const u = api.getUser();
      if (u) setUser(u);
    }
  }, [location.pathname, user]);

  if (isChecking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div className="loading-spinner" />
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</div>
      </div>
    );
  }

  const isMatchesPage = location.pathname === '/tinder-do-fluxo/matches';
  if (!user) {
    if (isMatchesPage) return <>{children}</>;
    const retryUser = api.getUser();
    if (retryUser) {
      setUser(retryUser);
      return null;
    }
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={redirectTo || getMainDashboardPath(user.role)} replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo || getMainDashboardPath(user.role)} replace />;
  }

  // Check profile requirement (except for profile page itself)
  if (!skipProfileCheck) {
    return <ProfileRequired user={user}>{children}</ProfileRequired>;
  }

  return <>{children}</>;
}
