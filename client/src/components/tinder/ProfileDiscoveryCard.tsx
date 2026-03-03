import { useNavigate } from 'react-router-dom';

interface ProfileDiscoveryCardProps {
  profile: {
    id: string;
    name: string;
    photo_url?: string;
    isExpert?: boolean;
    isCoprodutor?: boolean;
    /** Objetivo / headline (ex.: "Especialista em Tráfego Pago") - exibido abaixo do nome */
    objective?: string;
    /** Bio - tinder_mentor_profiles.bio */
    bio?: string;
    /** Nicho - tinder_mentor_profiles.niche */
    niche?: string;
    /** Formato / tipo parceria - modelo_trabalho ou tipos de parceria */
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

  // Top 3 skills com maior % (para barras de progresso no conteúdo)
  const allSkillsTop3 = [
    ...(profile.skills || []).map(s => ({ nome: categoriaLabels[s.categoria] || s.categoria, nivel: s.nivel })),
    ...(profile.skillsExtra || [])
  ].sort((a, b) => b.nivel - a.nivel).slice(0, 3);

  // Tags do rodapé do card: habilidades (profile_skills + profile_skills_extra) – para Expert e Coprodutor
  const footerSkillTags = [
    ...(profile.skills || []).map(s => categoriaLabels[s.categoria] || s.categoria),
    ...(profile.skillsExtra || []).map(s => s.nome),
  ].filter(Boolean);

  // Get top 3 projects for Coprodutor
  const projects = profile.projects?.slice(0, 3) || [];
  const projectsRemaining = (profile.projects?.length || 0) - projects.length;

  return (
    <div className="card" style={{ 
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
          {/* Nome e badge Expert/Coprodutor na mesma linha */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
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
          {/* Objetivo abaixo do nome */}
          {profile.objective && (
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--green)', marginBottom: 12 }}>
              {profile.objective}
            </p>
          )}

          {/* Nicho e Formato em grid */}
          {(profile.niche || profile.formato) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {profile.niche && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>Nicho</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>{profile.niche}</p>
                </div>
              )}
              {profile.formato && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>Formato</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>{profile.formato}</p>
                </div>
              )}
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '0 0 6px 0' }}>Bio</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
                {profile.bio}
              </p>
            </div>
          )}

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
        </div>
      </div>

      {/* Tags do rodapé: habilidades (profile_skills + profile_skills_extra) */}
      {footerSkillTags.length > 0 && (
        <div style={{ 
          padding: '12px 20px', 
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          background: 'var(--bg-secondary)'
        }}>
          {footerSkillTags.map((tag, idx) => (
            <span
              key={idx}
              style={{
                padding: '6px 12px',
                background: 'var(--bg-sidebar)',
                color: 'white',
                borderRadius: 'var(--radius)',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions: X (passar), Coração (match); Ver Perfil Completo – estilo matte */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 24, 
        padding: 20,
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-white)'
      }}>
        <button
          type="button"
          onClick={onPass}
          aria-label="Passar"
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: '2px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 24,
            transition: 'transform 0.15s, background 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
            e.currentTarget.style.color = 'var(--red)';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-secondary)';
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ✕
        </button>
        <button
          type="button"
          onClick={onMatch}
          aria-label="Match"
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            border: 'none',
            background: 'var(--green)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 28,
            boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.45)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(34, 197, 94, 0.35)';
          }}
        >
          ♥
        </button>
      </div>

      {/* Ver Perfil Completo - botão flutuante/abaixo */}
      <div style={{ padding: '0 20px 20px', textAlign: 'center' }}>
        <button 
          type="button"
          className="btn btn-outline"
          onClick={handleViewProfile}
          style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 9999,
            border: '1px solid var(--border)',
            background: 'var(--bg-white)',
            color: 'var(--text)',
            fontWeight: 600,
            fontSize: 14
          }}
        >
          Ver Perfil Completo
          <span style={{ fontSize: 16 }}>→</span>
        </button>
      </div>
    </div>
  );
}
