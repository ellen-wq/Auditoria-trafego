import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import logoFluxo from '../assets/fluxo.logo.animation.svg';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function homeByRole(role: string): string {
    if (role === 'LIDERANCA') return '/admin/dashboard';
    if (role === 'PRESTADOR') return '/tinder-do-fluxo/perfil';
    return '/app/upload';
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    // Previne múltiplos submits simultâneos
    if (isSubmitting) {
      console.log('[Register] Submit já em andamento, ignorando...');
      return;
    }

    setError('');
    setIsSubmitting(true);

    // Validações locais
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

    // Prepara payload
    const payload = { name: name.trim(), email: email.toLowerCase().trim(), password };
    console.log('[Register] Payload sendo enviado:', { ...payload, password: '***' });

    try {
      console.log('[Register] Chamando API /api/auth/register...');
      const data = await api.post('/api/auth/register', payload);
      console.log('[Register] Resposta da API:', { user: data.user, hasToken: !!data.token });
      
      if (data.token && data.user) {
        api.setAuth(data.token, data.user);
        console.log('[Register] Autenticação configurada, navegando para:', homeByRole(data.user.role));
        // Reset form antes de navegar
        setName('');
        setEmail('');
        setPassword('');
        setPassword2('');
        setAcceptTerms(false);
        navigate(homeByRole(data.user.role), { replace: true });
      } else {
        console.error('[Register] Resposta inválida da API:', data);
        setError('Resposta inválida do servidor.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('[Register] Erro ao criar conta:', err);
      const errorMessage = err.message || 'Erro ao criar conta.';
      console.error('[Register] Mensagem de erro:', errorMessage);
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
        <p className="auth-subtitle">Crie sua conta para começar a auditar</p>

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
                . Estou ciente de que a equipe de mentoria terá total e livre acesso aos dados
                inseridos por mim nesta plataforma, incluindo a possibilidade de visualização,
                análise e manipulação dessas informações para fins de acompanhamento e orientação.
              </span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Criando conta...' : 'Criar conta'}
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
                Termos de Uso — Fluxer Auditoria
              </h2>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                <p style={{ marginBottom: 12 }}>
                  Ao criar sua conta e utilizar a plataforma Fluxer Auditoria de Tráfego, você
                  declara estar ciente e de acordo com os seguintes termos:
                </p>
                <p style={{ marginBottom: 12 }}>
                  <strong>1. Acesso aos dados:</strong> A equipe de mentoria (perfil Liderança)
                  terá total e livre acesso a todos os dados inseridos por você na plataforma,
                  incluindo informações de campanhas, planilhas enviadas, métricas, resultados de
                  auditorias e quaisquer outros dados preenchidos.
                </p>
                <p style={{ marginBottom: 12 }}>
                  <strong>2. Manipulação dos dados:</strong> A equipe de mentoria poderá
                  visualizar, analisar, comparar e utilizar seus dados para fins de
                  acompanhamento, orientação estratégica, geração de relatórios consolidados e
                  melhoria contínua do processo de mentoria.
                </p>
                <p style={{ marginBottom: 12 }}>
                  <strong>3. Finalidade:</strong> Os dados coletados serão utilizados
                  exclusivamente para fins pedagógicos e de acompanhamento dentro do programa de
                  mentoria, visando otimizar os resultados das suas campanhas de tráfego pago.
                </p>
                <p style={{ marginBottom: 12 }}>
                  <strong>4. Responsabilidade:</strong> Você é responsável pela veracidade e
                  precisão dos dados inseridos na plataforma. A equipe de mentoria não se
                  responsabiliza por decisões tomadas com base em dados incorretos ou incompletos.
                </p>
                <p>
                  <strong>5. Consentimento:</strong> Ao marcar a caixa de aceite e criar sua
                  conta, você consente de forma livre, informada e inequívoca com todos os termos
                  acima descritos.
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
