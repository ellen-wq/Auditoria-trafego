import { useEffect, useState } from 'react';
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

  useEffect(() => {
    // LIDERANCA doesn't need a profile
    if (user?.role === 'LIDERANCA') {
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
        console.error('[ProfileRouterPage] Erro ao verificar perfil:', err);
        setIsChecking(false);
        // On error, assume profile doesn't exist to show form
        setHasProfile(false);
      });
  }, [user?.role]);

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
