interface ExpertDetailsViewProps {
  expertDetails: {
    tipo_produto?: string;
    preco?: number;
    modelo?: string;
    precisa_trafego?: boolean;
    precisa_coprodutor?: boolean;
    precisa_copy?: boolean;
  };
}

export function ExpertDetailsView({ expertDetails }: ExpertDetailsViewProps) {
  if (!expertDetails) return null;

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  return (
    <div className="card" style={{ marginBottom: 32, padding: 24 }}>
      <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, fontWeight: 600 }}>
        🟣 Expert - Produto e Necessidades
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Tipo de Produto
          </label>
          <p style={{ margin: 0, fontWeight: 500 }}>
            {expertDetails.tipo_produto || 'Não informado'}
          </p>
        </div>
        
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Preço
          </label>
          <p style={{ margin: 0, fontWeight: 500 }}>
            {formatPrice(expertDetails.preco)}
          </p>
        </div>
      </div>
      
      {expertDetails.modelo && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Modelo
          </label>
          <p style={{ margin: 0, fontWeight: 500 }}>
            {expertDetails.modelo}
          </p>
        </div>
      )}
      
      <div>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
          Precisa de:
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {expertDetails.precisa_trafego && (
            <span style={{ 
              padding: '4px 12px', 
              background: 'var(--bg-secondary)', 
              borderRadius: 'var(--radius)',
              fontSize: 14
            }}>
              Tráfego
            </span>
          )}
          {expertDetails.precisa_coprodutor && (
            <span style={{ 
              padding: '4px 12px', 
              background: 'var(--bg-secondary)', 
              borderRadius: 'var(--radius)',
              fontSize: 14
            }}>
              Coprodutor
            </span>
          )}
          {expertDetails.precisa_copy && (
            <span style={{ 
              padding: '4px 12px', 
              background: 'var(--bg-secondary)', 
              borderRadius: 'var(--radius)',
              fontSize: 14
            }}>
              Copy
            </span>
          )}
          {!expertDetails.precisa_trafego && !expertDetails.precisa_coprodutor && !expertDetails.precisa_copy && (
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nenhuma necessidade informada</span>
          )}
        </div>
      </div>
    </div>
  );
}
