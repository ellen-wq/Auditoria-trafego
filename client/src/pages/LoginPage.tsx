import { useState, useEffect, FormEvent, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const LOGIN_EMAIL_KEY = 'fluxer_login_email';
const DEFAULT_AFTER_LOGIN = '/tinder-do-fluxo/matches';
const LOGIN_LEFT_BG =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80';

function getStoredEmail(): string {
  try {
    return sessionStorage.getItem(LOGIN_EMAIL_KEY) ?? '';
  } catch {
    return '';
  }
}

function BrandIcon() {
  return (
    <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="login-page-brand-icon">
      <path d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z" />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(getStoredEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    try {
      if (value) sessionStorage.setItem(LOGIN_EMAIL_KEY, value);
      else sessionStorage.removeItem(LOGIN_EMAIL_KEY);
    } catch {
      // ignora
    }
  }, []);

  useEffect(() => {
    const user = api.getUser();
    if (user && !email && !password) {
      navigate(DEFAULT_AFTER_LOGIN, { replace: true });
    }
  }, [navigate, email, password]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/api/auth/login', { email, password });
      if (!data?.token || !data?.user) {
        setError('Resposta inválida do servidor. Tente novamente.');
        return;
      }
      try {
        sessionStorage.removeItem(LOGIN_EMAIL_KEY);
      } catch {
        // ignora
      }
      api.setAuth(data.token, data.user);
      navigate(DEFAULT_AFTER_LOGIN, { state: { fromLogin: true, user: data.user }, replace: true });
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar.');
    } finally {
      setLoading(false);
    }
  }

  function handleFormKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!loading) e.currentTarget.requestSubmit();
    }
  }

  return (
    <div className="login-page">
      {/* Left: Branding & Visuals */}
      <div className="login-page-left">
        <div
          className="login-page-left-bg"
          style={{ backgroundImage: `url(${LOGIN_LEFT_BG})` }}
          aria-hidden
        />
        <div className="login-page-left-overlay" />
        <div className="login-page-left-content">
          <div className="login-page-brand">
            <BrandIcon />
            <span className="login-page-brand-name">Fluxo</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p className="login-page-tagline">O digital não precisa ser solitário.</p>
            <h1 className="login-page-title">Fluxo</h1>
            <p className="login-page-desc">
              O ecossistema do Fluxo, porque o ambiente define tudo.
            </p>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="login-page-right">
        <div className="login-page-card">
          {/* Mobile brand */}
          <div className="login-page-mobile-brand">
            <BrandIcon />
            <h2 className="login-page-brand-name">Fluxo</h2>
          </div>

          <div className="login-page-form-header">
            <h2 className="login-page-form-title">Acesse sua conta</h2>
            <p className="login-page-form-subtitle">Bem-vindo ao ecossistema Premium</p>
          </div>

          {error && (
            <div className="login-page-error" role="alert">
              {error}
            </div>
          )}

          <form
            className="login-page-form"
            onSubmit={handleSubmit}
            onKeyDown={handleFormKeyDown}
            action="javascript:void(0)"
            style={{ marginTop: '2rem' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="login-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  disabled={loading}
                  className="login-input"
                />
              </div>
              <div className="login-field">
                <div className="login-field-row">
                  <label htmlFor="password">Senha</label>
                  <Link to="/recuperar-senha" className="login-link">
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="login-password-wrap">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="login-input"
                  />
                  <button
                    type="button"
                    className="login-toggle-password"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                type="submit"
                className="login-btn-primary"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
              <div className="login-page-divider">
                <span>ou</span>
              </div>
              <Link to="/register" className="login-btn-secondary">
                Cadastre-se
              </Link>
            </div>
          </form>

          <p className="login-page-footer">
            © {new Date().getFullYear()} Fluxo. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
