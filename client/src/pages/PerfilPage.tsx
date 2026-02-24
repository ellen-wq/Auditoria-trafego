import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../services/api';
import { formatDate } from '../utils/format';

interface Profile {
  id: number;
  name: string;
  email: string;
  role: 'MENTORADO' | 'LIDERANCA';
  created_at?: string;
}

const ROLE_LABELS: Record<string, string> = {
  MENTORADO: 'Mentorado',
  LIDERANCA: 'Liderança',
};

export default function PerfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ user: Profile }>('/api/auth/me')
      .then((data) => setProfile(data.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout breadcrumbs={[
      { label: 'Configurações' },
      { label: 'Perfil' },
    ]}>
      <h1 className="page-title">Meu Perfil</h1>
      <p className="page-subtitle">Informações da sua conta</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="loading-spinner" />
        </div>
      ) : profile ? (
        <div className="card" style={{ maxWidth: 520 }}>
          <div className="form-group">
            <label>Nome</label>
            <input type="text" value={profile.name} readOnly />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="text" value={profile.email} readOnly />
          </div>
          <div className="form-group">
            <label>Função</label>
            <input type="text" value={ROLE_LABELS[profile.role] ?? profile.role} readOnly />
          </div>
          <div className="form-group">
            <label>Membro desde</label>
            <input type="text" value={formatDate(profile.created_at)} readOnly />
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <h3>Não foi possível carregar o perfil</h3>
        </div>
      )}
    </AppLayout>
  );
}
