/** Progresso por curso (mock – front only). Quando houver backend, trocar por API. */
export interface CursoProgressoMock {
  curso: string;
  percent: number;
}

export const PROGRESSO_CURSOS_MOCK: CursoProgressoMock[] = [
  { curso: 'Stories 10X', percent: 45 },
  { curso: 'Light Copy', percent: 80 },
  { curso: 'Super X', percent: 20 },
  { curso: 'Automações Inteligentes', percent: 0 },
  { curso: 'VTSD', percent: 60 },
  { curso: 'Mentoria Fluxo', percent: 35 },
];
