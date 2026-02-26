import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export default class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'Erro inesperado na aplicação.';
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown) {
    // Mantém log no console para facilitar diagnóstico no navegador do usuário.
    // eslint-disable-next-line no-console
    console.error('Erro capturado pela AppErrorBoundary:', error);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {
      // Ignora.
    }
    window.location.href = '/login';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f7fa',
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 520,
            width: '100%',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20, color: '#111827' }}>Erro ao abrir a aplicação</h2>
          <p style={{ marginTop: 10, fontSize: 14, color: '#4b5563', lineHeight: 1.5 }}>
            Ocorreu uma falha no carregamento. Clique no botão abaixo para limpar a sessão local e voltar ao login.
          </p>
          <p style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
            Detalhe técnico: {this.state.message}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              marginTop: 14,
              width: '100%',
              border: 0,
              borderRadius: 10,
              background: '#111827',
              color: '#fff',
              padding: '11px 14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Limpar sessão e abrir login
          </button>
        </div>
      </div>
    );
  }
}
