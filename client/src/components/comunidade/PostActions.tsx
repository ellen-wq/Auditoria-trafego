import type { PostWithCounts } from '../../types/comunidade';

interface PostActionsProps {
  post: PostWithCounts;
  onLike: () => void;
  onSave: () => void;
  onToggleComentarios: () => void;
  showComentarios: boolean;
}

export default function PostActions({ post, onLike, onSave, onToggleComentarios, showComentarios }: PostActionsProps) {
  return (
    <div style={{ 
      display: 'flex', 
      gap: 24, 
      paddingTop: 16, 
      borderTop: '1px solid var(--border)',
      alignItems: 'center'
    }}>
      <button
        onClick={onLike}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: post.liked_by_me ? 'var(--accent-dark)' : 'var(--text-secondary)',
          fontSize: 14,
          padding: 0,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill={post.liked_by_me ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <span>{post.total_curtidas}</span>
      </button>

      <button
        onClick={onToggleComentarios}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: showComentarios ? 'var(--accent-dark)' : 'var(--text-secondary)',
          fontSize: 14,
          padding: 0,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>{post.total_comentarios}</span>
      </button>

      <button
        onClick={onSave}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: post.saved_by_me ? 'var(--accent-dark)' : 'var(--text-secondary)',
          fontSize: 14,
          padding: 0,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill={post.saved_by_me ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        <span>{post.total_salvos}</span>
      </button>
    </div>
  );
}
