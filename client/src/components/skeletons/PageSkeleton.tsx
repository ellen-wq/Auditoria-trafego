/**
 * Skeleton leve para fallback do Suspense em todas as páginas.
 * DOM mínimo e animação rápida para aparecer logo.
 */
export default function PageSkeleton() {
  return (
    <div
      className="page-skeleton"
      style={{
        minHeight: '100vh',
        background: 'var(--bg-page, var(--bg-primary))',
        padding: 24,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div className="skeleton-line" style={{ height: 28, width: 220, marginBottom: 24, borderRadius: 6 }} />
        <div className="skeleton-line" style={{ height: 14, width: '100%', marginBottom: 12 }} />
        <div className="skeleton-line" style={{ height: 14, width: '92%', marginBottom: 12 }} />
        <div className="skeleton-line" style={{ height: 14, width: '88%', marginBottom: 24 }} />
        <div className="skeleton-line" style={{ height: 120, width: '100%', marginBottom: 16, borderRadius: 8 }} />
        <div className="skeleton-line" style={{ height: 14, width: '70%', marginBottom: 8 }} />
        <div className="skeleton-line" style={{ height: 14, width: '50%', marginBottom: 24 }} />
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <div className="skeleton-line" style={{ height: 40, width: 100, borderRadius: 8 }} />
          <div className="skeleton-line" style={{ height: 40, width: 120, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}
