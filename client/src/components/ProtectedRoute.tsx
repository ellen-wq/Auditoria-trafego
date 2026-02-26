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
  const [user, setUser] = useState<User | null>(() => api.getUser());
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(() => !api.getUser());

  useEffect(() => {
    let mounted = true;
    if (!isCheckingSession) return;

    api.get<{ user: User }>('/api/auth/me')
      .then((res) => {
        if (!mounted) return;
        if (res?.user) {
          api.setUser(res.user);
          setUser(res.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
      })
      .finally(() => {
        if (mounted) setIsCheckingSession(false);
      });

    return () => {
      mounted = false;
    };
  }, [isCheckingSession]);

  if (isCheckingSession) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={redirectTo || getMainDashboardPath(user.role)} replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo || getMainDashboardPath(user.role)} replace />;
  }

  return <>{children}</>;
}
