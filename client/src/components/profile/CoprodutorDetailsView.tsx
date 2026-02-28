interface CoprodutorDetailsViewProps {
  coprodutorDetails: {
    faz_trafego?: boolean;
    faz_lancamento?: boolean;
    faz_perpetuo?: boolean;
    ticket_minimo?: number;
    percentual_minimo?: number;
    aceita_sociedade?: boolean;
    aceita_fee_percentual?: boolean;
  };
}

export function CoprodutorDetailsView({ coprodutorDetails }: CoprodutorDetailsViewProps) {
  if (!coprodutorDetails) return null;

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  return (
    <div className="card" style={{ marginBottom: 32, padding: 24 }}>
      <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, fontWeight: 600 }}>
        🤝 Coprodutor - Capacidades e Parceria
      </h3>
      
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
          Capacidades:
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {coprodutorDetails.faz_trafego && (
            <span style={{ 
              padding: '4px 12px', 
              background: 'var(--bg-secondary)', 
              borderRadius: 'var(--radius)',
              fontSize: 14
            }}>
              Faz Tráfego
            </span>
          )}
          {coprodutorDetails.faz_lancamento && (
            <span style={{ 
              padding: '4px 12px', 
              background: 'var(--bg-secondary)', 
              borderRadius: 'var(--radius)',
              fontSize: 14
            }}>
              Faz Lançamento
            </span>
          )}
          {coprodutorDetails.faz_perpetuo && (
            <span style={{ 
              padding: '4px 12px', 
              background: 'var(--bg-secondary)', 
              borderRadius: 'var(--radius)',
              fontSize: 14
            }}>
              Faz Perpétuo
            </span>
          )}
          {!coprodutorDetails.faz_trafego && !coprodutorDetails.faz_lancamento && !coprodutorDetails.faz_perpetuo && (
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nenhuma capacidade informada</span>
          )}
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Ticket Mínimo
          </label>
          <p style={{ margin: 0, fontWeight: 500 }}>
            {formatPrice(coprodutorDetails.ticket_minimo)}
          </p>
        </div>
        
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Percentual Mínimo
          </label>
          <p style={{ margin: 0, fontWeight: 500 }}>
            {coprodutorDetails.percentual_minimo ? `${coprodutorDetails.percentual_minimo}%` : 'Não informado'}
          </p>
        </div>
      </div>
      
      <div>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
          Aceita:
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {coprodutorDetails.aceita_sociedade && (
            <span style={{ 
              padding: '4px 12px', 
              background: 'var(--bg-secondary)', 
              borderRadius: 'var(--radius)',
              fontSize: 14
            }}>
              Sociedade
            </span>
          )}
          {coprodutorDetails.aceita_fee_percentual && (
            <span style={{ 
              padding: '4px 12px', 
              background: 'var(--bg-secondary)', 
              borderRadius: 'var(--radius)',
              fontSize: 14
            }}>
              Fee + Percentual
            </span>
          )}
          {!coprodutorDetails.aceita_sociedade && !coprodutorDetails.aceita_fee_percentual && (
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nenhuma opção informada</span>
          )}
        </div>
      </div>
    </div>
  );
}
