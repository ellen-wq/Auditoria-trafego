interface TinderFiltersProps {
  partnershipTypes: string[];
  onPartnershipTypesChange: (types: string[]) => void;
  lookingFor: string[];
  onLookingForChange: (types: string[]) => void;
  cities: string[];
  onCitiesChange: (cities: string[]) => void;
  availableCities: string[];
}

const PARTNERSHIP_OPTIONS = [
  { value: 'Projetos', label: 'Projetos' },
  { value: 'Parcerias', label: 'Parcerias' },
  { value: 'Coprodução', label: 'Coprodução' },
  { value: 'Sociedade', label: 'Sociedade' },
];

const LOOKING_FOR_OPTIONS = [
  { value: 'expert', label: 'Expert' },
  { value: 'coprodutor', label: 'Coprodutor' },
];

export default function TinderFilters({
  partnershipTypes,
  onPartnershipTypesChange,
  lookingFor,
  onLookingForChange,
  cities,
  onCitiesChange,
  availableCities,
}: TinderFiltersProps) {
  const handlePartnershipToggle = (value: string) => {
    if (partnershipTypes.includes(value)) {
      onPartnershipTypesChange(partnershipTypes.filter(t => t !== value));
    } else {
      onPartnershipTypesChange([...partnershipTypes, value]);
    }
  };

  const handleLookingForToggle = (value: string) => {
    if (lookingFor.includes(value)) {
      onLookingForChange(lookingFor.filter(t => t !== value));
    } else {
      onLookingForChange([...lookingFor, value]);
    }
  };

  const handleCityToggle = (city: string) => {
    if (cities.includes(city)) {
      onCitiesChange(cities.filter(c => c !== city));
    } else {
      onCitiesChange([...cities, city]);
    }
  };

  return (
    <div className="card tinder-filters-card" style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 10, 
      marginBottom: 24,
      padding: '16px 24px',
      background: 'var(--bg-white)',
      borderBottom: '1px solid var(--border)'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Tipo de Parceria */}
        <div>
          <label style={{ 
            fontSize: 13, 
            fontWeight: 600, 
            color: 'var(--text-secondary)', 
            marginBottom: 8,
            display: 'block'
          }}>
            Tipo de parceria:
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PARTNERSHIP_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handlePartnershipToggle(option.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-xs)',
                  border: `1px solid ${partnershipTypes.includes(option.value) ? 'var(--accent-dark)' : 'var(--border)'}`,
                  background: partnershipTypes.includes(option.value) ? 'var(--accent-light)' : 'var(--bg-white)',
                  color: partnershipTypes.includes(option.value) ? 'var(--accent-dark)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'all 0.15s',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Procurando por */}
        <div>
          <label style={{ 
            fontSize: 13, 
            fontWeight: 600, 
            color: 'var(--text-secondary)', 
            marginBottom: 8,
            display: 'block'
          }}>
            Procurando por:
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {LOOKING_FOR_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleLookingForToggle(option.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-xs)',
                  border: `1px solid ${lookingFor.includes(option.value) ? 'var(--accent-dark)' : 'var(--border)'}`,
                  background: lookingFor.includes(option.value) ? 'var(--accent-light)' : 'var(--bg-white)',
                  color: lookingFor.includes(option.value) ? 'var(--accent-dark)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'all 0.15s',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Região/Cidade */}
        <div>
          <label style={{ 
            fontSize: 13, 
            fontWeight: 600, 
            color: 'var(--text-secondary)', 
            marginBottom: 8,
            display: 'block'
          }}>
            Região/Cidade:
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {availableCities.length > 0 ? (
              availableCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleCityToggle(city)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-xs)',
                    border: `1px solid ${cities.includes(city) ? 'var(--accent-dark)' : 'var(--border)'}`,
                    background: cities.includes(city) ? 'var(--accent-light)' : 'var(--bg-white)',
                    color: cities.includes(city) ? 'var(--accent-dark)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    transition: 'all 0.15s',
                  }}
                >
                  {city}
                </button>
              ))
            ) : (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Nenhuma cidade disponível
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
