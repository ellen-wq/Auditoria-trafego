import { useState, useMemo } from 'react';
import AppLayout from '../components/AppLayout';
import TinderDoFluxoPageShell from '../components/tinder-do-fluxo/TinderDoFluxoPageShell';
import { api } from '../services/api';
import {
  CATEGORIAS_PERGUNTAS,
  SUBCATEGORIAS_COPY,
  PERGUNTAS_COMUNIDADE_MOCK,
  PERGUNTAS_FLUXO_MOCK,
  type PerguntaMock,
  type CategoriaId,
} from '../data/perguntasMock';

function formatDate(s: string) {
  const d = new Date(s);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 3600000) return 'Há pouco';
  if (diff < 86400000) return `Há ${Math.floor(diff / 3600000)}h`;
  if (diff < 604800000) return `Há ${Math.floor(diff / 86400000)}d`;
  return d.toLocaleDateString('pt-BR');
}

function PerguntaCard({
  pergunta,
  onClick,
}: {
  pergunta: PerguntaMock;
  onClick: () => void;
}) {
  const totalRespostas = pergunta.respostas.length;
  const categoria = CATEGORIAS_PERGUNTAS.find((c) => c.id === pergunta.categoriaId);
  const sub = pergunta.subcategoriaCopyId
    ? SUBCATEGORIAS_COPY.find((s) => s.id === pergunta.subcategoriaCopyId)
    : null;
  return (
    <div
      className="card"
      style={{
        padding: 20,
        marginBottom: 16,
        cursor: 'pointer',
        border: '1px solid var(--border)',
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
        {categoria?.label}
        {sub && ` › ${sub.label}`}
        {pergunta.somenteFluxo && (
          <span style={{ marginLeft: 8, background: 'var(--accent)', color: 'white', padding: '2px 8px', borderRadius: 9999 }}>
            Fluxo
          </span>
        )}
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>{pergunta.titulo}</h3>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {pergunta.corpo.slice(0, 120)}
        {pergunta.corpo.length > 120 ? '...' : ''}
      </p>
      <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
        <span>{pergunta.autorNome}</span>
        <span>{formatDate(pergunta.createdAt)}</span>
        <span>{totalRespostas} resposta{totalRespostas !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

function DetalhePergunta({
  pergunta,
  votosPorResposta,
  onVote,
  onClose,
}: {
  pergunta: PerguntaMock;
  votosPorResposta: Record<string, number>;
  onVote: (respostaId: string) => void;
  onClose: () => void;
}) {
  const categoria = CATEGORIAS_PERGUNTAS.find((c) => c.id === pergunta.categoriaId);
  const sub = pergunta.subcategoriaCopyId
    ? SUBCATEGORIAS_COPY.find((s) => s.id === pergunta.subcategoriaCopyId)
    : null;
  const respostasOrdenadas = [...pergunta.respostas].sort(
    (a, b) => (votosPorResposta[b.id] ?? b.votos) - (votosPorResposta[a.id] ?? a.votos)
  );

  return (
    <div className="card" style={{ padding: 24, marginBottom: 24 }}>
      <button type="button" className="btn btn-outline" onClick={onClose} style={{ marginBottom: 16 }}>
        ← Voltar ao feed
      </button>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
        {categoria?.label}
        {sub && ` › ${sub.label}`}
      </div>
      <h2 style={{ margin: '0 0 12px', fontSize: 22 }}>{pergunta.titulo}</h2>
      <p style={{ margin: '0 0 8px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
        {pergunta.corpo}
      </p>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
        {pergunta.autorNome} · {formatDate(pergunta.createdAt)}
      </p>

      <h3 style={{ margin: '24px 0 12px', fontSize: 16 }}>Respostas</h3>
      {respostasOrdenadas.map((r) => {
        const votos = votosPorResposta[r.id] ?? r.votos;
        return (
          <div
            key={r.id}
            style={{
              padding: 16,
              background: 'var(--bg-sidebar)',
              borderRadius: 'var(--radius)',
              marginBottom: 12,
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <strong style={{ fontSize: 14 }}>{r.autorNome}</strong>
                <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {r.conteudo}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                style={{ flexShrink: 0, padding: '6px 12px', fontSize: 13 }}
                onClick={() => onVote(r.id)}
              >
                👍 {votos}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PerguntasPage() {
  const currentUser = api.getUser();
  const isMentoradoFluxo = currentUser?.role === 'MENTORADO' || currentUser?.role === 'LIDERANCA';

  const [tab, setTab] = useState<'comunidade' | 'fluxo'>('comunidade');
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaId | ''>('');
  const [detalhe, setDetalhe] = useState<PerguntaMock | null>(null);
  const [votosPorResposta, setVotosPorResposta] = useState<Record<string, number>>({});

  const perguntasComunidade = useMemo(() => {
    let list = [...PERGUNTAS_COMUNIDADE_MOCK];
    if (filtroCategoria) list = list.filter((p) => p.categoriaId === filtroCategoria);
    return list;
  }, [filtroCategoria]);

  const perguntasFluxo = useMemo(() => {
    let list = [...PERGUNTAS_FLUXO_MOCK];
    if (filtroCategoria) list = list.filter((p) => p.categoriaId === filtroCategoria);
    return list;
  }, [filtroCategoria]);

  const handleVote = (respostaId: string) => {
    setVotosPorResposta((prev) => ({ ...prev, [respostaId]: (prev[respostaId] ?? 0) + 1 }));
  };

  return (
    <TinderDoFluxoPageShell title="Perguntas e Respostas" subtitle="Conhecimento coletivo da comunidade">
      <AppLayout breadcrumbs={[]}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Abas */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className={tab === 'comunidade' ? 'btn btn-primary' : 'btn btn-outline'}
              onClick={() => setTab('comunidade')}
            >
              Comunidade
            </button>
            {isMentoradoFluxo && (
              <button
                type="button"
                className={tab === 'fluxo' ? 'btn btn-primary' : 'btn btn-outline'}
                onClick={() => setTab('fluxo')}
              >
                Só Fluxo
              </button>
            )}
          </div>

          {/* Filtro por categoria */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Categoria:</span>
            <button
              type="button"
              className={filtroCategoria === '' ? 'btn btn-primary' : 'btn btn-outline'}
              onClick={() => setFiltroCategoria('')}
            >
              Todas
            </button>
            {CATEGORIAS_PERGUNTAS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={filtroCategoria === c.id ? 'btn btn-primary' : 'btn btn-outline'}
                onClick={() => setFiltroCategoria(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>

          {detalhe ? (
            <DetalhePergunta
              pergunta={detalhe}
              votosPorResposta={votosPorResposta}
              onVote={handleVote}
              onClose={() => setDetalhe(null)}
            />
          ) : (
            <>
              {tab === 'comunidade' &&
                perguntasComunidade.map((p) => (
                  <PerguntaCard key={p.id} pergunta={p} onClick={() => setDetalhe(p)} />
                ))}
              {tab === 'fluxo' &&
                (isMentoradoFluxo ? (
                  perguntasFluxo.map((p) => (
                    <PerguntaCard key={p.id} pergunta={p} onClick={() => setDetalhe(p)} />
                  ))
                ) : (
                  <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>
                      Este feed é exclusivo para mentorados do Fluxo.
                    </p>
                  </div>
                ))}
              {tab === 'comunidade' && perguntasComunidade.length === 0 && (
                <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)' }}>Nenhuma pergunta nesta categoria.</p>
                </div>
              )}
              {tab === 'fluxo' && isMentoradoFluxo && perguntasFluxo.length === 0 && (
                <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)' }}>Nenhuma pergunta no feed Fluxo.</p>
                </div>
              )}
            </>
          )}
        </div>
      </AppLayout>
    </TinderDoFluxoPageShell>
  );
}
