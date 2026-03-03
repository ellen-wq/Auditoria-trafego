import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import ProfileFormPage from './ProfileFormPage';
import ProfileViewPage from './ProfileViewPage';
import TinderDoFluxoPageShell from '../components/tinder-do-fluxo/TinderDoFluxoPageShell';

export default function ProfileRouterPage() {
  const user = api.getUser();
  const [searchParams] = useSearchParams();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const forceEdit = searchParams.get('edit') === 'true';

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
        console.error('[ProfileRouterPage] Erro ao verificar perfil:', err);
        setIsChecking(false);
        setCheckError(err?.message || 'Erro ao verificar perfil. Verifique sua conexão.');
        setHasProfile(false);
      });
  }, []);

  useEffect(() => {
    // LIDERANCA doesn't need a profile
    if (user?.role === 'LIDERANCA') {
      setHasProfile(true);
      setIsChecking(false);
      return;
    }
    if (user) checkProfile();
  }, [user?.role, user, checkProfile]);

  if (isChecking) {
    return (
      <TinderDoFluxoPageShell title="Meu Perfil">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column', gap: 16 }}>
          <div className="loading-spinner" />
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Verificando perfil...</div>
        </div>
      </TinderDoFluxoPageShell>
    );
  }

  if (checkError) {
    return (
      <TinderDoFluxoPageShell title="Meu Perfil">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 360 }}>{checkError}</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-outline" onClick={checkProfile}>Tentar novamente</button>
            <button className="btn btn-primary" onClick={() => api.logout()}>Fazer logout</button>
          </div>
        </div>
      </TinderDoFluxoPageShell>
    );
  }

  // Se forceEdit=true, sempre mostrar formulário (mesmo que perfil exista)
  if (forceEdit) {
    return <ProfileFormPage />;
  }

  // Se o perfil existe, mostrar Profile View
  if (hasProfile) {
    return <ProfileViewPage />;
  }

  // Se não existe, mostrar formulário de criação
  return <ProfileFormPage />;
}
