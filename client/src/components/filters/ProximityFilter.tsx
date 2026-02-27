import { useState, useEffect } from 'react';

interface ProximityFilterProps {
  value: number | null; // Raio em km
  onChange: (radius: number | null) => void;
  onLocationChange?: (location: { lat: number; lng: number } | null) => void;
}

export default function ProximityFilter({ value, onChange, onLocationChange }: ProximityFilterProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (location && onLocationChange) {
      onLocationChange(location);
    }
  }, [location, onLocationChange]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada pelo navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(newLocation);
        setLocationError(null);
      },
      (error) => {
        setLocationError('Não foi possível obter sua localização.');
        console.error('Geolocation error:', error);
      }
    );
  };

  const handleRadiusChange = (radius: number | null) => {
    onChange(radius);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Proximidade</label>
      
      {!location && (
        <button
          type="button"
          onClick={handleGetLocation}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--bg-white)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          📍 Usar minha localização
        </button>
      )}

      {locationError && (
        <div style={{ fontSize: 12, color: 'var(--error)' }}>{locationError}</div>
      )}

      {location && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Localização: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 12 }}>Raio:</label>
            <select
              value={value || ''}
              onChange={(e) => handleRadiusChange(e.target.value ? Number(e.target.value) : null)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                fontSize: 14,
              }}
            >
              <option value="">Qualquer distância</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="25">25 km</option>
              <option value="50">50 km</option>
              <option value="100">100 km</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setLocation(null);
                onChange(null);
                if (onLocationChange) onLocationChange(null);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--bg-white)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
