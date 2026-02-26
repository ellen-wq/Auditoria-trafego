import AppLayout from '../components/AppLayout';

export default function AuditoriaCopyHistoricoPage() {
  return (
    <AppLayout breadcrumbs={[
      { label: 'Auditoria de Copy', href: '/auditoria-copy/historico' },
      { label: 'Histórico' },
    ]}>
      <h1 className="page-title">Auditoria de Copy - Histórico</h1>
      <p className="page-subtitle">Acompanhe o histórico das auditorias de copy realizadas.</p>

      <div className="card">
        <p>Em breve você verá aqui a linha do tempo completa das análises de copy.</p>
      </div>
    </AppLayout>
  );
}
