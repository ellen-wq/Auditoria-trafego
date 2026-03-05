import { useNavigate } from 'react-router-dom';

interface ProfileDiscoveryCardProps {
  profile: {
    id: string;
    name: string;
    photo_url?: string;
    isExpert?: boolean;
    isCoprodutor?: boolean;
    objective?: string;
    bio?: string;
    niche?: string;
    formato?: string;
    needs?: {
      precisa_trafego_pago?: boolean;
      precisa_copy?: boolean;
      precisa_automacoes?: boolean;
      precisa_estrategista?: boolean;
    };
    capabilities?: {
      faz_perpetuo?: boolean;
      faz_pico_vendas?: boolean;
      faz_trafego_pago?: boolean;
      faz_copy?: boolean;
      faz_automacoes?: boolean;
    };
  };
  onPass: () => void;
  onMatch: () => void;
  onSwipe?: (direction: 'left' | 'right') => void;
  isSendingInterest?: boolean;
  isFavorited?: boolean;
  onFavorite?: () => void;
}

const needLabels: Record<string, string> = {
  'precisa_trafego_pago': 'Tráfego Pago',
  'precisa_copy': 'Copy',
  'precisa_automacoes': 'Automações',
  'precisa_estrategista': 'Estrategista',
};

const capabilityLabels: Record<string, string> = {
  'faz_perpetuo': 'Perpétuo',
  'faz_pico_vendas': 'Pico de Vendas',
  'faz_trafego_pago': 'Tráfego Pago',
  'faz_copy': 'Copy',
  'faz_automacoes': 'Automações',
};

export default function ProfileDiscoveryCard({
  profile,
  onPass,
  onMatch,
  onSwipe,
  isSendingInterest = false,
  isFavorited = false,
  onFavorite,
}: ProfileDiscoveryCardProps) {
  const navigate = useNavigate();
  const profileType = profile.isExpert ? 'Expert' : profile.isCoprodutor ? 'Coprodutor' : '';

  const needs = profile.needs
    ? Object.entries(profile.needs)
        .filter(([, v]) => v === true)
        .map(([k]) => needLabels[k] || k)
        .slice(0, 4)
    : [];
  const capabilities = profile.capabilities
    ? Object.entries(profile.capabilities)
        .filter(([, v]) => v === true)
        .map(([k]) => capabilityLabels[k] || k)
        .slice(0, 5)
    : [];

  return (
    <div
      data-discovery-card="v2"
      style={{
        width: 800,
        height: 550,
        flexShrink: 0,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      {/* Foto 45% */}
      <div
        style={{
          width: '45%',
          flexShrink: 0,
          position: 'relative',
          background: '#e2e8f0',
          backgroundImage: profile.photo_url ? `url(${profile.photo_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {!profile.photo_url && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              fontSize: 48,
              fontWeight: 600,
            }}
          >
            {profile.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Detalhes 55% - layout referência */}
      <div
        style={{
          flex: 1,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        {/* Nome + badge na mesma linha */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 30,
                fontWeight: 700,
                color: '#0f172a',
                lineHeight: 1.2,
              }}
            >
              {profile.name}
            </h2>
            {profile.objective && (
              <p
                style={{
                  margin: 0,
                  marginTop: 4,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#65a30d',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>bolt</span>
                {profile.objective}
              </p>
            )}
          </div>
          {profileType && (
            <span
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: 8,
                background: profileType === 'Coprodutor' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(190, 242, 100, 0.25)',
                border: `1px solid ${profileType === 'Coprodutor' ? '#8b5cf6' : '#a3e635'}`,
                color: profileType === 'Coprodutor' ? '#7c3aed' : '#65a30d',
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {profileType}
            </span>
          )}
        </div>

        {/* Grid Nicho + Formato */}
        {(profile.niche || profile.formato) && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 24,
              marginBottom: 32,
            }}
          >
            {profile.niche && (
              <div>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#94a3b8',
                    margin: '0 0 8px 0',
                  }}
                >
                  Nicho
                </p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#334155', margin: 0 }}>{profile.niche}</p>
              </div>
            )}
            {profile.formato && (
              <div>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#94a3b8',
                    margin: '0 0 8px 0',
                  }}
                >
                  Formato
                </p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#334155', margin: 0 }}>{profile.formato}</p>
              </div>
            )}
          </div>
        )}

        {/* Bio */}
        {profile.bio && (
          <div style={{ marginBottom: 32 }}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#94a3b8',
                margin: '0 0 12px 0',
              }}
            >
              Bio
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: '#334155',
                lineHeight: 1.6,
              }}
            >
              {profile.bio}
            </p>
          </div>
        )}

        {/* Rodapé: título discreto + Necessidades ou Capacidades (tags) */}
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          {profile.isExpert && needs.length > 0 && (
            <>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#94a3b8',
                  margin: '0 0 8px 0',
                }}
              >
                Necessidades
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {needs.map((label, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      color: '#475569',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </>
          )}
          {profile.isCoprodutor && capabilities.length > 0 && (
            <>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#94a3b8',
                  margin: '0 0 8px 0',
                }}
              >
                Capacidades
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {capabilities.map((label, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      color: '#475569',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProfileDiscoveryCardActions({
  profile,
  onPass,
  onMatch,
  onFavorite,
  isSendingInterest,
  isFavorited,
}: {
  profile: { id: string };
  onPass: () => void;
  onMatch: () => void;
  onFavorite?: () => void;
  isSendingInterest: boolean;
  isFavorited: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        marginTop: 48,
        zIndex: 30,
      }}
    >
      <button
        type="button"
        onClick={onPass}
        disabled={isSendingInterest}
        aria-label="Passar"
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          border: '2px solid #e2e8f0',
          background: '#fff',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isSendingInterest ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          transition: 'transform 0.15s, background 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!isSendingInterest) {
            e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#fff';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 28, fontWeight: 700 }}>close</span>
      </button>
      {onFavorite ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onFavorite(); }}
          aria-label={isFavorited ? 'Remover dos favoritos' : 'Favoritar'}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: '2px solid #e2e8f0',
            background: '#fff',
            color: isFavorited ? '#BEF264' : '#3C83F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            transition: 'transform 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 24, fontWeight: 700, fontVariationSettings: isFavorited ? '"FILL" 1' : '"FILL" 0' }}>star</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => navigate(`/tinder-do-fluxo/profile-view?userId=${profile.id}`)}
          aria-label="Ver perfil"
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: '2px solid #e2e8f0',
            background: '#fff',
            color: '#3C83F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            transition: 'transform 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 24, fontWeight: 700 }}>star</span>
        </button>
      )}
      <button
        type="button"
        onClick={onMatch}
        disabled={isSendingInterest}
        aria-label="Match"
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          border: 'none',
          background: '#BEF264',
          color: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isSendingInterest ? 'not-allowed' : 'pointer',
          boxShadow: '0 10px 30px rgba(190, 242, 100, 0.4)',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!isSendingInterest) {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 12px 36px rgba(190, 242, 100, 0.5)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(190, 242, 100, 0.4)';
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 36, fontWeight: 700, fontVariationSettings: "'FILL' 1" }}>favorite</span>
      </button>
    </div>
  );
}
