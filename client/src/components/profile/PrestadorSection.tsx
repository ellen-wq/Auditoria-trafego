import { ProfileFormData } from '../../hooks/useProfileFormNew';

interface PrestadorSectionProps {
  formData: ProfileFormData;
  onChange: (data: Partial<ProfileFormData>) => void;
}

const servicosOptions = [
  { value: 'trafego', label: 'Tráfego' },
  { value: 'copy', label: 'Copy' },
  { value: 'automacao', label: 'Automação' },
];

// Mapear valores do frontend para backend
const servicoMapping: Record<string, string> = {
  'trafego': 'TRAFEGO',
  'copy': 'COPY',
  'automacao': 'AUTOMACAO',
};

const modeloContratacaoOptions = [
  { value: 'remoto', label: 'Remoto' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'hibrido', label: 'Híbrido' },
  { value: 'indiferente', label: 'Indiferente' },
];

export function PrestadorSection({ formData, onChange }: PrestadorSectionProps) {
  const prestador = formData.prestador || {
    servicos: [],
    valor_minimo: 0,
    modelo_contratacao: 'remoto',
  };

  const toggleServico = (servico: string) => {
    const servicos = prestador.servicos || [];
    // Converter valor do frontend para backend
    const servicoBackend = servicoMapping[servico] || servico;
    
    // Verificar se já existe no formato backend ou frontend
    const exists = servicos.some(s => s === servicoBackend || s === servico);
    
    const newServicos = exists
      ? servicos.filter(s => s !== servicoBackend && s !== servico)
      : [...servicos, servicoBackend];
    
    onChange({
      prestador: { ...prestador, servicos: newServicos }
    });
  };

  // Verificar se serviço está selecionado (suporta ambos os formatos)
  const isServicoSelected = (servico: string) => {
    const servicos = prestador.servicos || [];
    const servicoBackend = servicoMapping[servico] || servico;
    return servicos.includes(servicoBackend) || servicos.includes(servico);
  };

  return (
    <div style={{ marginTop: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
      <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
        🔵 Prestador - Serviços e Contratação
      </h3>
      
      <div className="form-group">
        <label>Serviços (Multi-select)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
          {servicosOptions.map(servico => (
            <label key={servico.value} style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isServicoSelected(servico.value)}
                onChange={() => toggleServico(servico.value)}
              />
              <span>{servico.label}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label>Modelo de Contratação</label>
          <select
            value={prestador.modelo_contratacao}
            onChange={(e) => onChange({
              prestador: { ...prestador, modelo_contratacao: e.target.value }
            })}
          >
            {modeloContratacaoOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Valor Mínimo</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={prestador.valor_minimo}
            onChange={(e) => onChange({
              prestador: { ...prestador, valor_minimo: parseFloat(e.target.value) || 0 }
            })}
          />
        </div>
      </div>
    </div>
  );
}
