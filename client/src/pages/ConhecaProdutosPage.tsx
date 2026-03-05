import TinderDoFluxoPageShell from '../components/tinder-do-fluxo/TinderDoFluxoPageShell';

const PRODUTOS = [
  {
    id: 'stories10x',
    nome: 'Stories 10X',
    descricao: 'Aprenda a criar stories que convertem e engajam sua audiência no Instagram.',
    cta: 'Conhecer Stories 10X',
  },
  {
    id: 'lightcopy',
    nome: 'Light Copy',
    descricao: 'Copywriting direto ao ponto para páginas, anúncios e vendas.',
    cta: 'Conhecer Light Copy',
  },
  {
    id: 'superx',
    nome: 'Super X',
    descricao: 'Estratégias avançadas para escalar seu negócio digital.',
    cta: 'Conhecer Super X',
  },
  {
    id: 'automacoes',
    nome: 'Automações Inteligentes',
    descricao: 'Automatize processos e vendas com ferramentas e fluxos que funcionam.',
    cta: 'Conhecer Automações',
  },
  {
    id: 'vtsd',
    nome: 'VTSD',
    descricao: 'Vendas e tráfego com método comprovado para infoprodutos.',
    cta: 'Conhecer VTSD',
  },
  {
    id: 'fluxo',
    nome: 'Mentoria Fluxo',
    descricao: 'O próximo nível: mentoria para quem quer resultados consistentes e suporte de alto nível.',
    cta: 'Conhecer o Fluxo',
    destaque: true,
  },
];

export default function ConhecaProdutosPage() {
  return (
    <TinderDoFluxoPageShell
      title="Conheça cada produto"
      subtitle="Sua jornada de evolução no ecossistema Ladeira"
    >
      <div style={{ display: 'grid', gap: 24, maxWidth: 800, margin: '0 auto' }}>
        {PRODUTOS.map((p) => (
          <div
            key={p.id}
            className="card"
            style={{
              padding: 28,
              border: p.destaque ? '2px solid var(--accent)' : '1px solid var(--border)',
              background: p.destaque ? 'color-mix(in srgb, var(--accent) 8%, var(--bg-white))' : undefined,
            }}
          >
            {p.destaque && (
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--accent)',
                  marginBottom: 8,
                }}
              >
                Próximo nível
              </span>
            )}
            <h3 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 700 }}>{p.nome}</h3>
            <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {p.descricao}
            </p>
            <button type="button" className="btn btn-primary" disabled>
              {p.cta}
            </button>
          </div>
        ))}
      </div>
    </TinderDoFluxoPageShell>
  );
}
