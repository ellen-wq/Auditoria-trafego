import { useState, useEffect, FormEvent, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import logoFluxo from '../assets/fluxo.logo.animation.svg';

const LOGIN_EMAIL_KEY = 'fluxer_login_email';
const DEFAULT_AFTER_LOGIN = '/tinder-do-fluxo/matches';

function getStoredEmail(): string {
  try {
    return sessionStorage.getItem(LOGIN_EMAIL_KEY) ?? '';
  } catch {
    return '';
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(getStoredEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    try {
      if (value) sessionStorage.setItem(LOGIN_EMAIL_KEY, value);
      else sessionStorage.removeItem(LOGIN_EMAIL_KEY);
    } catch {
      // ignora indisponibilidade de storage
    }
  }, []);

  // Só redireciona "já logado" se o formulário estiver vazio (evita redirecionar enquanto o usuário digita)
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
      navigate(DEFAULT_AFTER_LOGIN, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar.');
    } finally {
      setLoading(false);
    }
  }

  function handleFormKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!loading) {
        const form = e.currentTarget;
        form.requestSubmit();
      }
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={logoFluxo} alt="Fluxo" className="auth-logo-image" />
          <span className="auth-logo-tools">ferramentas</span>
        </div>
        <p className="auth-subtitle">Faça login para acessar a auditoria de tráfego</p>

        {error && (
          <div className="alert alert-error" style={{ display: 'block' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} action="javascript:void(0)">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="seu@email.com"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              placeholder="Sua senha"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="auth-inline-link">
            <Link to="/recuperar-senha">Esqueci minha senha</Link>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="auth-footer">
          Não tem conta? <a href="/register">Cadastre-se</a>
        </p>
      </div>
    </div>
  );
}
