// Tipos para a funcionalidade de Comunidade

export interface Tema {
  id: string;
  nome: string;
  permite_postagem: boolean;
  created_at: string;
}

export interface Media {
  id: string;
  post_id: string;
  url: string;
  type: 'image' | 'video';
}

export interface Post {
  id: string;
  tema_id: string | null;
  autor_id: string;
  titulo: string;
  conteudo: string;
  created_at: string;
}

export interface Comentario {
  id: string;
  post_id: string;
  autor_id: string;
  conteudo: string;
  created_at: string;
}

export interface PostWithCounts extends Post {
  tema_nome: string;
  autor_nome: string;
  media: Media[];
  total_curtidas: number;
  total_comentarios: number;
  total_salvos: number;
  liked_by_me: boolean;
  saved_by_me: boolean;
}

export interface ComentarioWithAuthor extends Comentario {
  autor_nome: string;
}

export interface CreatePostData {
  tema_id: string;
  titulo: string;
  conteudo: string;
  media?: File[];
}

export interface CreateComentarioData {
  post_id: string;
  conteudo: string;
}
