import { useState } from 'react';
import { ProfileFormData } from '../../hooks/useProfileFormNew';

interface ProjectsSectionProps {
  formData: ProfileFormData;
  onChange: (data: Partial<ProfileFormData>) => void;
}

export function ProjectsSection({ formData, onChange }: ProjectsSectionProps) {
  const projetos = formData.projects || [];
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());

  const addProject = () => {
    const newIndex = projetos.length;
    onChange({
      projects: [...projetos, { nome: '', descricao: '', ano: null, tags: [], link: '' }]
    });
    setEditingIndex(newIndex);
    setExpandedProjects(new Set([...expandedProjects, newIndex]));
  };

  const updateProject = (index: number, field: string, value: any) => {
    const updated = [...projetos];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ projects: updated });
  };

  const updateProjectTags = (index: number, tagsString: string) => {
    const tags = tagsString.split(',').map(t => t.trim()).filter(t => t);
    updateProject(index, 'tags', tags);
  };

  const removeProject = (index: number) => {
    onChange({
      projects: projetos.filter((_: any, i: number) => i !== index)
    });
    setEditingIndex(null);
    const newExpanded = new Set(expandedProjects);
    newExpanded.delete(index);
    setExpandedProjects(newExpanded);
  };

  const toggleProject = (index: number) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
      setEditingIndex(null);
    } else {
      newExpanded.add(index);
      setEditingIndex(index);
    }
    setExpandedProjects(newExpanded);
  };

  const isExpanded = (index: number) => expandedProjects.has(index);

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Projetos</h3>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={addProject}
          style={{ padding: '6px 12px', fontSize: 14 }}
        >
          + Adicionar Projeto
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {projetos.map((projeto: any, index: number) => {
          const expanded = isExpanded(index);
          const hasName = projeto.nome && projeto.nome.trim() !== '';

          // Se o projeto tem nome e não está expandido, mostrar modo resumido
          if (hasName && !expanded) {
            return (
              <div 
                key={index} 
                style={{ 
                  padding: '12px 16px', 
                  background: 'var(--bg)', 
                  borderRadius: 'var(--radius)', 
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => toggleProject(index)}
              >
                <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{projeto.nome}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleProject(index);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '4px 12px', fontSize: 12 }}
                >
                  Editar
                </button>
              </div>
            );
          }

          // Modo edição (expandido)
          return (
            <div 
              key={index} 
              style={{ 
                padding: 20, 
                background: 'var(--bg)', 
                borderRadius: 'var(--radius)', 
                border: '1px solid var(--border)' 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Projeto {index + 1}</h4>
                <div style={{ display: 'flex', gap: 8 }}>
                  {hasName && (
                    <button
                      type="button"
                      onClick={() => toggleProject(index)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 12px', fontSize: 12 }}
                    >
                      Fechar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeProject(index)}
                    style={{ 
                      padding: '4px 12px', 
                      background: 'var(--error)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: 'var(--radius)', 
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    Remover
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label>Nome</label>
                <input
                  type="text"
                  value={projeto.nome || ''}
                  onChange={(e) => updateProject(index, 'nome', e.target.value)}
                  placeholder="Nome do projeto"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              
              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  rows={4}
                  value={projeto.descricao || ''}
                  onChange={(e) => updateProject(index, 'descricao', e.target.value)}
                  placeholder="Descrição do projeto"
                  style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Ano</label>
                  <input
                    type="number"
                    min="2000"
                    max={new Date().getFullYear() + 1}
                    value={projeto.ano || ''}
                    onChange={(e) => updateProject(index, 'ano', e.target.value ? parseInt(e.target.value, 10) : null)}
                    placeholder="2024"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                
                <div className="form-group">
                  <label>Link do Portfólio</label>
                  <input
                    type="url"
                    value={projeto.link || ''}
                    onChange={(e) => updateProject(index, 'link', e.target.value)}
                    placeholder="https://..."
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={projeto.tags?.join(', ') || ''}
                  onChange={(e) => updateProjectTags(index, e.target.value)}
                  placeholder="marketing, digital, automação"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          );
        })}
        
        {projetos.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, fontStyle: 'italic', textAlign: 'center', padding: 24 }}>
            Nenhum projeto adicionado. Clique em "Adicionar Projeto" para começar.
          </p>
        )}
      </div>
    </div>
  );
}
