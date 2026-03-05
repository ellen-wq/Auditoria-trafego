import { useMemo, useState } from 'react';

type Role = 'MENTORADO' | 'PRESTADOR' | 'LIDERANCA';

interface Props {
  role: Role;
  open: boolean;
  onClose: () => void;
}

const mentoradoSteps = [
  'Visão geral do Tinder do Fluxo.',
  'Comunidade: encontre mentorados com perfil compatível.',
  'Filtros e busca para achar pessoas mais rápido.',
  'Interesse e conexão liberam contato para parceria.',
  'Favoritos para salvar perfis estratégicos.',
  'Expert & Coprodutor para parcerias de crescimento.',
  'Bio de parceria clara aumenta taxa de conexão.',
  'Prestadores com especialidade e certificação.',
  'Avaliações ajudam a decidir com segurança.',
  'Vagas para abrir oportunidades e montar time.',
  'Conduta e próximos passos para melhores resultados.'
];

const prestadorSteps = [
  'Visão geral do Tinder do Fluxo para prestadores.',
  'Perfil completo aumenta exposição nas buscas.',
  'Especialidade e certificação elevam confiança.',
  'Portfólio claro aumenta conversão de contato.',
  'Avaliações constroem reputação no marketplace.',
  'Vagas abertas para aplicar com foco.',
  'Mensagem de candidatura objetiva e personalizada.',
  'Mostre diferenciais e resultados reais.',
  'Mantenha resposta rápida para fechar oportunidades.',
  'Boas práticas de relacionamento e entrega.',
  'Checklist final para começar a operar.'
];

const liderancaSteps = [
  'Visão geral do módulo para gestão.',
  'Dashboard com KPIs do ecossistema.',
  'Usuários e perfis com filtros por role.',
  'Monitoramento de vagas e candidaturas.',
  'Avaliações e moderação de conteúdo.',
  'Logs para auditoria de ações.',
  'Acompanhamento de conexões geradas.',
  'Qualidade de perfis e preenchimento.',
  'Saúde das ofertas e demanda por especialidade.',
  'Governança e regras de acesso.',
  'Encerramento e próximos passos.'
];

export default function TinderDoFluxoTutorialModal({ role, open, onClose }: Props) {
  const [step, setStep] = useState(0);

  const steps = useMemo(() => {
    if (role === 'PRESTADOR') return prestadorSteps;
    if (role === 'LIDERANCA') return liderancaSteps;
    return mentoradoSteps;
  }, [role]);

  if (!open) return null;

  const isLast = step === steps.length - 1;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 5000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 640,
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
          padding: 24
        }}
      >
        <h3 style={{ marginBottom: 8, fontSize: 20 }}>Tutorial — Tinder do Fluxo</h3>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
          Passo {step + 1} de {steps.length}
        </p>
        <div
          style={{
            minHeight: 120,
            border: '1px solid #eef0f4',
            borderRadius: 10,
            padding: 14,
            background: '#fafbfd',
            fontSize: 15
          }}
        >
          {steps[step]}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Voltar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (!isLast) setStep((s) => s + 1);
              else onClose();
            }}
            style={{ marginLeft: 'auto' }}
          >
            {isLast ? 'Concluir' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
}
