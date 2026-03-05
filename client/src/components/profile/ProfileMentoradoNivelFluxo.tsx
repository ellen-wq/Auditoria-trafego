import React from 'react';
import { getNivelFluxoDisplayLabel } from '../../utils/format';

/** Ordem dos níveis no fluxo. Valores aceitos (inclui 'pro-plus' legado). */
const NIVEL_ORDEM_LABELS = ['Newbie', 'Soft', 'Hard', 'Pro', 'Pro +', 'Master'] as const;
const NIVEL_VALORES = ['newbie', 'soft', 'hard', 'pro', 'pro-plus', 'master'] as const; // pro-plus = mesmo que Pro +

function getProximoNivel(currentLabel?: string): string | null {
  if (!currentLabel || !currentLabel.trim()) return null;
  const raw = currentLabel.trim();
  const normalized = raw.toLowerCase();
  const isProPlus = normalized === 'pro +' || normalized === 'pro-plus';
  let idx = NIVEL_VALORES.findIndex((v) => v === normalized);
  if (isProPlus) idx = 4;
  if (idx < 0) {
    idx = (NIVEL_ORDEM_LABELS as readonly string[]).findIndex(
      (l) => l.toLowerCase() === normalized
    );
  }
  if (idx < 0 || idx >= NIVEL_ORDEM_LABELS.length - 1) return null;
  return NIVEL_ORDEM_LABELS[idx + 1];
}

export interface ProfileMentoradoNivelFluxoProps {
  nivelLabel?: string;
  nivelPercent?: number | null;
}

export function ProfileMentoradoNivelFluxo({ nivelLabel, nivelPercent }: ProfileMentoradoNivelFluxoProps) {
  const hasValue = nivelLabel && nivelLabel.trim() !== '';
  if (!hasValue) return null;

  const percent = nivelPercent != null ? Math.min(100, Math.max(0, Number(nivelPercent))) : 0;
  const proximoNivel = getProximoNivel(nivelLabel);
  const displayLabel = getNivelFluxoDisplayLabel(nivelLabel) || nivelLabel?.trim() || '';

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
        Nível no Fluxo
      </h3>
      <div
        style={{
          background: 'var(--bg-sidebar)',
          padding: 24,
          borderRadius: 'var(--radius)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -16,
            top: -16,
            width: 96,
            height: 96,
            background: 'color-mix(in srgb, var(--accent) 20%, transparent)',
            borderRadius: '50%',
            filter: 'blur(24px)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <span
              style={{
                color: 'var(--accent)',
                fontWeight: 800,
                fontSize: 20,
                letterSpacing: '-0.02em',
                fontStyle: 'italic',
              }}
            >
              NÍVEL {(displayLabel && String(displayLabel).toUpperCase()) || ''}
            </span>
            <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 24 }}>
              verified
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 6,
              background: 'var(--text-muted)',
              borderRadius: 9999,
              marginBottom: 8,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${percent}%`,
                height: '100%',
                background: 'var(--accent)',
                borderRadius: 9999,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          {proximoNivel && (
            <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
              Próximo nível: {proximoNivel}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
