import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import type { User } from '../services/api';
import ProfileRequired from './ProfileRequired';

interface AuthMeResponse {
  user: User;
  hasProfile?: boolean;
  profileRequired?: boolean;
}

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
  const state = location.state as { fromLogin?: boolean; user?: User } | null;
  const userFromLogin = state?.fromLogin && state?.user ? state.user : null;

  const cachedUser = (() => {
    try {
      return api.getUser();
    } catch {
      return null;
    }
  })();

  const needsProfileCheck = !skipProfileCheck && cachedUser?.role !== 'LIDERANCA' && userFromLogin?.role !== 'LIDERANCA';

  const [user, setUser] = useState<User | null>(() => userFromLogin ?? cachedUser ?? null);
  const [hasProfileFromMe, setHasProfileFromMe] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(() => {
    if (userFromLogin && !needsProfileCheck) return false;
    if (userFromLogin && needsProfileCheck) return true;
    if (cachedUser && !needsProfileCheck) return false;
    if (cachedUser && needsProfileCheck) return true;
    return true;
  });

  useEffect(() => {
    if (userFromLogin) {
      api.setUser(userFromLogin);
      setUser(userFromLogin);
      if (!needsProfileCheck) setIsChecking(false);
      api.get<AuthMeResponse>('/api/auth/me')
        .then((res) => {
          if (res?.user) {
            api.setUser(res.user);
            setUser(res.user);
            if (res.hasProfile !== undefined) setHasProfileFromMe(res.hasProfile);
          }
          setIsChecking(false);
        })
        .catch(() => {
          setIsChecking(false);
        });
      return;
    }

    if (cachedUser) {
      setUser(cachedUser);
      if (!needsProfileCheck) setIsChecking(false);
      api.get<AuthMeResponse>('/api/auth/me')
        .then((res) => {
          if (res?.user) {
            api.setUser(res.user);
            setUser(res.user);
            if (res.hasProfile !== undefined) setHasProfileFromMe(res.hasProfile);
          }
          setIsChecking(false);
        })
        .catch(() => {
          setIsChecking(false);
        });
      return;
    }

    let mounted = true;
    const timeoutId = setTimeout(() => {
      if (mounted) {
        const cached = api.getUser();
        setUser(cached);
        setIsChecking(false);
      }
    }, 3000);

    api.get<AuthMeResponse>('/api/auth/me')
      .then((res) => {
        clearTimeout(timeoutId);
        if (!mounted) return;
        if (res?.user) {
          api.setUser(res.user);
          setUser(res.user);
          if (res.hasProfile !== undefined) setHasProfileFromMe(res.hasProfile);
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
    return (
      <ProfileRequired user={user} initialHasProfile={hasProfileFromMe ?? undefined}>
        {children}
      </ProfileRequired>
    );
  }

  return <>{children}</>;
}
