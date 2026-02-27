import { Link } from 'react-router-dom';

interface FeedHeaderProps {
  selectedTemaId: string | null;
  onSortChange: (sort: 'recent' | 'trending') => void;
  sortBy: 'recent' | 'trending';
}

export default function FeedHeader({ onSortChange, sortBy }: FeedHeaderProps) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: 20,
      flexWrap: 'wrap',
      gap: 12
    }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Comunidade</h2>
      
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as 'recent' | 'trending')}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            fontSize: 14,
            background: 'var(--bg-white)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="recent">Mais recentes</option>
          <option value="trending">Trending</option>
        </select>
        
        <Link to="/tinder-do-fluxo/comunidade/nova-publicacao" className="btn btn-primary">
          Nova publicação
        </Link>
      </div>
    </div>
  );
}
