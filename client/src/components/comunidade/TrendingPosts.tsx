import { useTrending } from '../../hooks/useComunidade';
import { Link } from 'react-router-dom';
import type { PostWithCounts } from '../../types/comunidade';

export default function TrendingPosts() {
  const { data: posts, isLoading } = useTrending();

  if (isLoading) {
    return (
      <div style={{ 
        padding: 20, 
        background: 'var(--bg-white)', 
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)'
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>🔥 Trending</h3>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div style={{ 
        padding: 20, 
        background: 'var(--bg-white)', 
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)'
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>🔥 Trending</h3>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nenhum post trending ainda.</div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 20, 
      background: 'var(--bg-white)', 
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
      position: 'sticky',
      top: 20
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>🔥 Trending</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {posts.map((post: PostWithCounts) => (
          <Link
            key={post.id}
            to={`/tinder-do-fluxo/comunidade#post-${post.id}`}
            style={{
              padding: 12,
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius)',
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              {post.tema_nome}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              {post.titulo}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Por {post.autor_nome}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
