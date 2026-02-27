import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { User } from '../services/api';

interface ProfileRequiredProps {
  children: React.ReactNode;
  user: User;
}

export default function ProfileRequired({ children, user }: ProfileRequiredProps) {
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // LIDERANCA doesn't need a profile
    if (user.role === 'LIDERANCA') {
      setHasProfile(true);
      setIsChecking(false);
      return;
    }

    // Check if profile exists
    api.get<{ hasProfile: boolean; profileRequired: boolean }>('/api/tinder-do-fluxo/profile-check')
      .then((res) => {
        setHasProfile(res.hasProfile);
        setIsChecking(false);
      })
      .catch((err) => {
        console.error('[ProfileRequired] Erro ao verificar perfil:', err);
        setIsChecking(false);
        // On error, assume profile doesn't exist to be safe
        setHasProfile(false);
      });
  }, [user.role]);

  if (isChecking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div className="loading-spinner" />
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Verificando perfil...</div>
      </div>
    );
  }

  // LIDERANCA always has access
  if (user.role === 'LIDERANCA') {
    return <>{children}</>;
  }

  // If profile doesn't exist, redirect to profile creation
  if (!hasProfile) {
    return <Navigate to="/tinder-do-fluxo/perfil" replace />;
  }

  return <>{children}</>;
}
