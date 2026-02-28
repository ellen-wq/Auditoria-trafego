import { ReactNode } from 'react';
import GlobalSearch from '../search/GlobalSearch';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  search?: {
    placeholder?: string;
    onSearch: (searchText: string) => void;
    initialValue?: string;
  };
  skeletonType?: 'feed' | 'card' | 'list' | 'profile';
  isLoading?: boolean;
  filters?: ReactNode;
}

export default function PageLayout({
  children,
  title,
  search,
  skeletonType,
  isLoading = false,
  filters,
}: PageLayoutProps) {
  if (isLoading && skeletonType) {
    return (
      <div>
        {title && <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>{title}</h1>}
        {search && (
          <GlobalSearch
            placeholder={search.placeholder}
            onSearch={search.onSearch}
            initialValue={search.initialValue}
          />
        )}
        {filters && (
          <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
            {filters}
          </div>
        )}
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-secondary)' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {title && <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>{title}</h1>}
      {search && (
        <GlobalSearch
          placeholder={search.placeholder}
          onSearch={search.onSearch}
          initialValue={search.initialValue}
        />
      )}
      {filters && (
        <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
          {filters}
        </div>
      )}
      {children}
    </div>
  );
}
