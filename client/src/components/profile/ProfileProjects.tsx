import { useState } from 'react';

interface ProfileProject {
  id?: string;
  nome: string;
  descricao?: string;
  ano?: number;
  tags?: string[];
  link?: string;
  link_portfolio?: string;
}

interface ProfileProjectsProps {
  projects: ProfileProject[];
  isPrestador?: boolean; // Se for prestador, mostra vazio mesmo sem projetos
}

export function ProfileProjects({ projects, isPrestador = false }: ProfileProjectsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Se não for prestador e não tiver projetos, não mostrar nada
  if (!isPrestador && projects.length === 0) {
    return null;
  }

  // Se for prestador e não tiver projetos, mostrar vazio
  if (isPrestador && projects.length === 0) {
    return (
      <div className="card" style={{ marginBottom: 32, padding: 24 }}>
        <h2 style={{ margin: 0, marginBottom: 20, fontSize: 20, fontWeight: 600 }}>
          Projetos Concluídos
        </h2>
        <div style={{ 
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 14
        }}>
          Nenhum projeto cadastrado
        </div>
      </div>
    );
  }

  const nextProject = () => {
    setCurrentIndex((prev) => (prev + 1) % projects.length);
  };

  const prevProject = () => {
    setCurrentIndex((prev) => (prev - 1 + projects.length) % projects.length);
  };

  const currentProject = projects[currentIndex];

  return (
    <div className="card" style={{ marginBottom: 32, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
          Projetos Concluídos
        </h2>
        {projects.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {currentIndex + 1} / {projects.length}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={prevProject}
                style={{
                  padding: '6px 12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: 'var(--text)'
                }}
              >
                ←
              </button>
              <button
                onClick={nextProject}
                style={{
                  padding: '6px 12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: 'var(--text)'
                }}
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <div
          key={currentProject.id || currentIndex}
          style={{
            padding: '16px 20px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            minHeight: '150px'
          }}
        >
          {/* LINE 1: Project name on the left, Year aligned to the right */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 10
          }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
              {currentProject.nome}
            </h3>
            {currentProject.ano && (
              <span style={{ 
                padding: '4px 10px',
                borderRadius: 'var(--radius)',
                background: 'var(--bg)',
                fontSize: 13,
                color: 'var(--text-secondary)',
                fontWeight: 600
              }}>
                {currentProject.ano}
              </span>
            )}
          </div>
          
          {/* LINE 2: Short description */}
          {currentProject.descricao && (
            <p style={{ 
              margin: '0 0 12px 0', 
              color: 'var(--text-secondary)', 
              fontSize: 14,
              lineHeight: 1.6
            }}>
              {currentProject.descricao}
            </p>
          )}
          
          {/* LINE 3: Tags */}
          {currentProject.tags && currentProject.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {currentProject.tags.map((tag, idx) => (
                <span 
                  key={idx}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius)',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 500
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {/* Optional link */}
          {(currentProject.link || currentProject.link_portfolio) && (
            <div style={{ marginTop: 10 }}>
              <a 
                href={currentProject.link || currentProject.link_portfolio} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 500
                }}
              >
                Ver portfólio →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
