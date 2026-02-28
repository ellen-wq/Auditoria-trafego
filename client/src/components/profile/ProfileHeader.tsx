interface ProfileHeaderProps {
  name: string;
  headline: string;
  photoUrl?: string;
  cidade?: string;
  objetivo?: string;
  anosExperiencia?: number;
  horasSemanais?: number;
  modeloTrabalho?: string;
  onEdit: () => void;
  onProposeProject?: () => void;
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
  objetivo,
  anosExperiencia,
  horasSemanais,
  modeloTrabalho,
  onEdit, 
  onProposeProject 
}: ProfileHeaderProps) {
  return (
    <div className="card" style={{ marginBottom: 32, padding: 24 }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0 }}>
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
          
          {/* Objetivo - destacado no topo para visualização rápida */}
          {objetivo && (
            <div style={{
              marginTop: 0,
              marginBottom: 16,
              padding: '12px 16px',
              background: 'var(--blue-light)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--blue)',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}>
              <p style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--blue)',
                lineHeight: 1.5
              }}>
                🎯 {objetivo}
              </p>
            </div>
          )}
          
          {/* Compact info row: anos experiência e modelo trabalho */}
          {(anosExperiencia !== undefined || modeloTrabalho) && (
            <div style={{ 
              display: 'flex', 
              gap: 20, 
              alignItems: 'center',
              marginBottom: 16,
              paddingTop: 8,
              borderTop: '1px solid var(--border)',
              flexWrap: 'wrap'
            }}>
              {anosExperiencia !== undefined && anosExperiencia > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Experiência:</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                    {anosExperiencia} {anosExperiencia === 1 ? 'ano' : 'anos'}
                  </span>
                </div>
              )}
              {modeloTrabalho && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Modelo:</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                    {modeloTrabalhoLabels[modeloTrabalho] || modeloTrabalho}
                  </span>
                </div>
              )}
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
