import { useState } from 'react';

interface ProfileReview {
  id: string;
  autor_nome: string;
  rating: number;
  depoimento?: string;
  created_at?: string;
}

interface ProfileReviewsProps {
  reviews: ProfileReview[];
  rating: number;
  totalReviews: number;
}

export function ProfileReviews({ reviews, rating, totalReviews }: ProfileReviewsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextReview = () => {
    if (reviews.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }
  };

  const prevReview = () => {
    if (reviews.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 32, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
          Depoimentos
        </h2>
        {rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>
              {rating.toFixed(1)}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              ({totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'})
            </span>
          </div>
        )}
      </div>
      {reviews.length === 0 ? (
        <div style={{
          padding: '32px 24px',
          textAlign: 'center',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius)',
          border: '1px dashed var(--border)'
        }}>
          <div style={{
            fontSize: 32,
            marginBottom: 12,
            color: 'var(--text-muted)'
          }}>
            💬
          </div>
          <p style={{ 
            color: 'var(--text-secondary)', 
            margin: '0 0 8px 0', 
            fontSize: 15,
            fontWeight: 500
          }}>
            Ainda não há depoimentos
          </p>
          <p style={{ 
            color: 'var(--text-muted)', 
            margin: 0, 
            fontSize: 13,
            lineHeight: 1.5
          }}>
            Seja o primeiro a avaliar este perfil
          </p>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            {reviews.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {currentIndex + 1} / {reviews.length}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={prevReview}
                    style={{
                      padding: '6px 12px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      fontSize: 14,
                      color: 'var(--text)'
                    }}
                  >
                    ←
                  </button>
                  <button
                    onClick={nextReview}
                    style={{
                      padding: '6px 12px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      fontSize: 14,
                      color: 'var(--text)'
                    }}
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
          <div
            key={reviews[currentIndex].id}
            style={{
              padding: 16,
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              minHeight: '120px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {reviews[currentIndex].autor_nome}
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span 
                      key={i}
                      style={{ 
                        color: i < reviews[currentIndex].rating ? '#FFD700' : 'var(--text-muted)',
                        fontSize: 16
                      }}
                    >
                      ★
                    </span>
                  ))}
                  <span style={{ marginLeft: 8, color: 'var(--text-secondary)', fontSize: 12 }}>
                    {reviews[currentIndex].rating}/5
                  </span>
                </div>
              </div>
              {reviews[currentIndex].created_at && (
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  {new Date(reviews[currentIndex].created_at).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
            {reviews[currentIndex].depoimento && (
              <p style={{ 
                margin: 0, 
                color: 'var(--text)', 
                fontSize: 14,
                lineHeight: 1.6
              }}>
                {reviews[currentIndex].depoimento}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
