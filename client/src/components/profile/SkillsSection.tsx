import { ProfileFormData } from '../../hooks/useProfileFormNew';

interface SkillsSectionProps {
  formData: ProfileFormData;
  onChange: (data: Partial<ProfileFormData>) => void;
}

const mainSkills = [
  { key: 'copywriter' as const, label: 'Copywriter' },
  { key: 'trafego_pago' as const, label: 'Tráfego Pago' },
  { key: 'automacao_ia' as const, label: 'Automação & IA' },
];

export function SkillsSection({ formData, onChange }: SkillsSectionProps) {
  const skills = formData.skills || {};
  const skillsExtra = formData.skillsExtra || [];

  const updateMainSkill = (key: 'copywriter' | 'trafego_pago' | 'automacao_ia', nivel: number) => {
    onChange({
      skills: { ...skills, [key]: nivel }
    });
  };

  const addExtraSkill = () => {
    onChange({
      skillsExtra: [...skillsExtra, { nome: '', nivel: 0 }]
    });
  };

  const updateExtraSkill = (index: number, field: 'nome' | 'nivel', value: string | number) => {
    const updated = [...skillsExtra];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ skillsExtra: updated });
  };

  const removeExtraSkill = (index: number) => {
    onChange({
      skillsExtra: skillsExtra.filter((_, i) => i !== index)
    });
  };

  return (
    <div style={{ marginTop: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
      <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
        Habilidades
      </h3>
      
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: 14 }}>
          Principais
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mainSkills.map(skill => (
            <div key={skill.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontWeight: 500 }}>{skill.label}</label>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  {skills[skill.key] || 0}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={skills[skill.key] || 0}
                onChange={(e) => updateMainSkill(skill.key, parseInt(e.target.value, 10))}
                style={{ width: '100%' }}
              />
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <label style={{ fontWeight: 600, fontSize: 14 }}>Extras</label>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={addExtraSkill}
            style={{ padding: '4px 12px', fontSize: 12 }}
          >
            + Adicionar
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {skillsExtra.map((skill, index) => (
            <div key={index} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Nome da habilidade"
                value={skill.nome}
                onChange={(e) => updateExtraSkill(index, 'nome', e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                type="range"
                min="0"
                max="100"
                value={skill.nivel}
                onChange={(e) => updateExtraSkill(index, 'nivel', parseInt(e.target.value, 10))}
                style={{ width: '120px' }}
              />
              <span style={{ width: '40px', textAlign: 'center', fontSize: 12 }}>
                {skill.nivel}%
              </span>
              <button
                type="button"
                onClick={() => removeExtraSkill(index)}
                style={{ padding: '4px 8px', background: 'var(--error)', color: 'white', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
          ))}
          {skillsExtra.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, fontStyle: 'italic' }}>
              Nenhuma habilidade extra adicionada
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
