import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

// ============================================================
// TYPES
// ============================================================

export interface ProfileViewData {
  user: {
    nome: string;
  };
  profile: {
    photo_url?: string;
    headline?: string;
    cidade?: string;
    whatsapp?: string;
    objetivo?: string;
    bio_busca?: string;
    modelo_trabalho?: string;
    disponivel?: boolean;
    horas_semanais?: number;
    anos_experiencia?: number;
    idiomas?: string[];
    nivel_fluxo_label?: string;
    nivel_fluxo_percent?: number | null;
  };
  expertDetails?: {
    products?: Array<{
      id?: string;
      tipo_produto: string;
      preco: number;
      modelo: string;
    }>;
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
  prestadorDetails?: {
    servicos?: string[];
    valor_minimo?: number;
    modelo_contratacao?: string;
  };
  skills: Array<{
    categoria: string;
    nivel: number;
  }>;
  skillsExtra: Array<{
    nome: string;
    nivel: number;
  }>;
  projects: Array<{
    nome: string;
    descricao?: string;
    ano?: number;
    tags?: string[];
    link?: string;
  }>;
  metrics: {
    total_projetos: number;
    rating: number;
  };
  isExpert?: boolean;
  isCoprodutor?: boolean;
}

// ============================================================
// useProfileView
// ============================================================

export function useProfileView(userId?: string) {
  const currentUser = api.getUser();
  const targetUserId = userId || currentUser?.id;

  return useQuery<ProfileViewData>({
    queryKey: ['profile-view', targetUserId],
    queryFn: async () => {
      if (!targetUserId) {
        throw new Error('User ID is required');
      }
      
      console.log('[useProfileView] Buscando perfil para userId:', targetUserId);
      const params = targetUserId !== currentUser?.id ? `?userId=${targetUserId}` : '';
      const url = `/api/tinder-do-fluxo/profile/me${params}`;
      console.log('[useProfileView] URL:', url);
      
      try {
        const res = await api.get<ProfileViewData>(url);
        console.log('[useProfileView] ✅ Perfil recebido:', res);
        return res;
      } catch (err: any) {
        console.error('[useProfileView] ❌ Erro ao buscar perfil:', err);
        throw err;
      }
    },
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000,
    retry: false,
  });
}
