/** Categorias do feed de perguntas (front-only mock) */
export const CATEGORIAS_PERGUNTAS = [
  { id: 'produto', label: 'Concepção de Produto' },
  { id: 'copy', label: 'Copy' },
  { id: 'trafego', label: 'Tráfego' },
  { id: 'pico', label: 'Pico de Vendas' },
] as const;

export const SUBCATEGORIAS_COPY = [
  { id: 'pagina', label: 'Página' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'anuncios', label: 'Anúncios' },
] as const;

export type CategoriaId = typeof CATEGORIAS_PERGUNTAS[number]['id'];
export type SubcategoriaCopyId = typeof SUBCATEGORIAS_COPY[number]['id'];

export interface RespostaMock {
  id: string;
  autorNome: string;
  conteudo: string;
  votos: number;
  createdAt: string;
  isFluxo?: boolean;
}

export interface PerguntaMock {
  id: string;
  titulo: string;
  corpo: string;
  categoriaId: CategoriaId;
  subcategoriaCopyId?: SubcategoriaCopyId;
  autorNome: string;
  createdAt: string;
  respostas: RespostaMock[];
  somenteFluxo: boolean; // true = só aparece no feed "Só Fluxo"
}

const agora = new Date().toISOString();
const ontem = new Date(Date.now() - 86400000).toISOString();

/** Perguntas da comunidade (feed geral) */
export const PERGUNTAS_COMUNIDADE_MOCK: PerguntaMock[] = [
  {
    id: 'p1',
    titulo: 'Como estruturar a página de vendas do primeiro infoproduto?',
    corpo: 'Estou criando meu primeiro produto digital e não sei por onde começar na página. Quais blocos são essenciais?',
    categoriaId: 'copy',
    subcategoriaCopyId: 'pagina',
    autorNome: 'Ana Silva',
    createdAt: ontem,
    somenteFluxo: false,
    respostas: [
      { id: 'r1-1', autorNome: 'Carlos Mendes', conteudo: 'Comece com headline que fale a dor, depois história, prova social, oferta e CTA. Não complique no início.', votos: 12, createdAt: ontem },
      { id: 'r1-2', autorNome: 'Maria Costa', conteudo: 'Concordo. E use um hook forte nos primeiros 3 segundos – vídeo ou texto que prenda.', votos: 8, createdAt: ontem },
    ],
  },
  {
    id: 'p2',
    titulo: 'Melhor horário para disparar tráfego pago no Brasil?',
    corpo: 'Alguém tem dados de melhor dia/hora para anúncios Meta no Brasil?',
    categoriaId: 'trafego',
    autorNome: 'João Santos',
    createdAt: agora,
    somenteFluxo: false,
    respostas: [
      { id: 'r2-1', autorNome: 'Paula Lima', conteudo: 'Geralmente 19h–22h e fins de semana performam bem para cold. Teste e compare no seu pixel.', votos: 5, createdAt: agora },
    ],
  },
  {
    id: 'p3',
    titulo: 'Quiz para captação: quantas perguntas ideal?',
    corpo: 'Quero criar um quiz para lead. Quantas perguntas vocês usam e como definem o resultado?',
    categoriaId: 'copy',
    subcategoriaCopyId: 'quiz',
    autorNome: 'Ricardo Alves',
    createdAt: ontem,
    somenteFluxo: false,
    respostas: [
      { id: 'r3-1', autorNome: 'Fernanda Rocha', conteudo: 'Entre 5 e 8 perguntas. O resultado deve segmentar o lead para sua oferta principal.', votos: 9, createdAt: ontem },
    ],
  },
];

/** Perguntas exclusivas do Fluxo (só mentorados Fluxo) */
export const PERGUNTAS_FLUXO_MOCK: PerguntaMock[] = [
  {
    id: 'pf1',
    titulo: 'Estratégia de pico para lançamento com equipe pequena',
    corpo: 'Como vocês organizam o pico com 2–3 pessoas na operação? Dicas de priorização.',
    categoriaId: 'pico',
    autorNome: 'Líder Fluxo',
    createdAt: agora,
    somenteFluxo: true,
    respostas: [
      { id: 'rf1-1', autorNome: 'Mentorado Pro', conteudo: 'Foco em tráfego + copy primeiro. Suporte e SAC podem ser terceirizados no pico.', votos: 6, createdAt: agora, isFluxo: true },
    ],
  },
  {
    id: 'pf2',
    titulo: 'Automação de follow-up pós-venda no Fluxo',
    corpo: 'Qual fluxo de email/WhatsApp vocês usam depois do primeiro produto vendido?',
    categoriaId: 'produto',
    autorNome: 'Camila Fluxo',
    createdAt: ontem,
    somenteFluxo: true,
    respostas: [
      { id: 'rf2-1', autorNome: 'Expert Fluxo', conteudo: 'D1 agradecimento + próximo passo, D3 conteúdo de valor, D7 oferta complementar. Tudo automatizado.', votos: 4, createdAt: ontem, isFluxo: true },
    ],
  },
];
