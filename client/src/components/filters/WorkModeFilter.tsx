interface WorkModeFilterProps {
  value: string[];
  onChange: (modes: string[]) => void;
  options?: string[];
}

export default function WorkModeFilter({ 
  value, 
  onChange, 
  options = ['remoto', 'presencial', 'hibrido'] 
}: WorkModeFilterProps) {
  const handleToggle = (mode: string) => {
    if (value.includes(mode)) {
      onChange(value.filter((m) => m !== mode));
    } else {
      onChange([...value, mode]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Modo de trabalho</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => handleToggle(mode)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius)',
              border: `1px solid ${value.includes(mode) ? 'var(--accent-dark)' : 'var(--border)'}`,
              background: value.includes(mode) ? 'var(--accent-light)' : 'var(--bg-white)',
              color: value.includes(mode) ? 'var(--accent-dark)' : 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: 14,
              textTransform: 'capitalize',
            }}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
}
