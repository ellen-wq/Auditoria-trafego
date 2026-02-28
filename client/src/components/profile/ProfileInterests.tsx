interface ProfileInterestsProps {
  objetivo?: string;
  goalText?: string;
  isExpert?: boolean;
  isCoproducer?: boolean;
}

export function ProfileInterests({ objetivo, goalText, isExpert, isCoproducer }: ProfileInterestsProps) {
  // Remover esta seção - o objetivo agora está no header
  // Manter apenas se houver isExpert ou isCoproducer sem objetivo
  if (!isExpert && !isCoproducer) {
    return null;
  }

  const interests: string[] = [];
  
  // Se houver objetivo, adicionar apenas uma vez (sem duplicatas)
  const text = objetivo || goalText;
  if (text) {
    // Remover duplicatas: dividir, limpar e usar Set para garantir unicidade
    const parts = text.split(/[.,;\n]/).filter(p => p.trim()).map(p => p.trim());
    const uniqueParts = Array.from(new Set(parts));
    interests.push(...uniqueParts);
  }

  // Se não houver interesses extraídos mas houver texto, usar o texto completo
  if (interests.length === 0 && text) {
    interests.push(text);
  }

  return (
    <div className="card" style={{ marginBottom: 32, padding: 24 }}>
      <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 20, fontWeight: 600 }}>
        Interesses em Parceria
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isExpert && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 0',
            borderBottom: '1px solid var(--border)'
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--primary)',
              flexShrink: 0
            }} />
            <span style={{
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text)'
            }}>
              Expert
            </span>
          </div>
        )}
        {isCoproducer && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 0',
            borderBottom: '1px solid var(--border)'
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--primary)',
              flexShrink: 0
            }} />
            <span style={{
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text)'
            }}>
              Coprodutor
            </span>
          </div>
        )}
        {interests.map((interest, idx) => (
          <div 
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 0',
              borderBottom: idx < interests.length - 1 ? '1px solid var(--border)' : 'none'
            }}
          >
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--text-muted)',
              flexShrink: 0
            }} />
            <span style={{
              fontSize: 14,
              color: 'var(--text)',
              lineHeight: 1.5
            }}>
              {interest}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
