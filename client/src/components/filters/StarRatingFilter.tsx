interface StarRatingFilterProps {
  value: number | null;
  onChange: (rating: number | null) => void;
}

export default function StarRatingFilter({ value, onChange }: StarRatingFilterProps) {
  const handleClick = (rating: number) => {
    if (value === rating) {
      onChange(null); // Desmarcar se já estiver selecionado
    } else {
      onChange(rating);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Avaliação mínima</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {[5, 4, 3, 2, 1].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              borderRadius: 'var(--radius)',
              border: `1px solid ${value === rating ? 'var(--accent-dark)' : 'var(--border)'}`,
              background: value === rating ? 'var(--accent-light)' : 'var(--bg-white)',
              color: value === rating ? 'var(--accent-dark)' : 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {Array.from({ length: rating }).map((_, i) => (
              <span key={i} style={{ color: value === rating ? 'var(--accent-dark)' : 'var(--text-muted)' }}>
                ★
              </span>
            ))}
            <span style={{ fontSize: 12, marginLeft: 4 }}>{rating}+</span>
          </button>
        ))}
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--bg-white)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}
