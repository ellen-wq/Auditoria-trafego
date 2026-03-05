import TinderDoFluxoPageShell from '../components/tinder-do-fluxo/TinderDoFluxoPageShell';
import { MEUS_PONTOS_MOCK, RANKING_SEMANA_MOCK, RANKING_GERAL_MOCK } from '../data/rankingMock';

export default function RankingPage() {
  return (
    <TinderDoFluxoPageShell
      title="Gamificação"
      subtitle="Pontos e ranking da comunidade"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 900, margin: '0 auto' }}>
        {/* Seus pontos */}
        <div className="card" style={{ padding: 28, textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 16, color: 'var(--text-muted)' }}>Seus pontos</h3>
          <p style={{ margin: 0, fontSize: 42, fontWeight: 800, color: 'var(--accent)' }}>
            {MEUS_PONTOS_MOCK}
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Participe da comunidade, responda perguntas e interaja para ganhar mais.
          </p>
        </div>

        {/* Placeholder para próximas conquistas */}
        <div className="card" style={{ padding: 28, textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 16, color: 'var(--text-muted)' }}>Conquistas</h3>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
            Em breve: selos e conquistas por participação.
          </p>
        </div>
      </div>

      {/* Ranking da semana */}
      <div className="card" style={{ marginTop: 24, padding: 24, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Ranking da semana</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {RANKING_SEMANA_MOCK.map((e) => (
            <div
              key={e.posicao}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '12px 16px',
                background: e.nome === 'Você' ? 'var(--accent-light)' : 'var(--bg-sidebar)',
                borderRadius: 'var(--radius)',
                border: e.nome === 'Você' ? '1px solid var(--accent)' : '1px solid transparent',
              }}
            >
              <span style={{ fontWeight: 700, width: 28, color: 'var(--text-muted)' }}>#{e.posicao}</span>
              <span style={{ flex: 1, fontWeight: e.nome === 'Você' ? 600 : 500 }}>{e.nome}</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{e.pontos} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking geral */}
      <div className="card" style={{ marginTop: 24, padding: 24, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Ranking geral</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {RANKING_GERAL_MOCK.map((e) => (
            <div
              key={e.posicao}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '12px 16px',
                background: 'var(--bg-sidebar)',
                borderRadius: 'var(--radius)',
              }}
            >
              <span style={{ fontWeight: 700, width: 28, color: 'var(--text-muted)' }}>#{e.posicao}</span>
              <span style={{ flex: 1 }}>{e.nome}</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{e.pontos} pts</span>
            </div>
          ))}
        </div>
      </div>
    </TinderDoFluxoPageShell>
  );
}
