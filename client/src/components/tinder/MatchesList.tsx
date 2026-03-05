interface Match {
  id: number;
  otherUser: {
    id: string;
    name: string;
    photo_url?: string;
    type?: string;
    whatsapp?: string;
  } | null;
  type: string;
}

interface MatchesListProps {
  matches: Match[];
  onViewWhatsApp: (whatsapp: string) => void;
  onViewProfile?: (userId: string) => void;
}

function whatsappLink(whatsapp: string): string {
  const digits = (whatsapp || '').replace(/\D/g, '');
  if (!digits.length) return '';
  const withCountry = digits.length <= 11 && !digits.startsWith('55') ? '55' + digits : digits;
  return `https://wa.me/${withCountry}`;
}

export default function MatchesList({ matches, onViewWhatsApp, onViewProfile }: MatchesListProps) {
  if (matches.length === 0) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Você ainda não fez nenhuma conexão.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ 
        fontSize: 18, 
        fontWeight: 600, 
        marginBottom: 16,
        color: 'var(--text)'
      }}>
        Suas Conexões
      </h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 16
      }}>
        {matches.map((match) => {
          const user = match.otherUser;
          if (!user) return null;

          const name = user.name || 'Usuário';
          const typeLabel = user.type || match.type || '';
          const photoUrl = user.photo_url;
          const whatsapp = user.whatsapp;

          return (
            <div 
              key={match.id} 
              className="card"
              style={{ 
                padding: 16,
                textAlign: 'center'
              }}
            >
              <div style={{ marginBottom: 12 }}>
                {photoUrl ? (
                  <img 
                    src={photoUrl} 
                    alt={name}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      margin: '0 auto',
                      border: '2px solid var(--border)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    fontSize: 20,
                    fontWeight: 600,
                    margin: '0 auto'
                  }}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <h4 style={{ 
                margin: '0 0 4px 0', 
                fontSize: 15, 
                fontWeight: 600,
                color: 'var(--text)'
              }}>
                {name}
              </h4>

              {typeLabel && (
                <p style={{ 
                  margin: '0 0 12px 0', 
                  fontSize: 12, 
                  color: 'var(--text-secondary)'
                }}>
                  {typeLabel}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                {whatsapp ? (
                  <a
                    href={whatsappLink(whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ width: '100%', fontSize: 12, padding: '8px 16px' }}
                  >
                    Ver WhatsApp
                  </a>
                ) : (
                  <span style={{ 
                    fontSize: 11, 
                    color: 'var(--text-muted)',
                    textAlign: 'center'
                  }}>
                    WhatsApp não informado
                  </span>
                )}
                {onViewProfile && (
                  <button
                    className="btn btn-outline"
                    onClick={() => onViewProfile(user.id)}
                    style={{ width: '100%', fontSize: 12, padding: '8px 16px' }}
                  >
                    Ver perfil
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
