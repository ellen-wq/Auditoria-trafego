import { ProfileFormData } from '../../hooks/useProfileFormNew';

interface ExpertSectionProps {
  formData: ProfileFormData;
  onChange: (data: Partial<ProfileFormData>) => void;
}

export function ExpertSection({ formData, onChange }: ExpertSectionProps) {
  const expert = formData.expert || {
    tipo_produto: '',
    preco: 0,
    modelo: '' as const,
    precisa_trafego: false,
    precisa_coprodutor: false,
    precisa_copy: false,
  };

  return (
    <div style={{ marginTop: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
      <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
        🟣 Expert - Detalhes do Produto
      </h3>
      
      <div className="form-group">
        <label>Tipo de Produto</label>
        <input
          value={expert.tipo_produto}
          onChange={(e) => onChange({
            expert: { ...expert, tipo_produto: e.target.value }
          })}
          placeholder="Ex: Curso de Marketing Digital"
        />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label>Preço</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={expert.preco}
            onChange={(e) => onChange({
              expert: { ...expert, preco: parseFloat(e.target.value) || 0 }
            })}
          />
        </div>
        
        <div className="form-group">
          <label>Modelo</label>
          <select
            value={expert.modelo}
            onChange={(e) => onChange({
              expert: { ...expert, modelo: e.target.value as 'perpétuo' | 'lançamento' | 'assinatura' | '' }
            })}
          >
            <option value="">Selecione...</option>
            <option value="perpétuo">Perpétuo</option>
            <option value="lançamento">Lançamento</option>
            <option value="assinatura">Assinatura</option>
          </select>
        </div>
      </div>
      
      <div style={{ marginTop: 16 }}>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: 14 }}>
          Necessidades
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={expert.precisa_trafego}
              onChange={(e) => onChange({
                expert: { ...expert, precisa_trafego: e.target.checked }
              })}
            />
            <span>Precisa de tráfego</span>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={expert.precisa_coprodutor}
              onChange={(e) => onChange({
                expert: { ...expert, precisa_coprodutor: e.target.checked }
              })}
            />
            <span>Precisa de coprodutor</span>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={expert.precisa_copy}
              onChange={(e) => onChange({
                expert: { ...expert, precisa_copy: e.target.checked }
              })}
            />
            <span>Precisa de copy</span>
          </label>
        </div>
      </div>
    </div>
  );
}
