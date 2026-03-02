import { ProfileFormData } from '../../hooks/useProfileFormNew';
import { ExpertProductsSection } from './ExpertProductsSection';

interface ExpertSectionProps {
  formData: ProfileFormData;
  onChange: (data: Partial<ProfileFormData>) => void;
}

export function ExpertSection({ formData, onChange }: ExpertSectionProps) {
  const expert = formData.expert || {
    products: [],
    precisa_trafego_pago: false,
    precisa_copy: false,
    precisa_automacoes: false,
    precisa_estrategista: false,
  };

  const products = (expert as any).products || [];

  return (
    <div style={{ marginTop: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
      <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
        🟣 Expert - Produtos e Necessidades
      </h3>
      
      <ExpertProductsSection
        products={products}
        onChange={(newProducts) => onChange({
          expert: { ...expert, products: newProducts } as any
        })}
      />
      
      <div style={{ marginTop: 24 }}>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: 14 }}>
          Necessidades
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={expert.precisa_trafego_pago || false}
              onChange={(e) => onChange({
                expert: { ...expert, precisa_trafego_pago: e.target.checked } as any
              })}
            />
            <span>Precisa de Tráfego Pago</span>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={expert.precisa_copy || false}
              onChange={(e) => onChange({
                expert: { ...expert, precisa_copy: e.target.checked }
              })}
            />
            <span>Precisa de Copy</span>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={expert.precisa_automacoes || false}
              onChange={(e) => onChange({
                expert: { ...expert, precisa_automacoes: e.target.checked } as any
              })}
            />
            <span>Precisa de Automações</span>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={expert.precisa_estrategista || false}
              onChange={(e) => onChange({
                expert: { ...expert, precisa_estrategista: e.target.checked } as any
              })}
            />
            <span>Precisa de Estrategista</span>
          </label>
        </div>
      </div>
    </div>
  );
}
