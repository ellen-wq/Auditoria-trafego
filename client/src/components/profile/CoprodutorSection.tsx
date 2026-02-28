import { ProfileFormData } from '../../hooks/useProfileFormNew';

interface CoprodutorSectionProps {
  formData: ProfileFormData;
  onChange: (data: Partial<ProfileFormData>) => void;
}

export function CoprodutorSection({ formData, onChange }: CoprodutorSectionProps) {
  const coprodutor = formData.coprodutor || {
    faz_trafego: false,
    faz_lancamento: false,
    faz_perpetuo: false,
    ticket_minimo: 0,
    percentual_minimo: 0,
    aceita_sociedade: false,
    aceita_fee_percentual: false,
  };

  return (
    <div style={{ marginTop: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
      <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
        🤝 Coprodutor - Capacidades e Parceria
      </h3>
      
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: 14 }}>
          Capacidades
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={coprodutor.faz_trafego}
              onChange={(e) => onChange({
                coprodutor: { ...coprodutor, faz_trafego: e.target.checked }
              })}
            />
            <span>Faz tráfego</span>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={coprodutor.faz_lancamento}
              onChange={(e) => onChange({
                coprodutor: { ...coprodutor, faz_lancamento: e.target.checked }
              })}
            />
            <span>Faz lançamento</span>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={coprodutor.faz_perpetuo}
              onChange={(e) => onChange({
                coprodutor: { ...coprodutor, faz_perpetuo: e.target.checked }
              })}
            />
            <span>Faz perpétuo</span>
          </label>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="form-group">
          <label>Ticket Mínimo</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={coprodutor.ticket_minimo}
            onChange={(e) => onChange({
              coprodutor: { ...coprodutor, ticket_minimo: parseFloat(e.target.value) || 0 }
            })}
          />
        </div>
        
        <div className="form-group">
          <label>Percentual Mínimo (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={coprodutor.percentual_minimo}
            onChange={(e) => onChange({
              coprodutor: { ...coprodutor, percentual_minimo: parseInt(e.target.value, 10) || 0 }
            })}
          />
        </div>
      </div>
      
      <div>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: 14 }}>
          Modelo de Parceria
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={coprodutor.aceita_sociedade}
              onChange={(e) => onChange({
                coprodutor: { ...coprodutor, aceita_sociedade: e.target.checked }
              })}
            />
            <span>Aceita sociedade</span>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={coprodutor.aceita_fee_percentual}
              onChange={(e) => onChange({
                coprodutor: { ...coprodutor, aceita_fee_percentual: e.target.checked }
              })}
            />
            <span>Aceita fee + percentual</span>
          </label>
        </div>
      </div>
    </div>
  );
}
