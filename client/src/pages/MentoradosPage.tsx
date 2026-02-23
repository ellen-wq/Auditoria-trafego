import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatDate } from '../utils/format';
import AppLayout from '../components/AppLayout';

interface MentoradoUser {
  id: number;
  name: string;
  email: string;
  audit_count: number;
  last_audit_date: string | null;
}

export default function MentoradosPage() {
  const [users, setUsers] = useState<MentoradoUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get<MentoradoUser[]>('/api/admin/users');
        setUsers(data);
      } catch (err) {
        console.error('Erro ao carregar mentorados:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <AppLayout breadcrumbs={[{ label: 'Gestão' }, { label: 'Mentorados' }]}>
      <h1 className="page-title">Mentorados</h1>
      <p className="page-subtitle">Gerencie todos os mentorados da plataforma</p>

      {loading && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="loading-spinner" />
        </div>
      )}

      {!loading && users.length === 0 && (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <h3>Nenhum mentorado encontrado</h3>
          <p>Ainda não há mentorados cadastrados.</p>
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Auditorias</th>
                  <th>Última Auditoria</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>{u.audit_count}</td>
                    <td>{formatDate(u.last_audit_date)}</td>
                    <td>
                      <Link to={`/admin/mentorados/${u.id}`} className="btn btn-sm btn-outline">
                        Ver auditorias
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
