interface ProfileSkillsProps {
  skills?: Array<{
    categoria: string;
    nivel: number;
  }>;
  skillsExtra?: Array<{
    nome: string;
    nivel: number;
  }>;
}

const categoriaLabels: Record<string, string> = {
  'copywriter': 'Copywriter',
  'trafego_pago': 'Tráfego Pago',
  'automacao_ia': 'Automação & IA',
};

export function ProfileSkills({ skills = [], skillsExtra = [] }: ProfileSkillsProps) {
  const hasMainSkills = skills && skills.length > 0;
  const hasExtraSkills = skillsExtra && skillsExtra.length > 0;

  if (!hasMainSkills && !hasExtraSkills) {
    return null;
  }

  return (
    <div className="card" style={{ marginBottom: 32, padding: 24 }}>
      <h2 style={{ 
        marginTop: 0, 
        marginBottom: 20, 
        fontSize: 22, 
        fontWeight: 700,
        color: 'var(--text)',
        letterSpacing: '-0.3px'
      }}>
        Habilidades
      </h2>
      
      {/* Todas as habilidades com o mesmo estilo (unificado) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Habilidades principais */}
        {skills.map((skill, idx) => (
          <div key={idx}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4
            }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                {categoriaLabels[skill.categoria] || skill.categoria}
              </span>
              <span style={{ 
                fontSize: 13, 
                color: 'var(--text-muted)',
                fontWeight: 500
              }}>
                {skill.nivel}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: 6,
              background: 'var(--bg-secondary)',
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${skill.nivel}%`,
                height: '100%',
                background: 'var(--text-muted)',
                opacity: 0.4,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        ))}
        
        {/* Habilidades extras */}
        {skillsExtra.map((skill, idx) => (
          <div key={`extra-${idx}`}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4
            }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                {skill.nome}
              </span>
              <span style={{ 
                fontSize: 13, 
                color: 'var(--text-muted)',
                fontWeight: 500
              }}>
                {skill.nivel}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: 6,
              background: 'var(--bg-secondary)',
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${skill.nivel}%`,
                height: '100%',
                background: 'var(--text-muted)',
                opacity: 0.4,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
