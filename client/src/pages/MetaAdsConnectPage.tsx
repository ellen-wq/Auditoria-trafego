import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';

type AdAccount = {
  id: string;
  name?: string;
  account_status?: number;
};

type InsightRow = {
  campaign_name?: string;
  adset_name?: string;
  ad_name?: string;
  reach?: string;
  impressions?: string;
  frequency?: string;
  spend?: string;
  cpm?: string;
  cpc?: string;
  inline_link_clicks?: string;
  cpp?: string;
  ctr?: string;
  video_p25_watched_actions?: unknown;
  video_p50_watched_actions?: unknown;
  video_p75_watched_actions?: unknown;
  video_p100_watched_actions?: unknown;
  actions?: unknown;
  date_start?: string;
  [key: string]: unknown;
};

const META_APP_ID = '1454227042818069';
const META_SCOPE = [
  'public_profile',
  'ads_read',
  'pages_show_list',
  'pages_read_engagement',
  'business_management',
].join(',');

const INSIGHTS_FIELDS = [
  'campaign_name',
  'adset_name',
  'ad_name',
  'reach',
  'impressions',
  'frequency',
  'spend',
  'cpm',
  'cpc',
  'inline_link_clicks',
  'cpp',
  'ctr',
  'video_p25_watched_actions',
  'video_p50_watched_actions',
  'video_p75_watched_actions',
  'video_p100_watched_actions',
  'actions',
  'date_start',
].join(',');

function getPresetRange(preset: 'hoje' | '7' | '30' | 'mes'): { start: string; end: string } {
  const today = new Date();
  const end = today.toISOString().slice(0, 10);
  if (preset === 'hoje') return { start: end, end };
  if (preset === '7') {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { start: start.toISOString().slice(0, 10), end };
  }
  if (preset === '30') {
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    return { start: start.toISOString().slice(0, 10), end };
  }
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: last.toISOString().slice(0, 10),
  };
}

function getActivePreset(dateStart: string, dateEnd: string): 'hoje' | '7' | '30' | 'mes' | null {
  const today = new Date().toISOString().slice(0, 10);
  if (dateStart === today && dateEnd === today) return 'hoje';
  const r7 = getPresetRange('7');
  const r30 = getPresetRange('30');
  const rMes = getPresetRange('mes');
  if (dateStart === r7.start && dateEnd === r7.end) return '7';
  if (dateStart === r30.start && dateEnd === r30.end) return '30';
  if (dateStart === rMes.start && dateEnd === rMes.end) return 'mes';
  return null;
}

export default function MetaAdsConnectPage() {
  const navigate = useNavigate();
  const defaultDates = useMemo(() => getPresetRange('7'), []);

  const [token, setToken] = useState<string>('');
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [dateStart, setDateStart] = useState<string>(defaultDates.start);
  const [dateEnd, setDateEnd] = useState<string>(defaultDates.end);
  const [insights, setInsights] = useState<InsightRow[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  const redirectUri = useMemo(() => `${window.location.origin}/app/metaads/connect`, []);

  const authUrl = useMemo(() => {
    const url = new URL('https://www.facebook.com/v25.0/dialog/oauth');
    url.searchParams.set('client_id', META_APP_ID);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', META_SCOPE);
    url.searchParams.set('response_type', 'token');
    return url.toString();
  }, [redirectUri]);

  async function fetchAdsData(accessToken: string) {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `https://graph.facebook.com/v25.0/me/adaccounts?fields=id,name,account_status&access_token=${encodeURIComponent(accessToken)}`
      );
      const data = await response.json();
      if (data?.error) {
        setError(data.error.message || 'Erro ao consultar contas de anúncio.');
        setAccounts([]);
        return;
      }
      setAccounts(Array.isArray(data?.data) ? data.data : []);
    } catch {
      setError('Erro ao buscar contas de anúncio.');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAccountInsights() {
    if (!token || !selectedAccountId || !dateStart || !dateEnd) return;
    setInsightsLoading(true);
    setInsightsError('');
    try {
      const baseId = selectedAccountId.startsWith('act_') ? selectedAccountId : `act_${selectedAccountId}`;
      const params = new URLSearchParams();
      params.set('fields', INSIGHTS_FIELDS);
      params.set('time_range', JSON.stringify({ since: dateStart, until: dateEnd }));
      params.set('access_token', token);

      const response = await fetch(
        `https://graph.facebook.com/v25.0/${encodeURIComponent(baseId)}/insights?${params.toString()}`
      );
      const data = await response.json();
      if (data?.error) {
        setInsightsError(data.error.message || 'Erro ao consultar insights da conta selecionada.');
        setInsights([]);
        return;
      }
      setInsights(Array.isArray(data?.data) ? data.data : []);
    } catch {
      setInsightsError('Erro ao buscar insights da conta selecionada.');
      setInsights([]);
    } finally {
      setInsightsLoading(false);
    }
  }

  function handleLogin() {
    window.location.href = authUrl;
  }

  function handleDisconnect() {
    setToken('');
    setAccounts([]);
    setSelectedAccountId('');
    setInsights([]);
    setError('');
    setInsightsError('');
    window.history.replaceState(null, '', '/app/metaads/connect');
  }

  function applyPreset(preset: 'hoje' | '7' | '30' | 'mes') {
    const { start, end } = getPresetRange(preset);
    setDateStart(start);
    setDateEnd(end);
  }

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const params = new URLSearchParams(hash.replace('#', '?'));
    const accessToken = params.get('access_token');
    if (!accessToken) return;
    setToken(accessToken);
    void fetchAdsData(accessToken);
    window.history.replaceState(null, '', '/app/metaads/connect');
  }, []);

  const activePreset = getActivePreset(dateStart, dateEnd);

  // Tela de login (sem token)
  if (!token) {
    return (
      <AppLayout breadcrumbs={[{ label: 'Análises', href: '/app/upload' }, { label: 'Conectar MetaAds' }]}>
        <div
          style={{
            minHeight: 'calc(100vh - 180px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: '100%', maxWidth: 1020, margin: '0 auto' }}>
            <h1 className="page-title" style={{ textAlign: 'center', fontSize: 40, marginBottom: 10 }}>
              Conexão Meta Ads
            </h1>
            <p className="page-subtitle" style={{ textAlign: 'center', fontSize: 20, marginBottom: 24 }}>
              Conecte sua conta para listar contas de anúncios e validar o token do Meta.
            </p>
            <div className="card" style={{ padding: 36 }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleLogin}
                  style={{ width: '100%', maxWidth: 460, minHeight: 56, fontSize: 18 }}
                >
                  Conectar com o Facebook
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Pós-login: layout da spec (Seleção de Conta e Período)
  return (
    <div className={`metaads-selection ${darkMode ? 'dark' : ''}`}>
      <div style={{ height: '3rem', width: '100%' }} aria-hidden />
      <header className="metaads-header ios-blur">
        <button type="button" onClick={() => navigate('/app/upload')} aria-label="Voltar">
          <span className="material-symbols-rounded text-2xl">arrow_back_ios_new</span>
        </button>
        <h1>Seleção de Conta</h1>
        <button
          type="button"
          onClick={handleDisconnect}
          aria-label="Menu"
          title="Desconectar"
        >
          <span className="material-symbols-rounded text-2xl">menu</span>
        </button>
      </header>

      <main className="metaads-main">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label className="metaads-section-label">Conta de Anúncios Meta</label>
            <div className="metaads-select-wrap">
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                disabled={loading}
              >
                <option value="">
                  {loading ? 'Carregando contas...' : 'Selecione uma conta...'}
                </option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name || 'Conta sem nome'} ({account.id})
                  </option>
                ))}
              </select>
              <span className="metaads-select-icon material-symbols-rounded">expand_more</span>
            </div>
          </section>

          <section>
            <h2 className="metaads-section-title">Período de Análise</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div className="metaads-date-card">
                <div className="metaads-date-icon">
                  <span className="material-symbols-rounded">calendar_today</span>
                </div>
                <div style={{ flex: 1 }}>
                  <label>Data de Início</label>
                  <input
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                  />
                </div>
              </div>
              <div className="metaads-date-card">
                <div className="metaads-date-icon">
                  <span className="material-symbols-rounded">event</span>
                </div>
                <div style={{ flex: 1 }}>
                  <label>Data de Término</label>
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="metaads-presets">
            <button
              type="button"
              className={`metaads-preset-btn ${activePreset === 'hoje' ? 'active' : ''}`}
              onClick={() => applyPreset('hoje')}
            >
              Hoje
            </button>
            <button
              type="button"
              className={`metaads-preset-btn ${activePreset === '7' ? 'active' : ''}`}
              onClick={() => applyPreset('7')}
            >
              Últimos 7 dias
            </button>
            <button
              type="button"
              className={`metaads-preset-btn ${activePreset === '30' ? 'active' : ''}`}
              onClick={() => applyPreset('30')}
            >
              Últimos 30 dias
            </button>
            <button
              type="button"
              className={`metaads-preset-btn ${activePreset === 'mes' ? 'active' : ''}`}
              onClick={() => applyPreset('mes')}
            >
              Este mês
            </button>
          </section>

          <div className="metaads-info-box">
            <span className="material-symbols-rounded">info</span>
            <p>
              Ao confirmar, buscaremos todos os dados de métricas, conversões e custos para a conta selecionada no período escolhido.
            </p>
          </div>

          {error && (
            <div className="alert alert-error visible" style={{ marginTop: 0 }}>
              {error}
            </div>
          )}
          {insightsError && (
            <div className="alert alert-error visible" style={{ marginTop: 0 }}>
              {insightsError}
            </div>
          )}

          {insights.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ fontSize: '0.9375rem', marginBottom: '0.5rem' }}>
                Resultados encontrados ({insights.length} linhas)
              </h3>
              <div
                style={{
                  maxHeight: 260,
                  overflow: 'auto',
                  border: '1px solid var(--metaads-border)',
                  borderRadius: '1rem',
                  background: 'var(--metaads-surface)',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--metaads-bg)' }}>
                      <th style={{ padding: 6, textAlign: 'left' }}>Campanha</th>
                      <th style={{ padding: 6, textAlign: 'left' }}>Conjunto</th>
                      <th style={{ padding: 6, textAlign: 'left' }}>Anúncio</th>
                      <th style={{ padding: 6, textAlign: 'right' }}>Impressões</th>
                      <th style={{ padding: 6, textAlign: 'right' }}>Alcance</th>
                      <th style={{ padding: 6, textAlign: 'right' }}>Investido</th>
                      <th style={{ padding: 6, textAlign: 'left' }}>Data início</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insights.map((row, index) => (
                      <tr key={`${row.campaign_name ?? ''}-${index}`}>
                        <td style={{ padding: 6, borderTop: '1px solid var(--metaads-border)' }}>
                          {row.campaign_name ?? '-'}
                        </td>
                        <td style={{ padding: 6, borderTop: '1px solid var(--metaads-border)' }}>
                          {row.adset_name ?? '-'}
                        </td>
                        <td style={{ padding: 6, borderTop: '1px solid var(--metaads-border)' }}>
                          {row.ad_name ?? '-'}
                        </td>
                        <td
                          style={{
                            padding: 6,
                            borderTop: '1px solid var(--metaads-border)',
                            textAlign: 'right',
                          }}
                        >
                          {row.impressions ?? '-'}
                        </td>
                        <td
                          style={{
                            padding: 6,
                            borderTop: '1px solid var(--metaads-border)',
                            textAlign: 'right',
                          }}
                        >
                          {row.reach ?? '-'}
                        </td>
                        <td
                          style={{
                            padding: 6,
                            borderTop: '1px solid var(--metaads-border)',
                            textAlign: 'right',
                          }}
                        >
                          {row.spend ?? '-'}
                        </td>
                        <td style={{ padding: 6, borderTop: '1px solid var(--metaads-border)' }}>
                          {row.date_start ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <div className="metaads-cta-wrap">
        <button
          type="button"
          className="metaads-cta"
          onClick={fetchAccountInsights}
          disabled={!selectedAccountId || !dateStart || !dateEnd || insightsLoading}
        >
          {insightsLoading ? 'Buscando dados...' : 'Confirmar Seleção'}
          <span className="material-symbols-rounded">chevron_right</span>
        </button>
        <div className="metaads-cta-bar" aria-hidden />
      </div>

      <button
        type="button"
        className="metaads-dark-toggle"
        onClick={() => setDarkMode((d) => !d)}
        aria-label={darkMode ? 'Modo claro' : 'Modo escuro'}
      >
        <span className="material-symbols-rounded" style={{ display: darkMode ? 'none' : 'block' }}>
          dark_mode
        </span>
        <span className="material-symbols-rounded" style={{ display: darkMode ? 'block' : 'none' }}>
          light_mode
        </span>
      </button>
    </div>
  );
}
