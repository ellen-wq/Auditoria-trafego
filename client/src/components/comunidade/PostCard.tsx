import { useState } from 'react';
import { useLikePost, useSavePost, useComentarios, useCreateComentario } from '../../hooks/useComunidade';
import PostActions from './PostActions';
import ComentariosDrawer from './ComentariosDrawer';
import type { PostWithCounts } from '../../types/comunidade';

interface PostCardProps {
  post: PostWithCounts;
}

export default function PostCard({ post }: PostCardProps) {
  const [showComentarios, setShowComentarios] = useState(false);
  const [comentarioText, setComentarioText] = useState('');
  
  const likeMutation = useLikePost();
  const saveMutation = useSavePost();
  const { data: comentarios } = useComentarios(showComentarios ? post.id : '');
  const createComentarioMutation = useCreateComentario();

  const handleLike = () => {
    likeMutation.mutate(post.id);
  };

  const handleSave = () => {
    saveMutation.mutate(post.id);
  };

  const handleToggleComentarios = () => {
    setShowComentarios(!showComentarios);
  };

  const handleSubmitComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comentarioText.trim()) return;

    try {
      await createComentarioMutation.mutateAsync({
        post_id: post.id,
        conteudo: comentarioText,
      });
      setComentarioText('');
    } catch (err) {
      console.error('Erro ao criar comentário:', err);
    }
  };

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
    <div style={{
      background: 'var(--bg-white)',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
      padding: 20,
      marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
            {post.tema_nome}
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{post.titulo}</h3>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {formatDate(post.created_at)}
        </div>
      </div>

      {/* Autor */}
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
        Por {post.autor_nome}
      </div>

      {/* Conteúdo */}
      <div style={{ 
        fontSize: 15, 
        lineHeight: 1.6, 
        color: 'var(--text-primary)',
        marginBottom: 16,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}>
        {post.conteudo}
      </div>

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div style={{ marginBottom: 16, display: 'grid', gap: 8, gridTemplateColumns: post.media.length > 1 ? 'repeat(2, 1fr)' : '1fr' }}>
          {post.media.map((media) => (
            <div key={media.id} style={{ borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              {media.type === 'image' ? (
                <img 
                  src={media.url} 
                  alt="Post media" 
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              ) : (
                <video 
                  src={media.url} 
                  controls 
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <PostActions
        post={post}
        onLike={handleLike}
        onSave={handleSave}
        onToggleComentarios={handleToggleComentarios}
        showComentarios={showComentarios}
      />

      {/* Comentários Drawer */}
      {showComentarios && (
        <ComentariosDrawer
          postId={post.id}
          comentarios={comentarios || []}
          comentarioText={comentarioText}
          onComentarioTextChange={setComentarioText}
          onSubmitComentario={handleSubmitComentario}
          isSubmitting={createComentarioMutation.isPending}
        />
      )}
    </div>
  );
}
