interface ProfileHeaderProps {
  name: string;
  headline: string;
  photoUrl?: string;
  cidade?: string;
  onEdit: () => void;
  onProposeProject?: () => void;
  isExpert?: boolean;
  isCoprodutor?: boolean;
  // Necessidades do Expert
  precisaTrafegoPago?: boolean;
  precisaCopy?: boolean;
  precisaAutomacoes?: boolean;
  precisaEstrategista?: boolean;
  // Capacidades do Coprodutor
  fazPerpetuo?: boolean;
  fazPicoVendas?: boolean;
  fazTrafegoPago?: boolean;
  fazCopy?: boolean;
  fazAutomacoes?: boolean;
}

const modeloTrabalhoLabels: Record<string, string> = {
  remoto: 'Online',
  hibrido: 'Híbrido',
  presencial: 'Presencial',
  indiferente: 'Indiferente'
};

export function ProfileHeader({ 
  name, 
  headline, 
  photoUrl, 
  cidade,
  onEdit, 
  onProposeProject,
  isExpert,
  isCoprodutor,
  precisaTrafegoPago,
  precisaCopy,
  precisaAutomacoes,
  precisaEstrategista,
  fazPerpetuo,
  fazPicoVendas,
  fazTrafegoPago,
  fazCopy,
  fazAutomacoes
}: ProfileHeaderProps) {
  // Determinar necessidades do Expert
  const expertNeeds = [
    precisaTrafegoPago && 'Tráfego Pago',
    precisaCopy && 'Copy',
    precisaAutomacoes && 'Automações',
    precisaEstrategista && 'Estrategista'
  ].filter(Boolean);

  // Determinar capacidades do Coprodutor
  const coprodutorCapabilities = [
    fazPerpetuo && 'Perpétuo',
    fazPicoVendas && 'Pico de Vendas',
    fazTrafegoPago && 'Tráfego Pago',
    fazCopy && 'Copy',
    fazAutomacoes && 'Automações'
  ].filter(Boolean);

  return (
    <div className="card" style={{ marginBottom: 32, padding: 24 }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0, position: 'relative' }}>
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt={name}
              style={{ 
                width: 120, 
                height: 120, 
                borderRadius: '50%', 
                objectFit: 'cover',
                border: '3px solid var(--border)'
              }}
            />
          ) : (
            <div style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              color: 'var(--text-muted)',
              border: '3px solid var(--border)'
            }}>
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Badge Expert/Coprodutor na foto */}
          {(isExpert || isCoprodutor) && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              padding: '4px 10px',
              borderRadius: 'var(--radius)',
              background: 'var(--purple)',
              color: 'white',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              {isExpert ? 'Expert' : 'Coprodutor'}
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <h1 style={{ 
            marginTop: 0, 
            marginBottom: 8, 
            fontSize: 32, 
            fontWeight: 700,
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}>
            {name}
          </h1>
          {headline && (
            <p style={{ 
              marginTop: 0, 
              marginBottom: 12, 
              fontSize: 18, 
              color: 'var(--text-secondary)',
              fontWeight: 500,
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}>
              {headline}
            </p>
          )}
          {cidade && (
            <p style={{ 
              marginTop: 0, 
              marginBottom: 12, 
              fontSize: 14, 
              color: 'var(--text-muted)',
              wordBreak: 'break-word'
            }}>
              📍 {cidade}
            </p>
          )}
          
          {/* Necessidades do Expert - destacado no topo */}
          {isExpert && expertNeeds.length > 0 && (
            <div style={{
              marginTop: 0,
              marginBottom: 12,
              padding: '12px 16px',
              background: 'var(--bg-sidebar)',
              borderRadius: 'var(--radius)',
              border: '2px solid var(--bg-sidebar)',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              boxShadow: '0 2px 8px rgba(13, 21, 38, 0.3)'
            }}>
              <p style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                color: 'white',
                lineHeight: 1.5
              }}>
                ⚡ Precisa de: {expertNeeds.join(', ')}
              </p>
            </div>
          )}
          
          {/* Capacidades do Coprodutor - destacado no topo */}
          {isCoprodutor && coprodutorCapabilities.length > 0 && (
            <div style={{
              marginTop: 0,
              marginBottom: 12,
              padding: '12px 16px',
              background: 'var(--bg-sidebar)',
              borderRadius: 'var(--radius)',
              border: '2px solid var(--bg-sidebar)',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              boxShadow: '0 2px 8px rgba(13, 21, 38, 0.3)'
            }}>
              <p style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                color: 'white',
                lineHeight: 1.5
              }}>
                ✨ Capacidades: {coprodutorCapabilities.join(', ')}
              </p>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {onProposeProject && (
              <button className="btn btn-primary" onClick={onProposeProject}>
                Propor Projeto
              </button>
            )}
            <button className="btn btn-secondary" onClick={onEdit}>
              Editar Perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
