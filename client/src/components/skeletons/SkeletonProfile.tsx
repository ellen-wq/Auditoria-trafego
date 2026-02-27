export default function SkeletonProfile() {
  return (
    <div
      style={{
        background: 'var(--bg-white)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        padding: 24,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    >
      <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'var(--bg-secondary)',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              height: 24,
              width: '50%',
              background: 'var(--bg-secondary)',
              borderRadius: 4,
            }}
          />
          <div
            style={{
              height: 16,
              width: '70%',
              background: 'var(--bg-secondary)',
              borderRadius: 4,
            }}
          />
          <div
            style={{
              height: 14,
              width: '40%',
              background: 'var(--bg-secondary)',
              borderRadius: 4,
            }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                height: 14,
                width: '30%',
                background: 'var(--bg-secondary)',
                borderRadius: 4,
              }}
            />
            <div
              style={{
                height: 40,
                width: '100%',
                background: 'var(--bg-secondary)',
                borderRadius: 4,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
