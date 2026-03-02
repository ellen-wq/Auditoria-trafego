import { useNavigate } from 'react-router-dom';

interface ProfileDiscoveryCardProps {
  profile: {
    id: string;
    name: string;
    photo_url?: string;
    isExpert?: boolean;
    isCoprodutor?: boolean;
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
  onSwipe 
}: ProfileDiscoveryCardProps) {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/tinder-do-fluxo/profile-view?userId=${profile.id}`);
  };

  // Expert e Coprodutor são mutuamente exclusivos
  const profileType = profile.isExpert 
    ? 'Expert'
    : profile.isCoprodutor 
    ? 'Coprodutor'
    : '';

  const profileTypeColor = profile.isCoprodutor ? 'var(--purple)' : 'var(--accent-dark)';

  // Get top 3 products for Expert
  const products = profile.products?.slice(0, 3) || [];
  const productsRemaining = (profile.products?.length || 0) - products.length;

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

  // Get top 3 skills for Coprodutor (sorted by level)
  const allSkills = [
    ...(profile.skills || []).map(s => ({ nome: categoriaLabels[s.categoria] || s.categoria, nivel: s.nivel })),
    ...(profile.skillsExtra || [])
  ].sort((a, b) => b.nivel - a.nivel).slice(0, 3);

  // Get top 3 projects for Coprodutor
  const projects = profile.projects?.slice(0, 3) || [];
  const projectsRemaining = (profile.projects?.length || 0) - projects.length;

  return (
    <div className="card" style={{ 
      padding: 24,
      marginBottom: 24,
      maxWidth: 600,
      margin: '0 auto 24px'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12, 
        marginBottom: 20 
      }}>
        {profile.photo_url ? (
          <img 
            src={profile.photo_url} 
            alt={profile.name}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--border)'
            }}
          />
        ) : (
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: 18,
            fontWeight: 600
          }}>
            {profile.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: 18, 
            fontWeight: 600,
            color: 'var(--text)'
          }}>
            {profile.name}
          </h3>
          {profileType && (
            <span style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: 'var(--radius-xs)',
              background: profileTypeColor,
              color: 'white',
              fontSize: 11,
              fontWeight: 600,
              marginTop: 4
            }}>
              {profileType}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* EXPERT CONTENT */}
        {profile.isExpert && (
          <>
            {/* 1. O QUE A PESSOA FAZ MELHOR - Produtos */}
            {products.length > 0 && (
              <div>
                <label style={{ 
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: 'var(--text-secondary)', 
                  marginBottom: 8,
                  display: 'block'
                }}>
                  Produtos
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {products.map((product, idx) => (
                    <span 
                      key={product.id || idx}
                      style={{ 
                        padding: '8px 16px', 
                        background: 'var(--bg-sidebar)', 
                        color: 'white',
                        borderRadius: 'var(--radius)',
                        fontSize: 13,
                        fontWeight: 600
                      }}
                    >
                      {product.tipo_produto}
                    </span>
                  ))}
                  {productsRemaining > 0 && (
                    <span style={{ 
                      padding: '8px 16px', 
                      background: 'var(--bg-sidebar)', 
                      color: 'white',
                      borderRadius: 'var(--radius)',
                      fontSize: 13,
                      fontWeight: 600
                    }}>
                      +{productsRemaining}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 2. O QUE ELA PROCURA - Precisa de */}
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
            {allSkills.length > 0 && (
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
                  {allSkills.map((skill, idx) => (
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

            {/* 2. O QUE ELA PROCURA - Projetos */}
            {projects.length > 0 && (
              <div>
                <label style={{ 
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: 'var(--text-secondary)', 
                  marginBottom: 8,
                  display: 'block'
                }}>
                  Projetos
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {projects.map((project, idx) => (
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
                      {project.nome}
                    </span>
                  ))}
                  {projectsRemaining > 0 && (
                    <span style={{ 
                      padding: '8px 14px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--green)',
                      color: 'white',
                      fontSize: 13,
                      fontWeight: 600,
                      boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)'
                    }}>
                      +{projectsRemaining}
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ 
        display: 'flex', 
        gap: 12, 
        marginTop: 24,
        paddingTop: 20,
        borderTop: '1px solid var(--border)'
      }}>
        <button 
          className="btn btn-secondary"
          onClick={handleViewProfile}
          style={{ flex: 1 }}
        >
          Ver perfil
        </button>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: 12, 
        marginTop: 12
      }}>
        <button 
          className="btn btn-outline"
          onClick={onPass}
          style={{ flex: 1 }}
        >
          ❌ Passar
        </button>
        <button 
          className="btn btn-primary"
          onClick={onMatch}
          style={{ flex: 1 }}
        >
          👋 Match
        </button>
      </div>
    </div>
  );
}
