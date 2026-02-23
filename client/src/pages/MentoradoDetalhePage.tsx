import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import AppLayout from '../components/AppLayout';

interface UserDetail {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface AuditItem {
  id: number;
  created_at: string;
  original_filename: string;
  product_value: number;
  campaign_count: number;
  scalable_count: number;
  optimize_count: number;
  attention_count: number;
}

interface UserAuditsResponse {
  user: UserDetail;
  audits: AuditItem[];
}

export default function MentoradoDetalhePage() {
  const { id: userId } = useParams<{ id: string }>();
  const [data, setData] = useState<UserAuditsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await api.get<UserAuditsResponse>('/api/admin/users/' + userId + '/audits');
        setData(result);
      } catch (err) {
        console.error('Erro ao carregar detalhe do mentorado:', err);
      } finally {
        setLoading(false);
      }
    }
    if (userId) load();
  }, [userId]);

  return (
    <AppLayout breadcrumbs={[
      { label: 'Gestão' },
      { label: 'Mentorados', href: '/admin/mentorados' },
      { label: 'Detalhe' }
    ]}>
      <div style={{ marginBottom: 16 }}>
        <Link to="/admin/mentorados" className="btn btn-sm btn-outline">
          ← Voltar para Mentorados
        </Link>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="loading-spinner" />
        </div>
      )}

      {!loading && data && (
        <>
          {/* Info do usuário */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="sidebar-avatar" style={{ width: 48, height: 48, fontSize: 18 }}>
                {data.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{data.user.name}</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 2 }}>{data.user.email}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Membro desde {formatDate(data.user.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Auditorias */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Auditorias</h3>
              <span className="badge badge-info">{data.audits.length} auditoria(s)</span>
            </div>
            <div className="table-wrapper">
              {data.audits.length > 0 ? (
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
                    {data.audits.map((a) => (
                      <tr key={a.id}>
                        <td>{formatDate(a.created_at)}</td>
                        <td>{a.original_filename || '-'}</td>
                        <td>{formatCurrency(a.product_value || 0)}</td>
                        <td>{a.campaign_count || 0}</td>
                        <td><span className="badge badge-s1">{a.scalable_count || 0}</span></td>
                        <td><span className="badge badge-s2">{a.optimize_count || 0}</span></td>
                        <td><span className="badge badge-s3">{a.attention_count || 0}</span></td>
                        <td>
                          <Link to={`/app/resultado/${a.id}`} className="btn btn-sm btn-outline">
                            Ver resultado
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <p>Este mentorado ainda não possui auditorias.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
