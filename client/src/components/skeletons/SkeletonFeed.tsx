export default function SkeletonFeed() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: 'var(--bg-white)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            padding: 20,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              <div
                style={{
                  height: 12,
                  width: '30%',
                  background: 'var(--bg-secondary)',
                  borderRadius: 4,
                }}
              />
              <div
                style={{
                  height: 20,
                  width: '60%',
                  background: 'var(--bg-secondary)',
                  borderRadius: 4,
                }}
              />
            </div>
            <div
              style={{
                height: 12,
                width: 80,
                background: 'var(--bg-secondary)',
                borderRadius: 4,
              }}
            />
          </div>
          <div
            style={{
              height: 12,
              width: '40%',
              background: 'var(--bg-secondary)',
              borderRadius: 4,
              marginBottom: 16,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <div
              style={{
                height: 14,
                width: '100%',
                background: 'var(--bg-secondary)',
                borderRadius: 4,
              }}
            />
            <div
              style={{
                height: 14,
                width: '95%',
                background: 'var(--bg-secondary)',
                borderRadius: 4,
              }}
            />
            <div
              style={{
                height: 14,
                width: '85%',
                background: 'var(--bg-secondary)',
                borderRadius: 4,
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              gap: 24,
              paddingTop: 16,
              borderTop: '1px solid var(--border)',
            }}
          >
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                style={{
                  height: 20,
                  width: 60,
                  background: 'var(--bg-secondary)',
                  borderRadius: 4,
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
