import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import AppLayout from '../components/AppLayout';

interface SummaryData {
  totalMentorados: number;
  totalAuditorias: number;
  avgSpend: number;
  avgPurchases: number;
  avgCPA: number;
  avgRevenue: number;
  bestRoas: any[];
  worstRoas: any[];
  bestCtr: any[];
  worstCtr: any[];
  bestConv: any[];
  worstConv: any[];
  recentAudits: any[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<SummaryData | null>(null);
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
      const result = await api.get<SummaryData>('/api/admin/summary' + qs);
      setData(result);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
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

  function renderRoasRow(u: any, i: number) {
    const roasVal = (u.roas > 0) ? parseFloat(u.roas).toFixed(2).replace('.', ',') + 'x' : '0x';
    const cpaVal = (u.total_purchases > 0) ? (u.total_spend / u.total_purchases) : 0;
    return (
      <tr key={u.id}>
        <td><strong>{i + 1}º</strong></td>
        <td>{u.name}</td>
        <td><strong>{roasVal}</strong></td>
        <td>{formatCurrency(u.total_spend || 0)}</td>
        <td>{formatCurrency(u.total_revenue || 0)}</td>
        <td>{u.total_purchases || 0}</td>
        <td>{formatCurrency(cpaVal)}</td>
      </tr>
    );
  }

  function renderCtrRow(u: any, i: number) {
    const ctrVal = (u.ctr > 0) ? (parseFloat(u.ctr) * 100).toFixed(2).replace('.', ',') + '%' : '0%';
    return (
      <tr key={u.id}>
        <td><strong>{i + 1}º</strong></td>
        <td>{u.name}</td>
        <td><strong>{ctrVal}</strong></td>
        <td>{(u.total_clicks || 0).toLocaleString('pt-BR')}</td>
        <td>{(u.total_impressions || 0).toLocaleString('pt-BR')}</td>
      </tr>
    );
  }

  function renderConvRow(u: any, i: number) {
    const convVal = (u.conv_rate > 0) ? (parseFloat(u.conv_rate) * 100).toFixed(2).replace('.', ',') + '%' : '0%';
    return (
      <tr key={u.id}>
        <td><strong>{i + 1}º</strong></td>
        <td>{u.name}</td>
        <td><strong>{convVal}</strong></td>
        <td>{(u.total_purchases || 0).toLocaleString('pt-BR')}</td>
        <td>{(u.total_lp_views || 0).toLocaleString('pt-BR')}</td>
      </tr>
    );
  }

  const trendUp = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );

  const trendDown = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );

  const roasColGroup = (
    <colgroup>
      <col className="col-pos" style={{ width: '6%' }} />
      <col className="col-name" style={{ width: '26%' }} />
      <col className="col-val" style={{ width: '12%' }} />
      <col className="col-money" style={{ width: '18%' }} />
      <col className="col-money" style={{ width: '18%' }} />
      <col className="col-num" style={{ width: '10%' }} />
      <col className="col-money" style={{ width: '10%' }} />
    </colgroup>
  );

  const ctrColGroup = (
    <colgroup>
      <col className="col-pos" style={{ width: '8%' }} />
      <col className="col-name" style={{ width: '32%' }} />
      <col className="col-val" style={{ width: '20%' }} />
      <col className="col-num" style={{ width: '20%' }} />
      <col className="col-num" style={{ width: '20%' }} />
    </colgroup>
  );

  const convColGroup = (
    <colgroup>
      <col className="col-pos" style={{ width: '8%' }} />
      <col className="col-name" style={{ width: '32%' }} />
      <col className="col-val" style={{ width: '20%' }} />
      <col className="col-num" style={{ width: '20%' }} />
      <col className="col-num" style={{ width: '20%' }} />
    </colgroup>
  );

  return (
    <AppLayout breadcrumbs={[{ label: 'Gestão' }, { label: 'Dashboard Liderança' }]}>
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
          {/* Banner KPIs */}
          <div className="banner-card">
            <div className="banner-top">
              <div>
                <div className="banner-title">Painel de Liderança</div>
                <div className="banner-subtitle">Visão geral dos mentorados</div>
              </div>
            </div>
            <div className="banner-kpis">
              <div className="banner-kpi">
                <div className="banner-kpi-value">{data.totalMentorados}</div>
                <div className="banner-kpi-label">Total Mentorados</div>
              </div>
              <div className="banner-kpi">
                <div className="banner-kpi-value">{data.totalAuditorias}</div>
                <div className="banner-kpi-label">Total Auditorias</div>
              </div>
              <div className="banner-kpi">
                <div className="banner-kpi-value">{formatCurrency(data.avgSpend || 0)}</div>
                <div className="banner-kpi-label">Gasto Médio / Mentorado</div>
              </div>
              <div className="banner-kpi">
                <div className="banner-kpi-value">{(data.avgPurchases || 0).toFixed(1).replace('.', ',')}</div>
                <div className="banner-kpi-label">Compras Médias / Mentorado</div>
              </div>
              <div className="banner-kpi">
                <div className="banner-kpi-value">{formatCurrency(data.avgCPA || 0)}</div>
                <div className="banner-kpi-label">CPA Médio</div>
              </div>
              <div className="banner-kpi">
                <div className="banner-kpi-value">{formatCurrency(data.avgRevenue || 0)}</div>
                <div className="banner-kpi-label">Faturamento Médio / Mentorado</div>
              </div>
            </div>
          </div>

          {/* Rankings ROAS */}
          <h2 className="section-title">Rankings</h2>
          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div className="card">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {trendUp} Top 3 Melhor ROAS
              </div>
              <div className="table-wrapper">
                {data.bestRoas && data.bestRoas.length > 0 ? (
                  <table id="best-roas-table">
                    {roasColGroup}
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Mentorado</th>
                        <th>ROAS</th>
                        <th>Gasto</th>
                        <th>Faturamento</th>
                        <th>Compras</th>
                        <th>CPA</th>
                      </tr>
                    </thead>
                    <tbody>{data.bestRoas.map(renderRoasRow)}</tbody>
                  </table>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: 16, textAlign: 'center' }}>Sem dados suficientes</p>
                )}
              </div>
            </div>
            <div className="card">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {trendDown} Top 3 Pior ROAS
              </div>
              <div className="table-wrapper">
                {data.worstRoas && data.worstRoas.length > 0 ? (
                  <table id="worst-roas-table">
                    {roasColGroup}
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Mentorado</th>
                        <th>ROAS</th>
                        <th>Gasto</th>
                        <th>Faturamento</th>
                        <th>Compras</th>
                        <th>CPA</th>
                      </tr>
                    </thead>
                    <tbody>{data.worstRoas.map(renderRoasRow)}</tbody>
                  </table>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: 16, textAlign: 'center' }}>Sem dados suficientes</p>
                )}
              </div>
            </div>
          </div>

          {/* Rankings CTR */}
          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div className="card">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {trendUp} Top 3 Melhor CTR
              </div>
              <div className="table-wrapper">
                {data.bestCtr && data.bestCtr.length > 0 ? (
                  <table>
                    {ctrColGroup}
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Mentorado</th>
                        <th>CTR</th>
                        <th>Cliques</th>
                        <th>Impressões</th>
                      </tr>
                    </thead>
                    <tbody>{data.bestCtr.map(renderCtrRow)}</tbody>
                  </table>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: 16, textAlign: 'center' }}>Sem dados suficientes</p>
                )}
              </div>
            </div>
            <div className="card">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {trendDown} Top 3 Pior CTR
              </div>
              <div className="table-wrapper">
                {data.worstCtr && data.worstCtr.length > 0 ? (
                  <table>
                    {ctrColGroup}
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Mentorado</th>
                        <th>CTR</th>
                        <th>Cliques</th>
                        <th>Impressões</th>
                      </tr>
                    </thead>
                    <tbody>{data.worstCtr.map(renderCtrRow)}</tbody>
                  </table>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: 16, textAlign: 'center' }}>Sem dados suficientes</p>
                )}
              </div>
            </div>
          </div>

          {/* Rankings Conversão */}
          <div className="grid-2" style={{ marginBottom: 24 }}>
            <div className="card">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {trendUp} Top 3 Melhor Conversão da Página
              </div>
              <div className="table-wrapper">
                {data.bestConv && data.bestConv.length > 0 ? (
                  <table>
                    {convColGroup}
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Mentorado</th>
                        <th>Conversão</th>
                        <th>Compras</th>
                        <th>Vis. LP</th>
                      </tr>
                    </thead>
                    <tbody>{data.bestConv.map(renderConvRow)}</tbody>
                  </table>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: 16, textAlign: 'center' }}>Sem dados suficientes</p>
                )}
              </div>
            </div>
            <div className="card">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {trendDown} Top 3 Pior Conversão da Página
              </div>
              <div className="table-wrapper">
                {data.worstConv && data.worstConv.length > 0 ? (
                  <table>
                    {convColGroup}
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Mentorado</th>
                        <th>Conversão</th>
                        <th>Compras</th>
                        <th>Vis. LP</th>
                      </tr>
                    </thead>
                    <tbody>{data.worstConv.map(renderConvRow)}</tbody>
                  </table>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: 16, textAlign: 'center' }}>Sem dados suficientes</p>
                )}
              </div>
            </div>
          </div>

          {/* Últimas Auditorias */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Últimas Auditorias</h3>
            </div>
            <div className="table-wrapper">
              {data.recentAudits && data.recentAudits.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Mentorado</th>
                      <th>Data</th>
                      <th>Campanhas</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentAudits.map((a: any) => (
                      <tr key={a.id}>
                        <td>{a.user_name}</td>
                        <td>{formatDate(a.created_at)}</td>
                        <td>{a.campaign_count || '-'}</td>
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
                  <p>Nenhuma auditoria encontrada.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
