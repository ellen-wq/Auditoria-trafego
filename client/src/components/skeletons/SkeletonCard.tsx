export default function SkeletonCard() {
  return (
    <div
      style={{
        background: 'var(--bg-white)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        padding: 16,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    >
      <div
        style={{
          height: 120,
          width: '100%',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius)',
          marginBottom: 12,
        }}
      />
      <div
        style={{
          height: 16,
          width: '70%',
          background: 'var(--bg-secondary)',
          borderRadius: 4,
          marginBottom: 8,
        }}
      />
      <div
        style={{
          height: 12,
          width: '50%',
          background: 'var(--bg-secondary)',
          borderRadius: 4,
          marginBottom: 12,
        }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <div
          style={{
            height: 20,
            width: 60,
            background: 'var(--bg-secondary)',
            borderRadius: 4,
          }}
        />
        <div
          style={{
            height: 20,
            width: 80,
            background: 'var(--bg-secondary)',
            borderRadius: 4,
          }}
        />
      </div>
    </div>
  );
}
