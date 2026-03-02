import { ProfileFormData } from '../../hooks/useProfileFormNew';

interface CoprodutorSectionProps {
  formData: ProfileFormData;
  onChange: (data: Partial<ProfileFormData>) => void;
}

export function CoprodutorSection({ formData, onChange }: CoprodutorSectionProps) {
  const coprodutor = formData.coprodutor || {
    faz_perpetuo: false,
    faz_pico_vendas: false,
    faz_trafego_pago: false,
    faz_copy: false,
    faz_automacoes: false,
  };

  return (
    <div style={{ marginTop: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
      <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
        🤝 Coprodutor - Capacidades
      </h3>
      
      <div>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: 14 }}>
          Capacidades
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={coprodutor.faz_perpetuo || false}
              onChange={(e) => onChange({
                coprodutor: { ...coprodutor, faz_perpetuo: e.target.checked }
              })}
            />
            <span>Faz Perpétuo</span>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={coprodutor.faz_pico_vendas || false}
              onChange={(e) => onChange({
                coprodutor: { ...coprodutor, faz_pico_vendas: e.target.checked }
              })}
            />
            <span>Faz Pico de Vendas</span>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={coprodutor.faz_trafego_pago || false}
              onChange={(e) => onChange({
                coprodutor: { ...coprodutor, faz_trafego_pago: e.target.checked }
              })}
            />
            <span>Faz Tráfego Pago</span>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={coprodutor.faz_copy || false}
              onChange={(e) => onChange({
                coprodutor: { ...coprodutor, faz_copy: e.target.checked }
              })}
            />
            <span>Faz Copy</span>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={coprodutor.faz_automacoes || false}
              onChange={(e) => onChange({
                coprodutor: { ...coprodutor, faz_automacoes: e.target.checked }
              })}
            />
            <span>Faz Automações</span>
          </label>
        </div>
      </div>
    </div>
  );
}
