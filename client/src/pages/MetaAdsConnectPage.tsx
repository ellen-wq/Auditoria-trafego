import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';

type AdAccount = {
  id: string;
  name?: string;
  account_status?: number;
};

const META_APP_ID = '1454227042818069';
const META_SCOPE = [
  'public_profile',
  'ads_read',
  'pages_show_list',
  'pages_read_engagement',
  'instagram_basic',
  'instagram_manage_insights',
  'business_management',
].join(',');

export default function MetaAdsConnectPage() {
  const [token, setToken] = useState<string>('');
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  function handleLogin() {
    window.location.href = authUrl;
  }

  function handleDisconnect() {
    setToken('');
    setAccounts([]);
    setError('');
    window.history.replaceState(null, '', '/app/metaads/connect');
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
            {!token ? (
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
            ) : (
              <div>
                <div className="alert alert-success visible" style={{ marginBottom: 16 }}>
                  Conectado com sucesso.
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>
                    Token do Meta (código completo)
                  </label>
                  <textarea
                    value={token}
                    readOnly
                    style={{
                      width: '100%',
                      minHeight: 96,
                      resize: 'vertical',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '10px 12px',
                      fontSize: 12,
                      fontFamily: 'monospace',
                      background: 'var(--bg-white)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <h3 style={{ fontSize: 16, marginBottom: 10 }}>Suas contas de anúncios</h3>

                {loading ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Carregando contas...</p>
                ) : accounts.length > 0 ? (
                  <div style={{ display: 'grid', gap: 10, maxHeight: 360, overflowY: 'auto' }}>
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-xs)',
                          padding: 12,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <p style={{ fontWeight: 600 }}>{account.name || 'Conta sem nome'}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>ID: {account.id}</p>
                        </div>
                        <span style={{ fontSize: 12, color: account.account_status === 1 ? '#15803d' : '#b91c1c' }}>
                          Status: {account.account_status ?? '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>Nenhuma conta de anúncio encontrada.</p>
                )}

                {error && (
                  <div className="alert alert-error visible" style={{ marginTop: 14 }}>
                    {error}
                  </div>
                )}

                <button type="button" className="btn btn-outline" onClick={handleDisconnect} style={{ marginTop: 18 }}>
                  Desconectar e limpar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
