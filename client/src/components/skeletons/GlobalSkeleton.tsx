import SkeletonFeed from './SkeletonFeed';
import SkeletonCard from './SkeletonCard';
import SkeletonList from './SkeletonList';
import SkeletonProfile from './SkeletonProfile';

interface GlobalSkeletonProps {
  type: 'feed' | 'card' | 'list' | 'profile';
  count?: number;
}

export default function GlobalSkeleton({ type, count }: GlobalSkeletonProps) {
  if (type === 'feed') {
    return <SkeletonFeed />;
  }

  if (type === 'card') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {Array.from({ length: count || 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return <SkeletonList />;
  }

  if (type === 'profile') {
    return <SkeletonProfile />;
  }

  return null;
}
