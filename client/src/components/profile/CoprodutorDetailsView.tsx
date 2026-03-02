interface CoprodutorDetailsViewProps {
  coprodutorDetails: {
    faz_perpetuo?: boolean;
    faz_pico_vendas?: boolean;
    faz_trafego_pago?: boolean;
    faz_copy?: boolean;
    faz_automacoes?: boolean;
  };
}

export function CoprodutorDetailsView({ coprodutorDetails }: CoprodutorDetailsViewProps) {
  if (!coprodutorDetails) return null;

  const capabilities = [
    coprodutorDetails.faz_perpetuo && 'Faz Perpétuo',
    coprodutorDetails.faz_pico_vendas && 'Faz Pico de Vendas',
    coprodutorDetails.faz_trafego_pago && 'Faz Tráfego Pago',
    coprodutorDetails.faz_copy && 'Faz Copy',
    coprodutorDetails.faz_automacoes && 'Faz Automações'
  ].filter(Boolean);

  return (
    <div className="card" style={{ marginBottom: 32, padding: 24 }}>
      <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, fontWeight: 600 }}>
        🤝 Coprodutor - Capacidades
      </h3>
      
      <div>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 12, fontWeight: 600 }}>
          Capacidades:
        </label>
        {capabilities.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {capabilities.map((cap, idx) => (
              <span 
                key={idx}
                style={{ 
                  padding: '6px 14px', 
                  background: 'var(--green)', 
                  color: 'white',
                  borderRadius: 'var(--radius)',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                {cap}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nenhuma capacidade informada</span>
        )}
      </div>
    </div>
  );
}
