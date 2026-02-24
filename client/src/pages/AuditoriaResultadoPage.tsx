import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { api } from '../services/api';
import { formatCurrency, formatPercent, formatDate } from '../utils/format';

interface Campaign {
  id: number;
  campaign_name: string;
  spend: number;
  ctr_link: number;
  cpc: number;
  lp_views: number;
  lp_rate: number;
  checkouts: number;
  purchases: number;
  cpa: number;
  scenario: number;
  recommendations?: Array<{
    title: string;
    message: string;
    steps_json: string;
  }>;
}

interface Recommendation {
  scenario: number;
  title: string;
  campaigns: string[];
  steps: string[];
}

interface AuditData {
  id: number;
  filename: string;
  product_price: number;
  product_type: string;
  created_at: string;
  campaigns: Campaign[];
  recommendations: Recommendation[];
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  low_ticket: 'Low Ticket',
  mid_ticket: 'Middle Ticket',
};

const SCENARIO_CONFIG: Record<number, { label: string; badge: string; cardClass: string }> = {
  1: { label: 'Escalável', badge: 'badge-s1', cardClass: 'scenario-1' },
  2: { label: 'Otimizar', badge: 'badge-s2', cardClass: 'scenario-2' },
  3: { label: 'Atenção', badge: 'badge-s3', cardClass: 'scenario-3' },
};

export default function AuditoriaResultadoPage() {
  const { id: routeId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const id = routeId ?? searchParams.get('id');

  const [audit, setAudit] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recomendacoes' | 'metricas'>('recomendacoes');

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    api.get<AuditData>(`/api/audits/${id}`)
      .then((data: any) => {
        const apiAudit = data?.audit || {};
        const apiCampaigns: Campaign[] = data?.campaigns || [];

        const grouped = new Map<number, Recommendation>();
        for (const c of apiCampaigns) {
          const firstRec = c.recommendations?.[0];
          if (!firstRec) continue;

          if (!grouped.has(c.scenario)) {
            let steps: string[] = [];
            try {
              steps = JSON.parse(firstRec.steps_json || '[]');
            } catch {
              steps = [];
            }
            grouped.set(c.scenario, {
              scenario: c.scenario,
              title: firstRec.title,
              campaigns: [c.campaign_name],
              steps
            });
          } else {
            grouped.get(c.scenario)!.campaigns.push(c.campaign_name);
          }
        }

        setAudit({
          id: apiAudit.id,
          filename: apiAudit.filename,
          product_price: apiAudit.product_price,
          product_type: apiAudit.product_type,
          created_at: apiAudit.created_at,
          campaigns: apiCampaigns,
          recommendations: Array.from(grouped.values())
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const stats = useMemo(() => {
    if (!audit) return null;
    const campaigns = audit.campaigns ?? [];
    const totalSpend = campaigns.reduce((s, c) => s + (c.spend || 0), 0);
    const totalPurchases = campaigns.reduce((s, c) => s + (c.purchases || 0), 0);
    const revenue = totalPurchases * audit.product_price;
    const roas = totalSpend > 0 ? revenue / totalSpend : 0;
    const avgCtr = campaigns.length > 0
      ? campaigns.reduce((s, c) => s + (c.ctr_link || 0), 0) / campaigns.length
      : 0;
    const withPurchases = campaigns.filter((c) => c.purchases > 0);
    const avgCpa = withPurchases.length > 0
      ? withPurchases.reduce((s, c) => s + (c.cpa || 0), 0) / withPurchases.length
      : 0;
    return { totalSpend, totalPurchases, revenue, roas, avgCtr, avgCpa, total: campaigns.length };
  }, [audit]);

  const user = api.getUser();

  const exportExcel = useCallback(() => {
    if (!audit) return;
    const loadXlsx = () => {
      if ((window as any).XLSX) return Promise.resolve((window as any).XLSX);
      return new Promise<any>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js';
        script.onload = () => resolve((window as any).XLSX);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    loadXlsx().then((XLSX) => {
      const rows = audit.campaigns.map((c: Campaign) => ({
        ROAS: c.spend > 0 ? ((c.purchases || 0) * (audit.product_price || 0)) / c.spend : 0,
        Campanha: c.campaign_name,
        Gasto: c.spend,
        CTR: c.ctr_link,
        CPC: c.cpc,
        'Vis. Página': c.lp_views,
        'Taxa Vis. Página': c.lp_rate,
        Checkouts: c.checkouts,
        Compras: c.purchases,
        CPA: c.cpa,
        Status: SCENARIO_CONFIG[c.scenario]?.label ?? '-',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Métricas');
      XLSX.writeFile(wb, `auditoria_${audit.id}.xlsx`);
    }).catch(() => {
      alert('Não foi possível carregar a biblioteca de exportação.');
    });
  }, [audit]);

  if (loading) {
    return (
      <AppLayout breadcrumbs={[
        { label: 'Análises', href: '/app/upload' },
        { label: 'Auditoria de Tráfego', href: '/app/upload' },
        { label: 'Resultado' },
      ]}>
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="loading-spinner" />
        </div>
      </AppLayout>
    );
  }

  if (!audit) {
    return (
      <AppLayout breadcrumbs={[
        { label: 'Análises', href: '/app/upload' },
        { label: 'Resultado' },
      ]}>
        <div className="empty-state">
          <h3>Auditoria não encontrada</h3>
          <p>Verifique o link ou faça uma nova auditoria.</p>
          <Link to="/app/upload" className="btn btn-primary" style={{ width: 'auto', display: 'inline-flex' }}>
            Nova Auditoria
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={[
      { label: 'Análises', href: '/app/upload' },
      { label: 'Auditoria de Tráfego', href: '/app/upload' },
      { label: 'Resultado' },
    ]}>
      <h1 className="page-title">Resultado da Auditoria</h1>
      <p className="page-subtitle">
        {formatDate(audit.created_at)} — {PRODUCT_TYPE_LABELS[audit.product_type] ?? audit.product_type}
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, marginTop: -16 }}>
        Arquivo: {audit.filename}
      </p>

      {/* Banner KPIs */}
      <div className="banner-card">
        <div className="banner-kpis">
          <div className="banner-kpi">
            <div className="banner-kpi-value">{formatCurrency(stats!.revenue)}</div>
            <div className="banner-kpi-label">Faturamento Bruto</div>
          </div>
          <div className="banner-kpi">
            <div className="banner-kpi-value">{stats!.totalPurchases}</div>
            <div className="banner-kpi-label">Total de Compras</div>
          </div>
          <div className="banner-kpi">
            <div className="banner-kpi-value">{formatCurrency(audit.product_price)}</div>
            <div className="banner-kpi-label">Valor do Produto</div>
          </div>
          <div className="banner-kpi">
            <div className="banner-kpi-value">{stats!.roas.toFixed(2)}x</div>
            <div className="banner-kpi-label">ROAS</div>
          </div>
          <div className="banner-kpi">
            <div className="banner-kpi-value">{formatCurrency(stats!.avgCpa)}</div>
            <div className="banner-kpi-label">CPA Médio</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">Total Campanhas</div>
          <div className="stat-value">{stats!.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Gasto Total</div>
          <div className="stat-value">{formatCurrency(stats!.totalSpend)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">CTR Médio</div>
          <div className="stat-value">{formatPercent(stats!.avgCtr)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab${activeTab === 'recomendacoes' ? ' active' : ''}`}
          onClick={() => setActiveTab('recomendacoes')}
        >
          Recomendações
        </button>
        <button
          className={`tab${activeTab === 'metricas' ? ' active' : ''}`}
          onClick={() => setActiveTab('metricas')}
        >
          Métricas
        </button>
      </div>

      {/* Recommendations Tab */}
      {activeTab === 'recomendacoes' && (
        <div>
          {(audit.recommendations ?? []).map((rec, idx) => {
            const cfg = SCENARIO_CONFIG[rec.scenario] ?? SCENARIO_CONFIG[3];
            return (
              <div key={idx} className={`rec-card ${cfg.cardClass}`}>
                <div className="rec-title">
                  <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                  {rec.title}
                </div>
                <div className="rec-message">
                  <strong>Campanhas:</strong>
                  <div style={{ marginTop: 8 }}>
                    {rec.campaigns.map((campaign, campaignIdx) => (
                      <div key={`${campaign}-${campaignIdx}`}>{campaign}</div>
                    ))}
                  </div>
                </div>
                <ol className="rec-steps">
                  {rec.steps.map((step, si) => (
                    <li key={si}>{step}</li>
                  ))}
                </ol>
              </div>
            );
          })}

          {(audit.recommendations ?? []).length === 0 && (
            <div className="empty-state">
              <h3>Nenhuma recomendação disponível</h3>
            </div>
          )}
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === 'metricas' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table className="metrics-table">
              <thead>
                <tr>
                  <th>Campanha</th>
                  <th>Gasto</th>
                  <th>CTR</th>
                  <th>CPC</th>
                  <th>Vis. Página</th>
                  <th>Taxa Vis. Página</th>
                  <th>Checkouts</th>
                  <th>Compras</th>
                  <th>CPA</th>
                  <th>ROAS</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {audit.campaigns.map((c, i) => {
                  const cfg = SCENARIO_CONFIG[c.scenario] ?? SCENARIO_CONFIG[3];
                  const roas = c.spend > 0 ? ((c.purchases || 0) * (audit.product_price || 0)) / c.spend : 0;
                  return (
                    <tr key={i}>
                      <td>{c.campaign_name}</td>
                      <td>{formatCurrency(c.spend)}</td>
                      <td>{formatPercent(c.ctr_link)}</td>
                      <td>{formatCurrency(c.cpc)}</td>
                      <td>{c.lp_views}</td>
                      <td>{formatPercent(c.lp_rate)}</td>
                      <td>{c.checkouts}</td>
                      <td>{c.purchases}</td>
                      <td>{c.cpa > 0 ? formatCurrency(c.cpa) : '-'}</td>
                      <td>{roas > 0 ? `${roas.toFixed(2)}x` : '-'}</td>
                      <td><span className={`badge ${cfg.badge}`}>{cfg.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
        <Link to="/app/upload" className="btn btn-primary" style={{ width: 'auto' }}>
          Nova Auditoria
        </Link>
        <Link to="/app/historico" className="btn btn-secondary">
          Voltar ao Histórico
        </Link>
        <button className="btn btn-outline" onClick={() => window.print()}>
          Imprimir Relatório
        </button>
        {user?.role === 'LIDERANCA' && (
          <button className="btn btn-outline" onClick={exportExcel}>
            Exportar Excel
          </button>
        )}
      </div>
    </AppLayout>
  );
}
