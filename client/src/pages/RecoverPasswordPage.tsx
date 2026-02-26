import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import logoFluxo from '../assets/fluxo.logo.animation.svg';

export default function RecoverPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('A confirmação de senha não confere.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/recover-password', {
        email,
        newPassword,
      });
      setSuccess('Senha atualizada com sucesso. Você já pode entrar.');
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err: any) {
      setError(err.message || 'Não foi possível recuperar a senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={logoFluxo} alt="Fluxo" className="auth-logo-image" />
          <span className="auth-logo-tools">ferramentas</span>
        </div>
        <p className="auth-subtitle">Recupere sua senha para acessar a plataforma</p>

        {error && (
          <div className="alert alert-error" style={{ display: 'block' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ display: 'block' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email da conta</label>
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
            <label htmlFor="new-password">Nova senha</label>
            <input
              type="password"
              id="new-password"
              placeholder="Digite a nova senha"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Confirmar nova senha</label>
            <input
              type="password"
              id="confirm-password"
              placeholder="Repita a nova senha"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Atualizando...' : 'Atualizar senha'}
          </button>
        </form>

        <p className="auth-footer">
          Lembrou a senha? <Link to="/login">Voltar para login</Link>
        </p>
      </div>
    </div>
  );
}
