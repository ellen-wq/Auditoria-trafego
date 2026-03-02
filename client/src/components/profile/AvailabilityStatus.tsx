interface AvailabilityStatusProps {
  disponivel: boolean;
  horasSemanais: number;
  modeloTrabalho: 'remoto' | 'hibrido' | 'presencial';
  idiomas: string[];
  availabilityTags?: string[];
}

const modeloTrabalhoLabels: Record<string, string> = {
  remoto: 'Remoto',
  hibrido: 'Híbrido',
  presencial: 'Presencial'
};

export function AvailabilityStatus({ 
  disponivel, 
  horasSemanais, 
  modeloTrabalho, 
  idiomas,
  availabilityTags = [],
}: AvailabilityStatusProps) {
  const availabilityLabels: Record<string, string> = {
    projetos: 'Projetos',
    parcerias: 'Parcerias',
    coproducao: 'Coprodução',
    sociedade: 'Sociedade'
  };

  // Remover status "Disponível/Indisponível" - destacar apenas as opções selecionadas
  const hasAvailabilityTags = availabilityTags && availabilityTags.length > 0;

  // Se não tem tags selecionadas, não mostrar nada (será obrigatório no formulário)
  if (!hasAvailabilityTags) {
    return null;
  }

  return (
    <div className="card" style={{ marginBottom: 32, padding: '16px 24px' }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: 16
      }}>
        {/* Destacar apenas o que está disponível */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
            Interesses:
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {availabilityTags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--green)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)'
                }}
              >
                {availabilityLabels[tag] || tag}
              </span>
            ))}
          </div>
        </div>

        {/* Horas disponíveis - abaixo dos botões de disponibilidade */}
        {horasSemanais > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
              Horas disponíveis:
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
              {horasSemanais}h/semana
            </span>
          </div>
        )}

        {/* Idiomas - abaixo das horas disponíveis */}
        {idiomas.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
              Idiomas:
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {idiomas.map((idioma, idx) => (
                <span 
                  key={idx}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 'var(--radius)',
                    background: 'var(--bg-secondary)',
                    fontSize: 12,
                    color: 'var(--text)',
                    fontWeight: 500
                  }}
                >
                  {idioma}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
