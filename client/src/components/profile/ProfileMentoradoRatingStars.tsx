import React from 'react';

export interface ProfileMentoradoRatingStarsProps {
  rating: number;
  totalReviews?: number;
}

export function ProfileMentoradoRatingStars({ rating, totalReviews = 0 }: ProfileMentoradoRatingStarsProps) {
  const displayRating = Math.min(5, Math.max(0, Number(rating) || 0));
  const fullStars = Math.floor(displayRating);

  return (
    <section style={{ marginBottom: 24 }}>
      <h3
        style={{
          margin: '0 0 12px 0',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
      >
        Avaliação
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={`${displayRating.toFixed(1)}/5`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 22,
                color: i <= fullStars ? 'var(--yellow)' : 'var(--text-muted)',
                fontVariationSettings: i <= fullStars ? '"FILL" 1' : '"FILL" 0',
              }}
            >
              star
            </span>
          </div>
        ))}
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          {displayRating > 0 ? displayRating.toFixed(1) : '—'}
          {totalReviews > 0 && (
            <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 4 }}>
              ({totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'})
            </span>
          )}
        </span>
      </div>
    </section>
  );
}
