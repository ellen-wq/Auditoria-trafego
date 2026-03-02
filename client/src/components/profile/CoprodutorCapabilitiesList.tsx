interface CoprodutorCapabilitiesListProps {
  capabilities: {
    faz_perpetuo?: boolean;
    faz_pico_vendas?: boolean;
    faz_trafego_pago?: boolean;
    faz_copy?: boolean;
    faz_automacoes?: boolean;
  };
}

export function CoprodutorCapabilitiesList({ capabilities }: CoprodutorCapabilitiesListProps) {
  if (!capabilities) return null;

  const capabilityList = [
    capabilities.faz_perpetuo && 'Perpétuo',
    capabilities.faz_pico_vendas && 'Pico de Vendas',
    capabilities.faz_trafego_pago && 'Tráfego Pago',
    capabilities.faz_copy && 'Copy',
    capabilities.faz_automacoes && 'Automações'
  ].filter(Boolean);

  if (capabilityList.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: 32, padding: 24 }}>
      <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, fontWeight: 600 }}>
        🤝 Capacidades
      </h3>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {capabilityList.map((cap, idx) => (
          <span 
            key={idx}
            style={{ 
              padding: '8px 16px', 
              background: 'var(--bg-sidebar)', 
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
    </div>
  );
}
