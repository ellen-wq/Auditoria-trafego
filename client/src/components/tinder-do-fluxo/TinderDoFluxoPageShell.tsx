import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../AppLayout';
import { api } from '../../services/api';
import TinderDoFluxoTutorialModal from './TinderDoFluxoTutorialModal';

interface Props {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function TinderDoFluxoPageShell({ title, subtitle, children }: Props) {
  const user = api.getUser();
  const role = (user?.role || 'MENTORADO') as 'MENTORADO' | 'PRESTADOR' | 'LIDERANCA';
  const [showTutorial, setShowTutorial] = useState(false);
  const [checkedTutorial, setCheckedTutorial] = useState(false);

  const breadcrumbs = useMemo(() => ([
    { label: 'Tinder do Fluxo' },
    { label: title }
  ]), [title]);

  useEffect(() => {
    let mounted = true;
    api.get<{ hasSeen: boolean }>('/api/tinder-do-fluxo/tutorial-status')
      .then((res) => {
        if (!mounted) return;
        setShowTutorial(!res.hasSeen);
      })
      .catch(() => {
        if (!mounted) return;
        setShowTutorial(false);
      })
      .finally(() => {
        if (mounted) setCheckedTutorial(true);
      });
    return () => { mounted = false; };
  }, []);

  const finishTutorial = async () => {
    setShowTutorial(false);
    try {
      await api.post('/api/tinder-do-fluxo/tutorial-status', { hasSeen: true });
    } catch {
      // Não bloqueia uso da tela.
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
      {children || (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Em construção</span>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            Esta área do Tinder do Fluxo está pronta para integração do fluxo completo.
          </p>
        </div>
      )}
      {checkedTutorial && (
        <TinderDoFluxoTutorialModal role={role} open={showTutorial} onClose={finishTutorial} />
      )}
    </AppLayout>
  );
}
