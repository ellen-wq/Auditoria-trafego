import React, { useMemo } from 'react';
import AppLayout from '../AppLayout';

export interface TinderDoFluxoPageShellProps {
  title: string;
  subtitle?: string;
  /** Conteúdo à direita do título (ex.: abas). Quando definido, título e subtitle ficam à esquerda em linha (md). */
  headerRight?: React.ReactNode;
  children?: React.ReactNode;
}

export default function TinderDoFluxoPageShell({ title, subtitle, headerRight, children }: TinderDoFluxoPageShellProps) {
  const breadcrumbs = useMemo(() => ([
    { label: 'Tinder do Fluxo' },
    { label: title }
  ]), [title]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      {headerRight != null ? (
        <div className="vagas-header-row">
          <div>
            <h1 className="vagas-title">{title}</h1>
            {subtitle != null && subtitle !== '' && <p className="vagas-subtitle">{subtitle}</p>}
          </div>
          {headerRight}
        </div>
      ) : (
        <>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </>
      )}
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
