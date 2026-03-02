interface ExpertDetailsViewProps {
  expertDetails: {
    products?: Array<{
      id?: string;
      tipo_produto: string;
      preco: number;
      modelo: string;
    }>;
    precisa_trafego_pago?: boolean;
    precisa_copy?: boolean;
    precisa_automacoes?: boolean;
    precisa_estrategista?: boolean;
  };
}

export function ExpertDetailsView({ expertDetails }: ExpertDetailsViewProps) {
  if (!expertDetails) return null;

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  const products = expertDetails.products || [];
  const needs = [
    expertDetails.precisa_trafego_pago && 'Tráfego Pago',
    expertDetails.precisa_copy && 'Copy',
    expertDetails.precisa_automacoes && 'Automações',
    expertDetails.precisa_estrategista && 'Estrategista'
  ].filter(Boolean);

  return (
    <div className="card" style={{ marginBottom: 32, padding: 24 }}>
      <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, fontWeight: 600 }}>
        🟣 Expert - Produtos e Necessidades
      </h3>
      
      {/* Produtos */}
      {products.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 12, fontWeight: 600 }}>
            Produtos:
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {products.map((product, idx) => (
              <div 
                key={product.id || idx}
                style={{ 
                  padding: 16, 
                  background: 'var(--bg-secondary)', 
                  borderRadius: 'var(--radius)', 
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      Tipo de Produto
                    </label>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>
                      {product.tipo_produto || 'Não informado'}
                    </p>
                  </div>
                  
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      Preço
                    </label>
                    <p style={{ margin: 0, fontWeight: 500 }}>
                      {formatPrice(product.preco)}
                    </p>
                  </div>
                </div>
                
                {product.modelo && (
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      Modelo
                    </label>
                    <p style={{ margin: 0, fontWeight: 500 }}>
                      {product.modelo}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Necessidades */}
      {needs.length > 0 && (
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Precisa de:
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {needs.map((need, idx) => (
              <span 
                key={idx}
                style={{ 
                  padding: '6px 14px', 
                  background: 'var(--bg-sidebar)', 
                  color: 'white',
                  borderRadius: 'var(--radius)',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                {need}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
