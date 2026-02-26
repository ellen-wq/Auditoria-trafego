import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import logoFluxo from '../assets/fluxo.logo.animation.svg';

export default function RegisterPrestadorPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    if (isSubmitting) {
      console.log('[Register Prestador] Submit já em andamento, ignorando...');
      return;
    }

    setError('');
    setIsSubmitting(true);

    if (password !== password2) {
      setError('As senhas não coincidem.');
      setIsSubmitting(false);
      return;
    }

    if (!acceptTerms) {
      setError('Você precisa aceitar os Termos de Uso para continuar.');
      setIsSubmitting(false);
      return;
    }

    const payload = { name: name.trim(), email: email.toLowerCase().trim(), password };
    console.log('[Register Prestador] Payload sendo enviado:', { ...payload, password: '***' });

    try {
      console.log('[Register Prestador] Chamando API /api/auth/register-prestador...');
      const data = await api.post('/api/auth/register-prestador', payload);
      console.log('[Register Prestador] Resposta da API:', { user: data.user, hasToken: !!data.token });
      
      if (data.token && data.user) {
        api.setAuth(data.token, data.user);
        console.log('[Register Prestador] Autenticação configurada, navegando para perfil de prestador');
        setName('');
        setEmail('');
        setPassword('');
        setPassword2('');
        setAcceptTerms(false);
        navigate('/tinder-do-fluxo/meu-perfil', { replace: true });
      } else {
        console.error('[Register Prestador] Resposta inválida da API:', data);
        setError('Resposta inválida do servidor.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('[Register Prestador] Erro ao criar conta:', err);
      const errorMessage = err.message || 'Erro ao criar conta.';
      console.error('[Register Prestador] Mensagem de erro:', errorMessage);
      setError(errorMessage);
      setIsSubmitting(false);
    }
  }

  function openTerms(e: React.MouseEvent) {
    e.preventDefault();
    setShowTerms(true);
  }

  function closeTerms() {
    setShowTerms(false);
    setAcceptTerms(true);
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      setShowTerms(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={logoFluxo} alt="Fluxo" className="auth-logo-image" />
          <span className="auth-logo-tools">ferramentas</span>
        </div>
        <p className="auth-subtitle">Cadastro de Prestador de Serviço</p>

        {error && (
          <div className="alert alert-error" style={{ display: 'block' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nome completo</label>
            <input
              type="text"
              id="name"
              placeholder="Seu nome"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
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
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password2">Confirmar senha</label>
            <input
              type="password"
              id="password2"
              placeholder="Repita a senha"
              required
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginTop: 8 }}>
            <label
              className="checkbox-label"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                cursor: 'pointer',
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                required
                style={{
                  marginTop: 3,
                  minWidth: 18,
                  minHeight: 18,
                  accentColor: 'var(--accent-dark)',
                  cursor: 'pointer',
                }}
              />
              <span>
                Declaro que li e aceito os{' '}
                <a
                  href="#"
                  onClick={openTerms}
                  style={{ color: 'var(--accent-dark)', textDecoration: 'underline' }}
                >
                  Termos de Uso
                </a>
                .
              </span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Criando conta...' : 'Criar conta de prestador'}
          </button>
        </form>

        {showTerms && (
          <div
            onClick={handleBackdropClick}
            style={{
              display: 'flex',
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 1000,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                background: 'var(--bg-white)',
                borderRadius: 'var(--radius)',
                maxWidth: 560,
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto',
                padding: 32,
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                Termos de Uso — Prestador de Serviço
              </h2>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                <p style={{ marginBottom: 12 }}>
                  Ao criar sua conta como prestador de serviço, você declara estar ciente e de acordo com os termos de uso da plataforma.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={closeTerms}
                style={{ marginTop: 20, width: '100%' }}
              >
                Entendi e concordo
              </button>
            </div>
          </div>
        )}

        <p className="auth-footer">
          Já tem conta? <a href="/login">Fazer login</a>
        </p>
      </div>
    </div>
  );
}
