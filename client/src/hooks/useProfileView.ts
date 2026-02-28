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
  };
  expertDetails?: {
    tipo_produto?: string;
    preco?: number;
    modelo?: string;
    precisa_trafego?: boolean;
    precisa_coprodutor?: boolean;
    precisa_copy?: boolean;
  };
  coprodutorDetails?: {
    faz_trafego?: boolean;
    faz_lancamento?: boolean;
    faz_perpetuo?: boolean;
    ticket_minimo?: number;
    percentual_minimo?: number;
    aceita_sociedade?: boolean;
    aceita_fee_percentual?: boolean;
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
    retry: 1,
  });
}
