import type { ComentarioWithAuthor } from '../../types/comunidade';

interface ComentariosDrawerProps {
  postId: string;
  comentarios: ComentarioWithAuthor[];
  comentarioText: string;
  onComentarioTextChange: (text: string) => void;
  onSubmitComentario: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export default function ComentariosDrawer({
  comentarios,
  comentarioText,
  onComentarioTextChange,
  onSubmitComentario,
  isSubmitting,
}: ComentariosDrawerProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays < 7) return `Há ${diffDays}d`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Comentários</h4>
      
      {/* Lista de comentários */}
      <div style={{ marginBottom: 16, maxHeight: 300, overflowY: 'auto' }}>
        {comentarios.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Nenhum comentário ainda. Seja o primeiro!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {comentarios.map((comentario) => (
              <div key={comentario.id} style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{comentario.autor_nome}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {formatDate(comentario.created_at)}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {comentario.conteudo}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form de comentário */}
      <form onSubmit={onSubmitComentario}>
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea
            value={comentarioText}
            onChange={(e) => onComentarioTextChange(e.target.value)}
            placeholder="Escreva um comentário..."
            rows={2}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              fontSize: 14,
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
          <button
            type="submit"
            disabled={!comentarioText.trim() || isSubmitting}
            className="btn btn-primary"
            style={{ alignSelf: 'flex-end' }}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
}
