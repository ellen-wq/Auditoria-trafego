/**
 * Opções de nível no Fluxo (registro e perfil).
 */
export const NIVEL_OPTIONS = [
  { value: 'newbie', label: 'Newbie (0 vendas)' },
  { value: 'soft', label: 'Soft (1 a 10 mil)' },
  { value: 'hard', label: 'Hard (10 a 100 mil)' },
  { value: 'pro', label: 'Pro (100 mil a 1 milhão)' },
  { value: 'Pro +', label: 'Pro + (1 a 2 milhões)' },
  { value: 'master', label: 'Master (2 milhões +)' },
] as const;

/**
 * Opções de hobbies (seleção múltipla no registro e perfil).
 */
export const HOBBIES_OPTIONS = [
  'Leitura',
  'Esportes',
  'Música',
  'Viagens',
  'Filmes e séries',
  'Culinária',
  'Fotografia',
  'Escrita',
  'Desenvolvimento pessoal',
  'Networking',
  'Arte e criatividade',
  'Tecnologia',
  'Meditação e bem-estar',
  'Voluntariado',
  'Investimentos',
  'Marketing digital',
] as const;

export type HobbyOption = (typeof HOBBIES_OPTIONS)[number];
