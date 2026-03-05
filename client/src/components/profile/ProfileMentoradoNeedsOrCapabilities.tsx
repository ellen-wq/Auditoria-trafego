import React from 'react';

const EXPERT_NEEDS = [
  { key: 'precisa_trafego_pago', label: 'Tráfego Pago' },
  { key: 'precisa_copy', label: 'Copy' },
  { key: 'precisa_automacoes', label: 'Automações' },
  { key: 'precisa_estrategista', label: 'Estrategista' },
] as const;

const COPRODUTOR_CAPS = [
  { key: 'faz_perpetuo', label: 'Perpétuo' },
  { key: 'faz_pico_vendas', label: 'Pico de Vendas' },
  { key: 'faz_trafego_pago', label: 'Tráfego Pago' },
  { key: 'faz_copy', label: 'Copy' },
  { key: 'faz_automacoes', label: 'Automações' },
] as const;

export interface ProfileMentoradoNeedsOrCapabilitiesProps {
  isExpert: boolean;
  isCoprodutor: boolean;
  expertDetails?: {
    precisa_trafego_pago?: boolean;
    precisa_copy?: boolean;
    precisa_automacoes?: boolean;
    precisa_estrategista?: boolean;
  };
  coprodutorDetails?: {
    faz_perpetuo?: boolean;
    faz_pico_vendas?: boolean;
    faz_trafego_pago?: boolean;
    faz_copy?: boolean;
    faz_automacoes?: boolean;
  };
}

export function ProfileMentoradoNeedsOrCapabilities({
  isExpert,
  isCoprodutor,
  expertDetails,
  coprodutorDetails,
}: ProfileMentoradoNeedsOrCapabilitiesProps) {
  const title = isExpert ? 'Necessidades' : isCoprodutor ? 'Capacidades' : '';
  const tags: string[] = [];

  if (isExpert && expertDetails) {
    EXPERT_NEEDS.forEach(({ key, label }) => {
      if ((expertDetails as Record<string, boolean>)[key]) tags.push(label);
    });
  }
  if (isCoprodutor && coprodutorDetails) {
    COPRODUTOR_CAPS.forEach(({ key, label }) => {
      if ((coprodutorDetails as Record<string, boolean>)[key]) tags.push(label);
    });
  }

  if (!title || tags.length === 0) return null;

  return (
    <section style={{ marginBottom: 24 }}>
      <h3
        style={{
          margin: '0 0 12px 0',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
      >
        {title}
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {tags.map((t) => (
          <span
            key={t}
            style={{
              padding: '6px 12px',
              background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
              color: 'var(--accent-dark)',
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 9999,
              border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}
