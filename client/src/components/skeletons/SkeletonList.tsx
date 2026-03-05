export default function SkeletonList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: 'var(--bg-white)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            animation: 'pulse 0.7s ease-in-out infinite',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--bg-secondary)',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                height: 16,
                width: '40%',
                background: 'var(--bg-secondary)',
                borderRadius: 4,
              }}
            />
            <div
              style={{
                height: 12,
                width: '60%',
                background: 'var(--bg-secondary)',
                borderRadius: 4,
              }}
            />
          </div>
          <div
            style={{
              height: 32,
              width: 100,
              background: 'var(--bg-secondary)',
              borderRadius: 4,
            }}
          />
        </div>
      ))}
    </div>
  );
}
