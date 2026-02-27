import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Tema, PostWithCounts, ComentarioWithAuthor, CreatePostData, CreateComentarioData } from '../types/comunidade';

// ============================================================
// useTemas
// ============================================================

export function useTemas() {
  return useQuery<Tema[]>({
    queryKey: ['temas'],
    queryFn: async () => {
      const res = await api.get<{ temas: Tema[] }>('/api/tinder-do-fluxo/comunidade/temas');
      return res.temas || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ============================================================
// useFeed
// ============================================================

export function useFeed(temaId: string | null, page: number = 1) {
  return useQuery<{ posts: PostWithCounts[]; hasMore: boolean }>({
    queryKey: ['feed', temaId, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (temaId) params.append('tema_id', temaId);
      params.append('page', page.toString());
      params.append('per_page', '10');
      
      const res = await api.get<{ posts: PostWithCounts[]; hasMore: boolean }>(
        `/api/tinder-do-fluxo/comunidade/posts?${params.toString()}`
      );
      return res;
    },
    staleTime: 30 * 1000, // 30 segundos
  });
}

// ============================================================
// useTrending
// ============================================================

export function useTrending() {
  return useQuery<PostWithCounts[]>({
    queryKey: ['trending'],
    queryFn: async () => {
      const res = await api.get<{ posts: PostWithCounts[] }>('/api/tinder-do-fluxo/comunidade/trending');
      return res.posts || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// ============================================================
// useCreatePost
// ============================================================

export function useCreatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreatePostData) => {
      const formData = new FormData();
      formData.append('tema_id', data.tema_id);
      formData.append('titulo', data.titulo);
      formData.append('conteudo', data.conteudo);
      
      if (data.media) {
        data.media.forEach((file) => {
          formData.append('media', file);
        });
      }
      
      const res = await api.request<{ post: PostWithCounts }>('/api/tinder-do-fluxo/comunidade/posts', {
        method: 'POST',
        body: formData,
      });
      return res.post;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['trending'] });
    },
  });
}

// ============================================================
// useLikePost
// ============================================================

export function useLikePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      await api.post(`/api/tinder-do-fluxo/comunidade/posts/${postId}/like`);
    },
    onMutate: async (postId) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      await queryClient.cancelQueries({ queryKey: ['trending'] });
      
      // Snapshot do estado anterior
      const previousFeed = queryClient.getQueryData(['feed']);
      
      // Optimistic update
      queryClient.setQueriesData<{ posts: PostWithCounts[]; hasMore: boolean }>(
        { queryKey: ['feed'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            posts: old.posts.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    liked_by_me: !post.liked_by_me,
                    total_curtidas: post.liked_by_me ? post.total_curtidas - 1 : post.total_curtidas + 1,
                  }
                : post
            ),
          };
        }
      );
      
      queryClient.setQueriesData<PostWithCounts[]>(
        { queryKey: ['trending'] },
        (old) => {
          if (!old) return old;
          return old.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  liked_by_me: !post.liked_by_me,
                  total_curtidas: post.liked_by_me ? post.total_curtidas - 1 : post.total_curtidas + 1,
                }
              : post
          );
        }
      );
      
      return { previousFeed };
    },
    onError: (err, postId, context) => {
      // Reverter em caso de erro
      if (context?.previousFeed) {
        queryClient.setQueryData(['feed'], context.previousFeed);
      }
    },
    onSettled: () => {
      // Recarregar dados
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['trending'] });
    },
  });
}

// ============================================================
// useSavePost
// ============================================================

export function useSavePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      await api.post(`/api/tinder-do-fluxo/comunidade/posts/${postId}/save`);
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      await queryClient.cancelQueries({ queryKey: ['trending'] });
      
      const previousFeed = queryClient.getQueryData(['feed']);
      
      queryClient.setQueriesData<{ posts: PostWithCounts[]; hasMore: boolean }>(
        { queryKey: ['feed'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            posts: old.posts.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    saved_by_me: !post.saved_by_me,
                    total_salvos: post.saved_by_me ? post.total_salvos - 1 : post.total_salvos + 1,
                  }
                : post
            ),
          };
        }
      );
      
      queryClient.setQueriesData<PostWithCounts[]>(
        { queryKey: ['trending'] },
        (old) => {
          if (!old) return old;
          return old.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  saved_by_me: !post.saved_by_me,
                  total_salvos: post.saved_by_me ? post.total_salvos - 1 : post.total_salvos + 1,
                }
              : post
          );
        }
      );
      
      return { previousFeed };
    },
    onError: (err, postId, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(['feed'], context.previousFeed);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['trending'] });
    },
  });
}

// ============================================================
// useComentarios
// ============================================================

export function useComentarios(postId: string) {
  return useQuery<ComentarioWithAuthor[]>({
    queryKey: ['comentarios', postId],
    queryFn: async () => {
      const res = await api.get<{ comentarios: ComentarioWithAuthor[] }>(
        `/api/tinder-do-fluxo/comunidade/posts/${postId}/comentarios`
      );
      return res.comentarios || [];
    },
    enabled: !!postId,
    staleTime: 30 * 1000,
  });
}

// ============================================================
// useCreateComentario
// ============================================================

export function useCreateComentario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateComentarioData) => {
      const res = await api.post<{ comentario: ComentarioWithAuthor }>(
        `/api/tinder-do-fluxo/comunidade/posts/${data.post_id}/comentarios`,
        { conteudo: data.conteudo }
      );
      return res.comentario;
    },
    onSuccess: (comentario) => {
      // Adicionar comentário à lista
      queryClient.setQueryData<ComentarioWithAuthor[]>(
        ['comentarios', comentario.post_id],
        (old) => {
          if (!old) return [comentario];
          return [...old, comentario];
        }
      );
      
      // Invalidar feed para atualizar contador
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['trending'] });
    },
  });
}
