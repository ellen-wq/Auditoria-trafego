import { useNavigate } from 'react-router-dom';

interface ProfileDiscoveryCardProps {
  profile: {
    id: string;
    name: string;
    photo_url?: string;
    isExpert?: boolean;
    isCoprodutor?: boolean;
    /** Objetivo - tinder_mentor_profiles.goal_text - exibido abaixo do nome */
    objective?: string;
    /** Bio - tinder_mentor_profiles.bio */
    bio?: string;
    /** Nicho - tinder_mentor_profiles.niche */
    niche?: string;
    /** Interesses (availability_tags): Projetos, Parcerias, Coprodução, Sociedade */
    formato?: string;
    // Expert fields
    products?: Array<{
      id?: string;
      tipo_produto: string;
      preco: number;
      modelo: string;
      nicho?: string;
    }>;
    needs?: {
      precisa_trafego_pago?: boolean;
      precisa_copy?: boolean;
      precisa_automacoes?: boolean;
      precisa_estrategista?: boolean;
    };
    // Coprodutor fields
    capabilities?: {
      faz_perpetuo?: boolean;
      faz_pico_vendas?: boolean;
      faz_trafego_pago?: boolean;
      faz_copy?: boolean;
      faz_automacoes?: boolean;
    };
    skills?: Array<{
      categoria: string;
      nivel: number;
    }>;
    skillsExtra?: Array<{
      nome: string;
      nivel: number;
    }>;
    projects?: Array<{
      nome: string;
      descricao?: string;
      tags?: string[];
    }>;
  };
  onPass: () => void;
  onMatch: () => void;
  onSwipe?: (direction: 'left' | 'right') => void;
  isSendingInterest?: boolean;
  /** Se o perfil está nos favoritos do usuário logado */
  isFavorited?: boolean;
  /** Callback ao clicar na estrela (favoritar/desfavoritar) */
  onFavorite?: () => void;
}

const categoriaLabels: Record<string, string> = {
  'copywriter': 'Copywriter',
  'trafego_pago': 'Tráfego Pago',
  'automacao_ia': 'Automação & IA',
};

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
  const profileType = profile.isExpert
    ? 'Expert'
    : profile.isCoprodutor
    ? 'Coprodutor'
    : '';

  const profileTypeColor = profile.isCoprodutor ? 'var(--purple)' : 'var(--accent-dark)';

  // Get needs for Expert
  const needs = profile.needs ? Object.entries(profile.needs)
    .filter(([_, value]) => value === true)
    .map(([key]) => needLabels[key] || key)
    .slice(0, 4) : [];
  const needsRemaining = (profile.needs ? Object.values(profile.needs).filter(v => v === true).length : 0) - needs.length;

  // Get top 3 capabilities for Coprodutor
  const capabilities = profile.capabilities ? Object.entries(profile.capabilities)
    .filter(([_, value]) => value === true)
    .map(([key]) => capabilityLabels[key] || key)
    .slice(0, 3) : [];
  const capabilitiesRemaining = (profile.capabilities ? Object.values(profile.capabilities).filter(v => v === true).length : 0) - capabilities.length;

  // Top 3 skills com maior % (para barras de progresso no conteúdo)
  const allSkillsTop3 = [
    ...(profile.skills || []).map(s => ({ nome: categoriaLabels[s.categoria] || s.categoria, nivel: s.nivel })),
    ...(profile.skillsExtra || [])
  ].sort((a, b) => b.nivel - a.nivel).slice(0, 3);

  return (
    <div className="card" data-discovery-card="v2" style={{ 
      padding: 0,
      marginBottom: 24,
      maxWidth: 600,
      margin: '0 auto 24px',
      overflow: 'hidden',
      background: 'var(--bg-white)',
      border: '1px solid var(--border)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
    }}>
      {/* Layout: foto à esquerda (45%), detalhes à direita (55%) - conforme spec */}
      <div style={{ display: 'flex', flexDirection: 'row', minHeight: 320 }}>
        {/* Lado da foto */}
        <div style={{ 
          width: '45%', 
          minHeight: 280, 
          background: 'var(--bg-secondary)', 
          position: 'relative',
          backgroundImage: profile.photo_url ? `url(${profile.photo_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          {!profile.photo_url && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: 48,
              fontWeight: 600
            }}>
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Lado dos detalhes */}
        <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {/* Nome, badge Expert/Coprodutor e botão favoritar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
                {profile.name}
              </h2>
              {profileType && (
                <span style={{
                  flexShrink: 0,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-xs)',
                  background: profileTypeColor,
                  color: 'white',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {profileType}
                </span>
              )}
            </div>
            {onFavorite && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onFavorite(); }}
                aria-label={isFavorited ? 'Remover dos favoritos' : 'Favoritar'}
                style={{
                  flexShrink: 0,
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'transparent',
                  color: isFavorited ? 'var(--green)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 22,
                  transition: 'color 0.15s, transform 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--green)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isFavorited ? 'var(--green)' : 'var(--text-muted)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isFavorited ? '"FILL" 1' : '"FILL" 0' }}>star</span>
              </button>
            )}
            <div style={{ position: 'absolute', top: 16, left: 16 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 9999, background: 'var(--expert-primary)', color: '#0f172a', fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>bolt</span>
                95% MATCH
              </span>
            </div>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent 40%, transparent)' }} />
            <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9999, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', color: 'var(--expert-slate-800)', fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--expert-accent-blue)' }}>verified</span>
                Verificado
              </span>
            </div>
          </div>
          {/* Objetivo abaixo do nome */}
          {profile.objective && (
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--green)', marginBottom: 12 }}>
              {profile.objective}
            </p>
          )}

          {/* Nicho e Interesses em grid */}
          {(profile.niche || profile.formato) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {profile.niche && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--expert-slate-400)', margin: '0 0 8px 0' }}>Nicho</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--expert-slate-700)', margin: 0 }}>{profile.niche}</p>
                </div>
              )}
              {profile.formato && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>Interesses</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>{profile.formato}</p>
                </div>
              )}
            </div>
          )}

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* EXPERT CONTENT */}
        {profile.isExpert && (
          <>
            {/* O QUE ELA PROCURA - Precisa de */}
            {needs.length > 0 && (
              <div>
                <label style={{ 
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: 'var(--text-secondary)', 
                  marginBottom: 8,
                  display: 'block'
                }}>
                  Precisa de:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {needs.map((need, idx) => (
                    <span 
                      key={idx}
                      style={{ 
                        padding: '8px 14px',
                        borderRadius: 'var(--radius)',
                        background: 'var(--green)',
                        color: 'white',
                        fontSize: 13,
                        fontWeight: 600,
                        boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)'
                      }}
                    >
                      {need}
                    </span>
                  ))}
                  {needsRemaining > 0 && (
                    <span style={{ 
                      padding: '8px 14px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--green)',
                      color: 'white',
                      fontSize: 13,
                      fontWeight: 600,
                      boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)'
                    }}>
                      +{needsRemaining}
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* COPRODUTOR CONTENT */}
        {profile.isCoprodutor && (
          <>
            {/* 1. O QUE A PESSOA FAZ MELHOR - Capacidades */}
            {capabilities.length > 0 && (
              <div>
                <label style={{ 
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: 'var(--text-secondary)', 
                  marginBottom: 8,
                  display: 'block'
                }}>
                  Capacidades
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {capabilities.map((cap, idx) => (
                    <span 
                      key={idx}
                      style={{ 
                        padding: '8px 16px', 
                        background: 'var(--bg-sidebar)', 
                        color: 'white',
                        borderRadius: 'var(--radius)',
                        fontSize: 13,
                        fontWeight: 600
                      }}
                    >
                      {cap}
                    </span>
                  ))}
                  {capabilitiesRemaining > 0 && (
                    <span style={{ 
                      padding: '8px 16px', 
                      background: 'var(--bg-sidebar)', 
                      color: 'white',
                      borderRadius: 'var(--radius)',
                      fontSize: 13,
                      fontWeight: 600
                    }}>
                      +{capabilitiesRemaining}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Habilidades (TOP 3 com maior %) */}
            {allSkillsTop3.length > 0 && (
              <div>
                <label style={{ 
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: 'var(--text-secondary)', 
                  marginBottom: 8,
                  display: 'block'
                }}>
                  Habilidades
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {allSkillsTop3.map((skill, idx) => (
                    <div key={idx}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 4
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                          {skill.nome}
                        </span>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        <div style={{
                          flex: 1,
                          height: 8,
                          background: 'var(--bg-secondary)',
                          borderRadius: 4,
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          <div style={{
                            width: `${skill.nivel}%`,
                            height: '100%',
                            background: 'var(--green)',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span style={{ 
                          fontSize: 13, 
                          color: 'var(--green)',
                          fontWeight: 600,
                          minWidth: 40,
                          textAlign: 'right'
                        }}>
                          {skill.nivel}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </>
        )}
        </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, marginTop: 48, zIndex: 30 }}>
        <button type="button" onClick={onPass} disabled={isSendingInterest} aria-label="Passar" style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid var(--expert-slate-200)', background: 'var(--bg-white)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isSendingInterest ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transition: 'transform 0.15s, background 0.15s' }} onMouseEnter={(e) => { if (!isSendingInterest) { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.transform = 'scale(1.1)'; } }} onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-white)'; e.currentTarget.style.transform = 'scale(1)'; }}>
          <span className="material-symbols-outlined" style={{ fontSize: 28, fontWeight: 700 }}>close</span>
        </button>
        <button type="button" onClick={() => navigate(`/tinder-do-fluxo/profile-view?userId=${profile.id}`)} aria-label="Ver perfil" style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid var(--expert-slate-200)', background: 'var(--bg-white)', color: 'var(--expert-accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transition: 'transform 0.15s, background 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(60, 131, 246, 0.08)'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-white)'; e.currentTarget.style.transform = 'scale(1)'; }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24, fontWeight: 700 }}>star</span>
        </button>
        <button type="button" onClick={onMatch} disabled={isSendingInterest} aria-label="Match" style={{ width: 80, height: 80, borderRadius: '50%', border: 'none', background: 'var(--expert-primary)', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isSendingInterest ? 'not-allowed' : 'pointer', boxShadow: '0 10px 30px rgba(190, 242, 100, 0.4)', transition: 'transform 0.15s, box-shadow 0.15s' }} onMouseEnter={(e) => { if (!isSendingInterest) { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(190, 242, 100, 0.5)'; } }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(190, 242, 100, 0.4)'; }}>
          <span className="material-symbols-outlined" style={{ fontSize: 36, fontWeight: 700, fontVariationSettings: "'FILL' 1" }}>favorite</span>
        </button>
      </div>
    </div>
  );
}
