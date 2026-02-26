import AppLayout from '../components/AppLayout';

export default function AuditoriaCopySolicitacoesPage() {
  return (
    <AppLayout breadcrumbs={[
      { label: 'Auditoria de Copy', href: '/auditoria-copy/solicitacoes' },
      { label: 'Solicitações' },
    ]}>
      <h1 className="page-title">Auditoria de Copy - Solicitações</h1>
      <p className="page-subtitle">Gerencie pedidos de auditoria de copy em um único lugar.</p>

      <div className="card">
        <p>Em breve você poderá criar e acompanhar solicitações diretamente nesta página.</p>
      </div>
    </AppLayout>
  );
}
