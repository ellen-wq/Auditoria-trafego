import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { api } from '../services/api';
import { formatCurrency, formatPercent } from '../utils/format';

interface AuditOption {
  id: number;
  original_filename: string;
  created_at: string;
}

interface CampaignData {
  campaign_name: string;
  spend: number;
  ctr: number;
  purchases: number;
  cpa: number;
  impressions: number;
  landing_page_views: number;
}

interface CreativeItem {
  campaign_name: string;
  selected: boolean;
  copy: string;
  video_url: string;
}

interface AnalysisResult {
  campaign_name: string;
  pontos_fortes: string[];
  como_replicar: string[];
}

const styles = {
  creativeForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  creativeItem: {
    background: 'var(--bg-white)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius)',
    padding: 20,
  },
  campaignHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricPills: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
    marginBottom: 14,
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    background: 'var(--bg-main)',
    border: '1px solid var(--border-light)',
    color: 'var(--text-secondary)',
  },
  analysisCard: {
    background: 'var(--bg-white)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius)',
    padding: 20,
    marginBottom: 14,
  },
  analysisList: {
    listStyle: 'disc',
    paddingLeft: 20,
    fontSize: 13,
    lineHeight: 1.8,
    color: 'var(--text-primary)',
  },
};

export default function CriativosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const auditId = searchParams.get('audit_id');

  const [audits, setAudits] = useState<AuditOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [items, setItems] = useState<CreativeItem[]>([]);
  const [results, setResults] = useState<AnalysisResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingAudits, setLoadingAudits] = useState(!auditId);

  useEffect(() => {
    if (!auditId) {
      api.get<AuditOption[]>('/api/audits')
        .then(setAudits)
        .catch(() => {})
        .finally(() => setLoadingAudits(false));
    }
  }, [auditId]);

  useEffect(() => {
    if (!auditId) return;
    setLoading(true);
    setResults(null);
    api.get<CampaignData[]>(`/api/creatives/campaigns/${auditId}`)
      .then((data) => {
        setCampaigns(data);
        setItems(data.map((c) => ({
          campaign_name: c.campaign_name,
          selected: false,
          copy: '',
          video_url: '',
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [auditId]);

  const updateItem = useCallback((index: number, patch: Partial<CreativeItem>) => {
    setItems((prev) => prev.map((it, i) => i === index ? { ...it, ...patch } : it));
  }, []);

  const selectedCount = items.filter((i) => i.selected).length;

  const handleAnalyze = async () => {
    const selected = items
      .filter((i) => i.selected)
      .map(({ campaign_name, copy, video_url }) => ({ campaign_name, copy, video_url }));
    if (selected.length === 0) return;

    setAnalyzing(true);
    try {
      const data = await api.post<AnalysisResult[]>('/api/creatives', {
        audit_id: auditId,
        items: selected,
      });
      setResults(data);
    } catch {
      alert('Erro ao analisar criativos. Tente novamente.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectAudit = (id: string) => {
    if (id) setSearchParams({ audit_id: id });
  };

  return (
    <AppLayout breadcrumbs={[
      { label: 'Análises', href: '/app/upload' },
      { label: 'Engenharia Reversa' },
    ]}>
      <h1 className="page-title">Engenharia Reversa de Criativos</h1>
      <p className="page-subtitle">Analise seus melhores criativos e descubra como replicar</p>

      {/* Audit selector when no audit_id */}
      {!auditId && (
        <div className="card" style={{ maxWidth: 480 }}>
          <div className="card-header">
            <span className="card-title">Selecione uma Auditoria</span>
          </div>
          {loadingAudits ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <div className="loading-spinner" />
            </div>
          ) : audits.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <h3>Nenhuma auditoria encontrada</h3>
              <p>Faça uma auditoria primeiro.</p>
              <Link to="/app/upload" className="btn btn-primary" style={{ width: 'auto', display: 'inline-flex' }}>
                Nova Auditoria
              </Link>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="auditSelect">Auditoria</label>
              <select
                id="auditSelect"
                defaultValue=""
                onChange={(e) => handleSelectAudit(e.target.value)}
              >
                <option value="" disabled>Selecione...</option>
                {audits.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.original_filename} ({new Date(a.created_at).toLocaleDateString('pt-BR')})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Campaign list */}
      {auditId && loading && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="loading-spinner" />
        </div>
      )}

      {auditId && !loading && campaigns.length === 0 && (
        <div className="empty-state">
          <h3>Nenhuma campanha encontrada</h3>
        </div>
      )}

      {auditId && !loading && campaigns.length > 0 && !results && (
        <>
          <div style={styles.creativeForm}>
            {campaigns.map((camp, idx) => (
              <div key={idx} style={styles.creativeItem}>
                <div style={styles.campaignHeader}>
                  <strong style={{ fontSize: 14 }}>{camp.campaign_name}</strong>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={items[idx]?.selected ?? false}
                      onChange={(e) => updateItem(idx, { selected: e.target.checked })}
                    />
                    Incluir na análise
                  </label>
                </div>

                <div style={styles.metricPills}>
                  <span style={styles.pill}>Gasto: {formatCurrency(camp.spend)}</span>
                  <span style={styles.pill}>CTR: {formatPercent(camp.ctr)}</span>
                  <span style={styles.pill}>Compras: {camp.purchases}</span>
                  <span style={styles.pill}>CPA: {camp.cpa > 0 ? formatCurrency(camp.cpa) : '-'}</span>
                  <span style={styles.pill}>Impressões: {camp.impressions?.toLocaleString('pt-BR') ?? 0}</span>
                  <span style={styles.pill}>Vis. LP: {camp.landing_page_views}</span>
                </div>

                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label htmlFor={`copy-${idx}`}>Copy do criativo</label>
                  <textarea
                    id={`copy-${idx}`}
                    rows={3}
                    placeholder="Cole aqui o texto do anúncio..."
                    value={items[idx]?.copy ?? ''}
                    onChange={(e) => updateItem(idx, { copy: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: 13,
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor={`video-${idx}`}>Link do vídeo</label>
                  <input
                    id={`video-${idx}`}
                    type="url"
                    placeholder="https://..."
                    value={items[idx]?.video_url ?? ''}
                    onChange={(e) => updateItem(idx, { video_url: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn btn-primary"
            style={{ marginTop: 20 }}
            disabled={selectedCount === 0 || analyzing}
            onClick={handleAnalyze}
          >
            {analyzing ? 'Analisando...' : `Analisar Criativos (${selectedCount})`}
          </button>

          {analyzing && (
            <div className="loading-overlay active">
              <div className="loading-spinner" />
              <p>Analisando criativos, aguarde...</p>
            </div>
          )}
        </>
      )}

      {/* Analysis Results */}
      {results && (
        <div style={{ marginTop: 24 }}>
          <h2 className="section-title">Resultados da Análise</h2>
          {results.map((r, idx) => (
            <div key={idx} style={styles.analysisCard}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
                {r.campaign_name}
              </h3>

              <div style={{ marginBottom: 14 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--green)' }}>
                  Pontos Fortes
                </h4>
                <ul style={styles.analysisList}>
                  {r.pontos_fortes.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>

              <div>
                <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--blue)' }}>
                  Como Replicar
                </h4>
                <ul style={styles.analysisList}>
                  {r.como_replicar.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              className="btn btn-secondary"
              onClick={() => setResults(null)}
            >
              Voltar para seleção
            </button>
            <Link to="/app/upload" className="btn btn-outline">
              Nova Auditoria
            </Link>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
