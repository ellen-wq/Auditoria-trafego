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
      <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 20, fontWeight: 600 }}>
        Habilidades
      </h2>
      
      {/* Habilidades Principais - Stronger visual hierarchy */}
      {hasMainSkills && (
        <div style={{ marginBottom: hasExtraSkills ? 28 : 0 }}>
          <h3 style={{ 
            marginTop: 0, 
            marginBottom: 16, 
            fontSize: 15, 
            fontWeight: 600,
            color: 'var(--text)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Principais
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {skills.map((skill, idx) => (
              <div key={idx}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6
                }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                    {categoriaLabels[skill.categoria] || skill.categoria}
                  </span>
                  <span style={{ 
                    fontSize: 15, 
                    color: 'var(--primary)',
                    fontWeight: 700
                  }}>
                    {skill.nivel}%
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: 10,
                  background: 'var(--bg-secondary)',
                  borderRadius: 5,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${skill.nivel}%`,
                    height: '100%',
                    background: 'var(--primary)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Habilidades Extras - Lighter and more compact */}
      {hasExtraSkills && (
        <div style={{ 
          paddingTop: hasMainSkills ? 24 : 0,
          borderTop: hasMainSkills ? '1px solid var(--border)' : 'none'
        }}>
          <h3 style={{ 
            marginTop: 0, 
            marginBottom: 12, 
            fontSize: 13, 
            fontWeight: 500,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Extras
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {skillsExtra.map((skill, idx) => (
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
      )}
    </div>
  );
}
