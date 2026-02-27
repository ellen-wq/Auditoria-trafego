import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

interface GlobalSearchProps {
  placeholder?: string;
  onSearch: (searchText: string) => void;
  debounceMs?: number;
  initialValue?: string;
}

export default function GlobalSearch({ 
  placeholder = 'Buscar...', 
  onSearch, 
  debounceMs = 400,
  initialValue = ''
}: GlobalSearchProps) {
  const [searchText, setSearchText] = useState(initialValue);
  const debouncedSearchText = useDebounce(searchText, debounceMs);

  useEffect(() => {
    onSearch(debouncedSearchText);
  }, [debouncedSearchText, onSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleClear = () => {
    setSearchText('');
  };

  return (
    <div style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 100, 
      background: 'var(--bg-primary)', 
      padding: '16px 0',
      borderBottom: '1px solid var(--border)',
      marginBottom: 20
    }}>
      <div style={{ position: 'relative', maxWidth: '100%' }}>
        <input
          type="text"
          value={searchText}
          onChange={handleChange}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '12px 40px 12px 16px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            fontSize: 14,
            background: 'var(--bg-white)',
            color: 'var(--text-primary)',
          }}
        />
        {searchText && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: 18,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        )}
        <div
          style={{
            position: 'absolute',
            right: searchText ? 40 : 12,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: 'var(--text-muted)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
      </div>
    </div>
  );
}
