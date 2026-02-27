import { useTemas } from '../../hooks/useComunidade';
import type { Tema } from '../../types/comunidade';

interface TemaSidebarProps {
  selectedTemaId: string | null;
  onSelectTema: (temaId: string | null) => void;
}

export default function TemaSidebar({ selectedTemaId, onSelectTema }: TemaSidebarProps) {
  const { data: temas, isLoading } = useTemas();

  return (
    <div style={{ 
      width: 240, 
      padding: 16, 
      background: 'var(--bg-white)', 
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
      height: 'fit-content',
      position: 'sticky',
      top: 20
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Temas</h3>
      
      {isLoading ? (
        <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>
          Carregando...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => onSelectTema(null)}
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius)',
              border: 'none',
              background: selectedTemaId === null ? 'var(--accent-light)' : 'transparent',
              color: selectedTemaId === null ? 'var(--accent-dark)' : 'var(--text-primary)',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: 14,
              fontWeight: selectedTemaId === null ? 600 : 400,
            }}
          >
            Todos
          </button>
          
          {temas?.map((tema: Tema) => (
            <button
              key={tema.id}
              onClick={() => onSelectTema(tema.id)}
              disabled={!tema.permite_postagem}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius)',
                border: 'none',
                background: selectedTemaId === tema.id ? 'var(--accent-light)' : 'transparent',
                color: selectedTemaId === tema.id ? 'var(--accent-dark)' : 'var(--text-primary)',
                cursor: tema.permite_postagem ? 'pointer' : 'not-allowed',
                textAlign: 'left',
                fontSize: 14,
                fontWeight: selectedTemaId === tema.id ? 600 : 400,
                opacity: tema.permite_postagem ? 1 : 0.5,
              }}
            >
              {tema.nome}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
