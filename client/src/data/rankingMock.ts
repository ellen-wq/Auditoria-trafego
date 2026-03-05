/** Gamificação: ranking e pontos (mock – front only) */
export interface RankingEntryMock {
  posicao: number;
  nome: string;
  pontos: number;
  avatar?: string;
}

export const MEUS_PONTOS_MOCK = 120;

export const RANKING_SEMANA_MOCK: RankingEntryMock[] = [
  { posicao: 1, nome: 'Ana Silva', pontos: 340 },
  { posicao: 2, nome: 'Carlos Mendes', pontos: 298 },
  { posicao: 3, nome: 'Maria Costa', pontos: 256 },
  { posicao: 4, nome: 'João Santos', pontos: 210 },
  { posicao: 5, nome: 'Paula Lima', pontos: 189 },
  { posicao: 6, nome: 'Ricardo Alves', pontos: 165 },
  { posicao: 7, nome: 'Fernanda Rocha', pontos: 142 },
  { posicao: 8, nome: 'Líder Fluxo', pontos: 128 },
  { posicao: 9, nome: 'Você', pontos: 120 },
  { posicao: 10, nome: 'Camila Fluxo', pontos: 98 },
];

export const RANKING_GERAL_MOCK: RankingEntryMock[] = [
  { posicao: 1, nome: 'Líder Fluxo', pontos: 2450 },
  { posicao: 2, nome: 'Ana Silva', pontos: 2100 },
  { posicao: 3, nome: 'Carlos Mendes', pontos: 1890 },
  { posicao: 4, nome: 'Maria Costa', pontos: 1650 },
  { posicao: 5, nome: 'Expert Fluxo', pontos: 1520 },
];
