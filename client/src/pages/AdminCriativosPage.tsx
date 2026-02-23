import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import AppLayout from '../components/AppLayout';

interface CreativeEntry {
  id: number;
  user_name: string;
  created_at: string;
  campaign_name: string;
  spend: number;
  ctr: number;
  purchases: number;
  cpa: number;
  impressions: number;
  lp_views: number;
  copy_text: string | null;
  video_url: string | null;
  top_strengths: string[];
}

interface CreativesResponse {
  entries: CreativeEntry[];
  strengths: {
    patterns: string[];
  } | null;
}

export default function AdminCriativosPage() {
  const [data, setData] = useState<CreativesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterProductType, setFilterProductType] = useState('');

  function buildQueryString() {
    const params: string[] = [];
    if (filterFrom) params.push('from=' + encodeURIComponent(filterFrom));
    if (filterTo) params.push('to=' + encodeURIComponent(filterTo));
    if (filterProductType) params.push('product_type=' + encodeURIComponent(filterProductType));
    return params.length ? '?' + params.join('&') : '';
  }

  async function fetchData() {
    setLoading(true);
    try {
      const qs = buildQueryString();
      const result = await api.get<CreativesResponse>('/api/creatives/all' + qs);
      setData(result);
    } catch (err) {
      console.error('Erro ao carregar criativos:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  function handleFilter() { fetchData(); }

  function handleClear() {
    setFilterFrom('');
    setFilterTo('');
    setFilterProductType('');
    setTimeout(() => fetchData(), 0);
  }

  function formatCtr(val: number) {
    return val > 0 ? (val * 100).toFixed(2).replace('.', ',') + '%' : '0%';
  }

  return (
    <AppLayout breadcrumbs={[
      { label: 'Dashboard', href: '/admin/dashboard' },
      { label: 'Criativos dos Mentorados' }
    ]}>
      <h1 className="page-title">Criativos dos Mentorados</h1>
      <p className="page-subtitle">Análise de criativos de todos os mentorados</p>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="filter-from">De</label>
            <input
              type="date"
              id="filter-from"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="filter-to">Até</label>
            <input
              type="date"
              id="filter-to"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="filter-product-type">Tipo de Produto</label>
            <select
              id="filter-product-type"
              value={filterProductType}
              onChange={(e) => setFilterProductType(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="infoproduto">Infoproduto</option>
              <option value="ecommerce">E-commerce</option>
              <option value="servico">Serviço</option>
            </select>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleFilter}>Filtrar</button>
          <button className="btn btn-outline" onClick={handleClear}>Limpar</button>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="loading-spinner" />
        </div>
      )}

      {!loading && data && (
        <>
          {/* Strengths Card */}
          {data.strengths && data.strengths.patterns.length > 0 && (
            <div className="strengths-card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                Padrões Identificados nos Criativos
              </h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {data.strengths.patterns.map((p, i) => (
                  <li key={i} style={{ marginBottom: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Entries */}
          {data.entries.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <h3>Nenhum criativo encontrado</h3>
              <p>Ajuste os filtros ou aguarde novas análises.</p>
            </div>
          )}

          {data.entries.map((entry) => (
            <div key={entry.id} className="creative-entry">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <strong style={{ fontSize: 14 }}>{entry.user_name}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 12 }}>
                    {formatDate(entry.created_at)}
                  </span>
                </div>
              </div>

              {entry.campaign_name && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  Campanha: <strong>{entry.campaign_name}</strong>
                </p>
              )}

              {/* Metric pills */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                <span className="badge badge-info">Gasto: {formatCurrency(entry.spend || 0)}</span>
                <span className="badge badge-accent">CTR: {formatCtr(entry.ctr)}</span>
                <span className="badge badge-s1">Compras: {entry.purchases || 0}</span>
                <span className="badge badge-s2">CPA: {formatCurrency(entry.cpa || 0)}</span>
                <span className="badge" style={{ background: 'var(--purple-light)', color: 'var(--purple)' }}>
                  Impressões: {(entry.impressions || 0).toLocaleString('pt-BR')}
                </span>
                <span className="badge" style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>
                  Vis. LP: {(entry.lp_views || 0).toLocaleString('pt-BR')}
                </span>
              </div>

              {/* Copy preview */}
              {entry.copy_text && (
                <div style={{
                  maxHeight: 80,
                  overflow: 'hidden',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-main)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-xs)',
                  marginBottom: 10,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {entry.copy_text}
                </div>
              )}

              {/* Video link */}
              {entry.video_url && (
                <p style={{ marginBottom: 10 }}>
                  <a href={entry.video_url} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--blue)', fontSize: 12, fontWeight: 500 }}>
                    Assistir vídeo ↗
                  </a>
                </p>
              )}

              {/* Top strengths */}
              {entry.top_strengths && entry.top_strengths.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--green)', marginRight: 6 }}>Pontos fortes:</strong>
                  {entry.top_strengths.slice(0, 3).join(' · ')}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </AppLayout>
  );
}
