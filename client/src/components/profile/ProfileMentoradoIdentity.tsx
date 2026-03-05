import React from 'react';

export interface ProfileMentoradoIdentityProps {
  name: string;
  photoUrl?: string;
  cidade?: string;
  isExpert: boolean;
  isCoprodutor: boolean;
  /** Se true, exibe selo "Mentorado Fluxo" */
  isMentoradoFluxo?: boolean;
  onEdit?: () => void;
}

export function ProfileMentoradoIdentity({
  name,
  photoUrl,
  cidade,
  isExpert,
  isCoprodutor,
  isMentoradoFluxo,
  onEdit,
}: ProfileMentoradoIdentityProps) {
  const badgeLabel = isExpert ? 'Expert' : isCoprodutor ? 'Coprodutor' : '';
  const showFluxoBadge = isMentoradoFluxo;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        marginTop: -64,
      }}
    >
      <div style={{ position: 'relative' }}>
        <div
          style={{
            width: 128,
            height: 128,
            borderRadius: '50%',
            border: '4px solid var(--bg-white)',
            overflow: 'hidden',
            background: 'var(--bg-secondary)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={`Foto de ${name}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontSize: 40,
                fontWeight: 600,
              }}
            >
              {name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        {(badgeLabel || showFluxoBadge) && (
          <div style={{ position: 'absolute', bottom: 4, right: 4, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
            {showFluxoBadge && (
              <span
                className="badge-mentorado-fluxo"
                style={{
                  background: 'linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%)',
                  color: 'white',
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '3px 6px',
                  borderRadius: 9999,
                  border: '2px solid var(--bg-white)',
                  boxShadow: 'var(--shadow)',
                }}
              >
                Fluxo
              </span>
            )}
            {badgeLabel && (
              <span
                style={{
                  background: 'var(--accent)',
                  color: 'var(--text-primary)',
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '4px 8px',
                  borderRadius: 9999,
                  border: '2px solid var(--bg-white)',
                  boxShadow: 'var(--shadow)',
                }}
              >
                {badgeLabel}
              </span>
            )}
          </div>
        )}
      </div>
      <div style={{ marginTop: 16 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          {name}
        </h2>
        {cidade && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              marginTop: 8,
              color: 'var(--text-secondary)',
              fontSize: 14,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              location_on
            </span>
            <span>{cidade}</span>
          </div>
        )}
      </div>
      {onEdit && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 12,
            marginTop: 24,
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={onEdit}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              edit
            </span>
            Editar Perfil
          </button>
        </div>
      )}
    </div>
  );
}
