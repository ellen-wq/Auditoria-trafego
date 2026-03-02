import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

// ============================================================
// TYPES
// ============================================================

export interface ProfileFormData {
  // Dados básicos
  headline: string;
  cidade: string;
  whatsapp: string;
  idiomas: string[];
  anos_experiencia: number;
  photo_url?: string;
  
  // Sobre
  bio_busca: string;
  
  // Disponibilidade
  disponivel: boolean;
  horas_semanais: number;
  // Tags de disponibilidade (projetos, parcerias, coproducao, sociedade)
  availability_tags?: string[];
  modelo_trabalho?: string;
  
  // Habilidades
  skills: {
    copywriter?: number;
    trafego_pago?: number;
    automacao_ia?: number;
  };
  skillsExtra: Array<{
    id?: string;
    nome: string;
    nivel: number;
  }>;
  
  // Projetos
  projects: Array<{
    id?: string;
    nome: string;
    descricao: string;
    ano: number | null;
    tags: string[];
    link: string;
  }>;
  
  // Mentorado - Expert
  expert?: {
    products?: Array<{
      id?: string;
      tipo_produto: string;
      preco: number;
      modelo: string;
      nicho?: string;
      publico?: string;
    }>;
    precisa_trafego_pago?: boolean;
    precisa_copy?: boolean;
    precisa_automacoes?: boolean;
    precisa_estrategista?: boolean;
  };
  
  // Mentorado - Coprodutor
  coprodutor?: {
    faz_perpetuo?: boolean;
    faz_pico_vendas?: boolean;
    faz_trafego_pago?: boolean;
    faz_copy?: boolean;
    faz_automacoes?: boolean;
  };
  
  // Aluno - Prestador
  prestador?: {
    servicos: string[];
    valor_minimo: number;
    modelo_contratacao: string;
  };
  
  // Flags
  isExpert?: boolean;
  isCoprodutor?: boolean;
}

export interface ProfileResponse {
  profile: any;
  expertDetails: any;
  coprodutorDetails: any;
  prestadorDetails: any;
  skills: Array<{ categoria: string; nivel: number }>;
  skillsExtra: Array<{ id: string; nome: string; nivel: number }>;
  projects: Array<{ id: string; nome: string; descricao: string; ano: number; tags: string[]; link_portfolio: string }>;
  isExpert?: boolean;
  isCoprodutor?: boolean;
}

// ============================================================
// useProfileForm
// ============================================================

export function useProfileForm() {
  const queryClient = useQueryClient();
  const [tipoUsuario, setTipoUsuario] = useState<'mentorado' | 'aluno'>('mentorado');
  
  // Buscar perfil
  const { data: profileData, isLoading, error: queryError } = useQuery<ProfileResponse>({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      try {
        const res = await api.get<ProfileResponse>('/api/tinder-do-fluxo/profile/me');
        return res;
      } catch (err: any) {
        console.error('[useProfileFormNew] Erro ao buscar perfil:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    retry: 1,
  });
  
  // Determinar tipo_usuario APÓS receber os dados, fora do queryFn
  useEffect(() => {
    if (profileData) {
      const newTipoUsuario = profileData.prestadorDetails ? 'aluno' : 'mentorado';
      setTipoUsuario(prev => {
        if (prev !== newTipoUsuario) {
          return newTipoUsuario;
        }
        return prev;
      });
    }
  }, [profileData?.prestadorDetails]); // Só depende de prestadorDetails
  
  // Usar ref para armazenar o último formData calculado e evitar recriações desnecessárias
  const formDataRef = useRef<ProfileFormData | null>(null);
  const dataKeyRef = useRef<string | null>(null);
  
  // Criar uma chave estável baseada nos dados principais
  const dataKey = useMemo(() => {
    if (!profileData) return null;
    return JSON.stringify({
      headline: profileData.profile?.headline,
      cidade: profileData.profile?.city,
      isExpert: profileData.isExpert,
      isCoprodutor: profileData.isCoprodutor,
      hasExpert: !!profileData.expertDetails,
      hasCoprodutor: !!profileData.coprodutorDetails,
      hasPrestador: !!profileData.prestadorDetails,
      skillsCount: profileData.skills?.length || 0,
      projectsCount: profileData.projects?.length || 0,
    });
  }, [profileData]);
  
  // Transformar dados do backend em formData (memoizado para evitar re-renders infinitos)
  const formData: ProfileFormData | null = useMemo(() => {
    if (!profileData) {
      formDataRef.current = null;
      dataKeyRef.current = null;
      return null;
    }
    
    // Se a chave não mudou, retornar o valor anterior (mesma referência)
    if (dataKey === dataKeyRef.current && formDataRef.current) {
      return formDataRef.current;
    }
    
    const result: any = {
      photo_url: (profileData.profile as any)?.photo_url || '',
      headline: profileData.profile?.headline || '',
      cidade: profileData.profile?.city || '',
      whatsapp: profileData.profile?.whatsapp || '',
      idiomas: profileData.profile?.idiomas || [],
      anos_experiencia: profileData.profile?.anos_experiencia || 0,
      bio_busca: profileData.profile?.bio || profileData.profile?.search_bio || '',
      disponivel: profileData.profile?.disponivel ?? true,
      horas_semanais: profileData.profile?.horas_semanais || 0,
      availability_tags: (profileData.profile as any)?.availability_tags || [],
      modelo_trabalho: (profileData.profile as any)?.modelo_trabalho || 'remoto',
      skills: {
        copywriter: profileData.skills?.find(s => s.categoria === 'copywriter')?.nivel,
        trafego_pago: profileData.skills?.find(s => s.categoria === 'trafego_pago')?.nivel,
        automacao_ia: profileData.skills?.find(s => s.categoria === 'automacao_ia')?.nivel,
      },
      skillsExtra: profileData.skillsExtra?.map(s => ({
        id: s.id,
        nome: s.nome,
        nivel: s.nivel,
      })) || [],
      projects: profileData.projects?.map(p => ({
        id: p.id,
        nome: p.nome,
        descricao: p.descricao || '',
        ano: p.ano || null,
        tags: p.tags || [],
        link: p.link_portfolio || '',
      })) || [],
      // Expert: apenas se isExpert for true
      expert: (profileData.isExpert && profileData.expertDetails) ? {
        products: (profileData.expertDetails as any)?.products || [],
        precisa_trafego_pago: (profileData.profile as any)?.precisa_trafego_pago || false,
        precisa_copy: (profileData.profile as any)?.precisa_copy || false,
        precisa_automacoes: (profileData.profile as any)?.precisa_automacoes || false,
        precisa_estrategista: (profileData.profile as any)?.precisa_estrategista || false,
      } : undefined,
      // Coprodutor: apenas se isCoprodutor for true
      coprodutor: (profileData.isCoprodutor && profileData.coprodutorDetails) ? {
        faz_perpetuo: (profileData.profile as any)?.faz_perpetuo || false,
        faz_pico_vendas: (profileData.profile as any)?.faz_pico_vendas || false,
        faz_trafego_pago: (profileData.profile as any)?.faz_trafego_pago || false,
        faz_copy: (profileData.profile as any)?.faz_copy || false,
        faz_automacoes: (profileData.profile as any)?.faz_automacoes || false,
      } : undefined,
      prestador: profileData.prestadorDetails ? {
        servicos: profileData.prestadorDetails.servicos || [],
        valor_minimo: profileData.prestadorDetails.valor_minimo || 0,
        modelo_contratacao: profileData.profile?.modelo_trabalho || 'remoto',
      } : undefined,
      isExpert: profileData.isExpert || false,
      isCoprodutor: profileData.isCoprodutor || false,
    };
    
    // Armazenar no ref para próxima comparação
    formDataRef.current = result;
    dataKeyRef.current = dataKey;
    
    return result;
  }, [dataKey, profileData]); // Usar chave serializada e profileData como dependências
  
  // Mutation para salvar
  const saveMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      // Preparar payload
      const payload: any = {
        profile: {
          photo_url: data.photo_url,
          headline: data.headline,
          cidade: data.cidade,
          whatsapp: data.whatsapp,
          idiomas: data.idiomas,
          anos_experiencia: data.anos_experiencia,
          bio_busca: data.bio_busca,
          disponivel: data.disponivel,
          horas_semanais: data.horas_semanais,
          availability_tags: data.availability_tags || [],
          modelo_trabalho: (data as any).modelo_trabalho || 'remoto',
        },
        skills: Object.entries(data.skills)
          .filter(([_, nivel]) => nivel !== undefined && nivel > 0)
          .map(([categoria, nivel]) => ({ categoria, nivel: nivel! })),
        skillsExtra: data.skillsExtra,
        projects: data.projects,
      };
      
      if (tipoUsuario === 'mentorado') {
        payload.isExpert = data.isExpert || false;
        payload.isCoprodutor = data.isCoprodutor || false;
        
        if (data.expert && data.isExpert) {
          // Garantir que products seja preservado
          payload.expert = {
            ...data.expert,
            products: data.expert.products || [],
          };
          console.log('[useProfileFormNew] Enviando expert com produtos:', {
            isExpert: data.isExpert,
            productsCount: (payload.expert.products || []).length,
            products: JSON.stringify(payload.expert.products, null, 2),
            fullExpert: JSON.stringify(payload.expert, null, 2)
          });
        }
        
        if (data.coprodutor && data.isCoprodutor) {
          payload.coprodutor = data.coprodutor;
        }
      } else {
        if (data.prestador) {
          payload.prestador = data.prestador;
        }
      }
      
      console.log('[useProfileFormNew] Payload completo:', JSON.stringify(payload, null, 2));
      
      return await api.request('/api/tinder-do-fluxo/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async () => {
      // Invalidar cache e recarregar dados de todos os hooks relacionados
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['profile-view'] });
      await queryClient.refetchQueries({ queryKey: ['profile', 'me'] });
    },
  });
  
  
  return {
    formData,
    tipoUsuario,
    isLoading: isLoading || !formData,
    save: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    error: queryError || saveMutation.error,
    isExpert: formData?.isExpert || false,
    isCoprodutor: formData?.isCoprodutor || false,
  };
}
