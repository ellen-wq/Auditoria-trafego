interface MatchModalProps {
  isOpen: boolean;
  matchedUser: {
    id: string;
    name: string;
    photo_url?: string;
  } | null;
  currentUser: {
    name: string;
    photo_url?: string;
  } | null;
  isMutualMatch: boolean;
  onClose: () => void;
  onViewWhatsApp?: () => void;
  onContinue: () => void;
}

export default function MatchModal({
  isOpen,
  matchedUser,
  currentUser,
  isMutualMatch,
  onClose,
  onViewWhatsApp,
  onContinue,
}: MatchModalProps) {
  if (!isOpen || !matchedUser || !currentUser) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: 400,
          width: '100%',
          padding: 32,
          textAlign: 'center',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ 
          marginTop: 0, 
          marginBottom: 24, 
          fontSize: 24, 
          fontWeight: 700,
          color: 'var(--text)'
        }}>
          Deu match!
        </h2>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: 16,
          marginBottom: 24
        }}>
          {/* Current User Photo */}
          {currentUser.photo_url ? (
            <img 
              src={currentUser.photo_url} 
              alt={currentUser.name}
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--accent)'
              }}
            />
          ) : (
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: 24,
              fontWeight: 600,
              border: '3px solid var(--accent)'
            }}>
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          )}

          <span style={{ fontSize: 32 }}>👋</span>

          {/* Matched User Photo */}
          {matchedUser.photo_url ? (
            <img 
              src={matchedUser.photo_url} 
              alt={matchedUser.name}
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--accent)'
              }}
            />
          ) : (
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: 24,
              fontWeight: 600,
              border: '3px solid var(--accent)'
            }}>
              {matchedUser.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 12,
          marginTop: 24
        }}>
          {isMutualMatch && onViewWhatsApp ? (
            <button 
              className="btn btn-primary"
              onClick={onViewWhatsApp}
            >
              Ver WhatsApp
            </button>
          ) : (
            <p style={{ 
              color: 'var(--text-secondary)', 
              fontSize: 14,
              margin: 0
            }}>
              {isMutualMatch 
                ? 'Vocês demonstraram interesse mútuo!' 
                : 'Interesse registrado! Você será notificado quando houver match.'}
            </p>
          )}
          <button 
            className="btn btn-outline"
            onClick={onContinue}
          >
            Continuar explorando
          </button>
        </div>
      </div>
    </div>
  );
}
