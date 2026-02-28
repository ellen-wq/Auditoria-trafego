interface ProfileAboutProps {
  bio: string;
}

export function ProfileAbout({ bio }: ProfileAboutProps) {
  if (!bio) {
    return null;
  }

  return (
    <div className="card" style={{ marginBottom: 32, padding: 24 }}>
      <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 20, fontWeight: 600 }}>
        Sobre
      </h2>
      <div style={{ 
        maxWidth: '700px',
        margin: '0 auto'
      }}>
        <p style={{ 
          margin: 0, 
          lineHeight: 1.8, 
          color: 'var(--text)',
          whiteSpace: 'pre-wrap',
          fontSize: 15,
          maxHeight: '300px',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 8,
          WebkitBoxOrient: 'vertical'
        }}>
          {bio}
        </p>
      </div>
    </div>
  );
}
