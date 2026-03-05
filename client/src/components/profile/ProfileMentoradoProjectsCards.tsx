import React from 'react';

export interface ProjectCardItem {
  id?: string;
  nome: string;
  descricao?: string;
  ano?: number;
  tags?: string[];
  link?: string;
  link_portfolio?: string;
}

export interface ProfileMentoradoProjectsCardsProps {
  projects: ProjectCardItem[];
}

const cardStyle: React.CSSProperties = {
  padding: 16,
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
};

export function ProfileMentoradoProjectsCards({ projects }: ProfileMentoradoProjectsCardsProps) {
  const list = projects || [];

  return (
    <section data-section="projetos-cards">
      {list.length === 0 ? (
        <div
          style={{
            padding: 24,
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 14,
          }}
        >
          Nenhum projeto cadastrado
        </div>
      ) : (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
          gap: 16,
        }}
        className="profile-mentorado-cards-grid"
      >
        {list.map((project, idx) => (
          <div key={project.id || `proj-${idx}`} style={cardStyle}>
            <span
              className="material-symbols-outlined"
              style={{ color: 'var(--green)', fontSize: 24, flexShrink: 0 }}
            >
              check_circle
            </span>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontWeight: 600,
                  fontSize: 15,
                  color: 'var(--text-primary)',
                }}
              >
                {project.nome}
              </p>
              {project.descricao && (
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: 14,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  {project.descricao}
                </p>
              )}
              {project.ano && (
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: 6,
                    fontSize: 12,
                    color: 'var(--text-muted)',
                  }}
                >
                  {project.ano}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      )}
    </section>
  );
}
