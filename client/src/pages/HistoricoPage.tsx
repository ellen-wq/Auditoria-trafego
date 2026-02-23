import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { api } from '../services/api';
import { formatDate, formatCurrency } from '../utils/format';

interface AuditSummary {
  id: number;
  original_filename: string;
  product_price: number;
  product_type: string;
  created_at: string;
  campaigns: Campaign[];
}

interface Campaign {
  scenario: number;
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  low_ticket: 'Low Ticket',
  mid_ticket: 'Middle Ticket',
};

export default function HistoricoPage() {
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    api.get<AuditSummary[]>('/api/audits')
      .then(setAudits)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return audits.filter((a) => {
      if (dateFrom && new Date(a.created_at) < new Date(dateFrom)) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(a.created_at) > end) return false;
      }
      if (filterType && a.product_type !== filterType) return false;
      return true;
    });
  }, [audits, dateFrom, dateTo, filterType]);

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setFilterType('');
  };

  const countByScenario = (campaigns: Campaign[], scenario: number) =>
    campaigns.filter((c) => c.scenario === scenario).length;

  return (
    <AppLayout breadcrumbs={[
      { label: 'Análises', href: '/app/upload' },
      { label: 'Histórico' },
    ]}>
      <h1 className="page-title">Histórico de Auditorias</h1>
      <p className="page-subtitle">Visualize todas as auditorias realizadas</p>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="dateFrom">Data de</label>
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="dateTo">Data até</label>
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="filterType">Tipo de Produto</label>
            <select
              id="filterType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="low_ticket">Low Ticket</option>
              <option value="mid_ticket">Middle Ticket</option>
            </select>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
            Limpar
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="loading-spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3>Nenhuma auditoria encontrada</h3>
          <p>Faça sua primeira auditoria para ver os resultados aqui.</p>
          <Link to="/app/upload" className="btn btn-primary" style={{ width: 'auto', display: 'inline-flex' }}>
            Nova Auditoria
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Arquivo</th>
                  <th>Valor Produto</th>
                  <th>Campanhas</th>
                  <th>Escalável</th>
                  <th>Otimizar</th>
                  <th>Atenção</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td>{formatDate(a.created_at)}</td>
                    <td>{a.original_filename}</td>
                    <td>{formatCurrency(a.product_price)}</td>
                    <td>{a.campaigns?.length ?? 0}</td>
                    <td>
                      <span className="badge badge-s1">
                        {countByScenario(a.campaigns ?? [], 1)}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-s2">
                        {countByScenario(a.campaigns ?? [], 2)}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-s3">
                        {countByScenario(a.campaigns ?? [], 3)}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/app/resultado?id=${a.id}`}
                        className="btn btn-outline btn-sm"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
