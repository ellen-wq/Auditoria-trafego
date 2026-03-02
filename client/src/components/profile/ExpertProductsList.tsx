interface ExpertProduct {
  id?: string;
  tipo_produto: string;
  preco: number;
  modelo: string;
  nicho?: string;
  publico?: string;
}

interface ExpertProductsListProps {
  products: ExpertProduct[];
}

export function ExpertProductsList({ products }: ExpertProductsListProps) {
  if (!products || products.length === 0) return null;

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  return (
    <div className="card" style={{ marginBottom: 32, padding: 24 }}>
      <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, fontWeight: 600 }}>
        🟣 Produtos
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 8 }}>
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
              
              {product.nicho && (
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Nicho
                  </label>
                  <p style={{ margin: 0, fontWeight: 500 }}>
                    {product.nicho}
                  </p>
                </div>
              )}
              
              {product.publico && (
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Público
                  </label>
                  <p style={{ margin: 0, fontWeight: 500 }}>
                    {product.publico}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
