interface ProfileMetricsProps {
  totalProjetos: number;
  rating: number;
  anosExperiencia: number;
}

export function ProfileMetrics({ totalProjetos, rating, anosExperiencia }: ProfileMetricsProps) {
  return (
    <div className="card" style={{ marginBottom: 32, padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: 48, 
            fontWeight: 700, 
            color: 'var(--primary)', 
            marginBottom: 6,
            lineHeight: 1.1
          }}>
            {totalProjetos}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
            Projetos Concluídos
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: 48, 
            fontWeight: 700, 
            color: 'var(--primary)', 
            marginBottom: 6,
            lineHeight: 1.1
          }}>
            {rating > 0 ? rating.toFixed(1) : '—'}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
            Média de Avaliações
          </div>
          {rating > 0 && (
            <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
              ⭐ {rating.toFixed(1)}/5.0
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: 48, 
            fontWeight: 700, 
            color: 'var(--primary)', 
            marginBottom: 6,
            lineHeight: 1.1
          }}>
            {anosExperiencia}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
            Anos de Experiência
          </div>
        </div>
      </div>
    </div>
  );
}
