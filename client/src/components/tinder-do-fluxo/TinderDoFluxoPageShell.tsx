import { useMemo } from 'react';
import AppLayout from '../AppLayout';

interface Props {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function TinderDoFluxoPageShell({ title, subtitle, children }: Props) {
  const breadcrumbs = useMemo(() => ([
    { label: 'Tinder do Fluxo' },
    { label: title }
  ]), [title]);

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
    </AppLayout>
  );
}
