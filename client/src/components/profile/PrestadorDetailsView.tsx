interface PrestadorDetailsViewProps {
  prestadorDetails: {
    servicos?: string[];
    valor_minimo?: number;
    modelo_contratacao?: string;
  };
}

const servicoLabels: Record<string, string> = {
  'TRAFEGO': 'Tráfego',
  'COPY': 'Copy',
  'AUTOMACAO': 'Automação',
  'trafego': 'Tráfego',
  'copy': 'Copy',
  'automacao': 'Automação',
};

const modeloLabels: Record<string, string> = {
  'remoto': 'Remoto',
  'presencial': 'Presencial',
  'hibrido': 'Híbrido',
  'indiferente': 'Indiferente',
};

export function PrestadorDetailsView({ prestadorDetails }: PrestadorDetailsViewProps) {
  if (!prestadorDetails) return null;

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  return (
    <div className="card" style={{ marginBottom: 32, padding: 24 }}>
      <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, fontWeight: 600 }}>
        🔵 Prestador - Serviços e Contratação
      </h3>
      
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
          Serviços:
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {prestadorDetails.servicos && prestadorDetails.servicos.length > 0 ? (
            prestadorDetails.servicos.map((servico, idx) => (
              <span key={idx} style={{ 
                padding: '4px 12px', 
                background: 'var(--bg-secondary)', 
                borderRadius: 'var(--radius)',
                fontSize: 14
              }}>
                {servicoLabels[servico] || servico}
              </span>
            ))
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nenhum serviço informado</span>
          )}
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Modelo de Contratação
          </label>
          <p style={{ margin: 0, fontWeight: 500 }}>
            {prestadorDetails.modelo_contratacao ? modeloLabels[prestadorDetails.modelo_contratacao] || prestadorDetails.modelo_contratacao : 'Não informado'}
          </p>
        </div>
        
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Valor Mínimo
          </label>
          <p style={{ margin: 0, fontWeight: 500 }}>
            {formatPrice(prestadorDetails.valor_minimo)}
          </p>
        </div>
      </div>
    </div>
  );
}
