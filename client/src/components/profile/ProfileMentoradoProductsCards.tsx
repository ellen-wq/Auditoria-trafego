import React from 'react';

export interface ProductCardItem {
  id?: string;
  tipo_produto: string;
  preco: number;
  modelo: string;
  nicho?: string;
  publico?: string;
}

export interface ProfileMentoradoProductsCardsProps {
  products: ProductCardItem[];
}

const formatPrice = (price?: number) => {
  if (!price || price === 0) return null;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
};

const cardStyle: React.CSSProperties = {
  padding: 16,
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
};

export function ProfileMentoradoProductsCards({ products }: ProfileMentoradoProductsCardsProps) {
  const list = products || [];

  return (
    <section data-section="produtos-cards">
      {list.length === 0 ? (
        <div
          style={{
            padding: 24,
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 14,
          }}
        >
          Nenhum produto cadastrado
        </div>
      ) : (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
          gap: 16,
        }}
        className="profile-mentorado-cards-grid"
      >
        {list.map((product, idx) => {
          const priceStr = formatPrice(product.preco);
          const subtitle = [priceStr, product.modelo].filter(Boolean).join(' · ') || 'Produto';
          return (
            <div key={product.id || `prod-${idx}`} style={cardStyle}>
              <span
                className="material-symbols-outlined"
                style={{ color: 'var(--green)', fontSize: 24, flexShrink: 0 }}
              >
                check_circle
              </span>
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 600,
                    fontSize: 15,
                    color: 'var(--text-primary)',
                  }}
                >
                  {product.tipo_produto || 'Produto'}
                </p>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: 14,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  {subtitle}
                </p>
            </div>
          </div>
          );
        })}
      </div>
      )}
    </section>
  );
}
