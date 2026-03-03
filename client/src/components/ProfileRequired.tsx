import { useCallback, useEffect, useState } from 'react';
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

  const [checkError, setCheckError] = useState<string | null>(null);

  const checkProfile = useCallback(() => {
    setCheckError(null);
    setIsChecking(true);
    api.get<{ hasProfile: boolean; profileRequired: boolean }>('/api/tinder-do-fluxo/profile-check')
      .then((res) => {
        setHasProfile(res.hasProfile);
        setIsChecking(false);
      })
      .catch((err) => {
        console.error('[ProfileRequired] Erro ao verificar perfil:', err);
        setIsChecking(false);
        setCheckError(err?.message || 'Erro ao verificar perfil. Verifique sua conexão.');
        setHasProfile(false);
      });
  }, []);

  useEffect(() => {
    // LIDERANCA doesn't need a profile
    if (user.role === 'LIDERANCA') {
      setHasProfile(true);
      setIsChecking(false);
      return;
    }
    checkProfile();
  }, [user.role, checkProfile]);

  if (isChecking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div className="loading-spinner" />
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Verificando perfil...</div>
      </div>
    );
  }

  if (checkError) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 360 }}>{checkError}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" onClick={checkProfile}>Tentar novamente</button>
          <button className="btn btn-primary" onClick={() => api.logout()}>Fazer logout</button>
        </div>
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
