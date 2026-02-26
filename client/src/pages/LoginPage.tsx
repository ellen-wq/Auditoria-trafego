import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import logoFluxo from '../assets/fluxo.logo.animation.svg';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function homeByRole(role: string): string {
    if (role === 'LIDERANCA') return '/admin/dashboard';
    if (role === 'PRESTADOR') return '/tinder-do-fluxo/meu-perfil';
    return '/app/upload';
  }

  useEffect(() => {
    const user = api.getUser();
    if (user) {
      navigate(homeByRole(user.role), { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const data = await api.post('/api/auth/login', { email, password });
      api.setAuth(data.token, data.user);
      navigate(homeByRole(data.user.role), { replace: true });
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar.');
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

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="seu@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              placeholder="Sua senha"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="auth-inline-link">
            <Link to="/recuperar-senha">Esqueci minha senha</Link>
          </div>
          <button type="submit" className="btn btn-primary">Entrar</button>
        </form>

        <p className="auth-footer">
          Não tem conta? <a href="/register">Cadastre-se</a>
        </p>
      </div>
    </div>
  );
}
