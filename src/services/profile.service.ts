import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '../db/database';

// ============================================================
// TYPES
// ============================================================

export interface ProfileData {
  headline?: string;
  cidade?: string;
  whatsapp?: string;
  idiomas?: string[];
  anos_experiencia?: number;
  objetivo?: string;
  bio_busca?: string;
  disponivel?: boolean;
  horas_semanais?: number;
}

export interface ExpertDetails {
  tipo_produto?: string;
  preco?: number;
  modelo?: string;
  precisa_trafego?: boolean;
  precisa_coprodutor?: boolean;
  precisa_copy?: boolean;
}

export interface CoprodutorDetails {
  faz_trafego?: boolean;
  faz_lancamento?: boolean;
  faz_perpetuo?: boolean;
  ticket_minimo?: number;
  percentual_minimo?: number;
  aceita_sociedade?: boolean;
  aceita_fee_percentual?: boolean;
}

export interface PrestadorDetails {
  servicos?: string[];
  valor_minimo?: number;
  modelo_contratacao?: string;
}

export interface Skill {
  categoria: 'copywriter' | 'trafego_pago' | 'automacao_ia';
  nivel: number;
}

export interface SkillExtra {
  nome: string;
  nivel: number;
}

export interface Project {
  nome: string;
  descricao?: string;
  ano?: number;
  tags?: string[];
  link?: string;
}

export interface UpdateProfilePayload {
  profile?: ProfileData;
  expert?: ExpertDetails;
  coprodutor?: CoprodutorDetails;
  prestador?: PrestadorDetails;
  skills?: Skill[];
  skillsExtra?: SkillExtra[];
  projects?: Project[];
  isExpert?: boolean;
  isCoprodutor?: boolean;
}

export interface ProfileMetrics {
  total_projetos: number;
  rating: number;
}

export interface ProfileResponse {
  user: {
    nome: string;
  };
  profile: any;
  expertDetails: ExpertDetails | null;
  coprodutorDetails: CoprodutorDetails | null;
  prestadorDetails: PrestadorDetails | null;
  skills: Skill[];
  skillsExtra: SkillExtra[];
  projects: Project[];
  metrics: ProfileMetrics;
  isExpert?: boolean;
  isCoprodutor?: boolean;
}

// ============================================================
// PROFILE SERVICE
// ============================================================

export class ProfileService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = getSupabase();
  }

  // ============================================================
  // GET PROFILE
  // ============================================================

  async getProfile(userId: string, tipoUsuario: 'mentorado' | 'aluno'): Promise<ProfileResponse> {
    const profile: ProfileResponse = {
      user: { nome: '' },
      profile: null,
      expertDetails: null,
      coprodutorDetails: null,
      prestadorDetails: null,
      skills: [],
      skillsExtra: [],
      projects: [],
      metrics: {
        total_projetos: 0,
        rating: 0,
      },
    };

    // Buscar perfil base
    if (tipoUsuario === 'mentorado') {
      const { data: mentorProfile } = await this.supabase
        .from('tinder_mentor_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      // Mapear campos corretamente para mentorado
      if (mentorProfile) {
        profile.profile = {
          ...mentorProfile,
          photo_url: mentorProfile.photo_url,
          headline: mentorProfile.headline || '',
          cidade: mentorProfile.city || '',
          whatsapp: mentorProfile.whatsapp || '',
          objetivo: mentorProfile.goal_text || mentorProfile.objetivo || '',
          bio_busca: mentorProfile.search_bio || mentorProfile.bio || '',
          modelo_trabalho: mentorProfile.modelo_trabalho || 'remoto',
          disponivel: mentorProfile.disponivel ?? true,
          horas_semanais: mentorProfile.horas_semanais || 0,
          anos_experiencia: mentorProfile.anos_experiencia || 0,
          idiomas: mentorProfile.idiomas || [],
          availability_tags: mentorProfile.availability_tags || [],
        };
        profile.isExpert = mentorProfile.is_expert || false;
        profile.isCoprodutor = mentorProfile.is_coproducer || false;
      }
    } else {
      const { data: serviceProfile } = await this.supabase
        .from('tinder_service_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      profile.profile = {
        ...serviceProfile,
        photo_url: serviceProfile?.photo_url,
        headline: serviceProfile?.headline,
        cidade: serviceProfile?.city,
        whatsapp: serviceProfile?.whatsapp,
        objetivo: serviceProfile?.objetivo,
        bio_busca: serviceProfile?.bio || serviceProfile?.bio_busca,
        modelo_trabalho: serviceProfile?.modelo_trabalho,
        disponivel: serviceProfile?.disponivel,
        horas_semanais: serviceProfile?.horas_semanais,
        anos_experiencia: serviceProfile?.anos_experiencia,
        idiomas: serviceProfile?.idiomas || [],
        availability_tags: serviceProfile?.availability_tags || [],
      };
    }

    // Buscar detalhes específicos
    const { data: expertDetails } = await this.supabase
      .from('expert_details')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    profile.expertDetails = expertDetails as ExpertDetails | null;

    const { data: coprodutorDetails } = await this.supabase
      .from('coprodutor_details')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    profile.coprodutorDetails = coprodutorDetails as CoprodutorDetails | null;

    const { data: prestadorDetails } = await this.supabase
      .from('prestador_details')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    profile.prestadorDetails = prestadorDetails as PrestadorDetails | null;

    // Buscar skills
    const { data: skills } = await this.supabase
      .from('profile_skills')
      .select('*')
      .eq('user_id', userId);
    profile.skills = (skills || []).map(s => ({
      categoria: s.categoria as 'copywriter' | 'trafego_pago' | 'automacao_ia',
      nivel: s.nivel,
    }));

    const { data: skillsExtra } = await this.supabase
      .from('profile_skills_extra')
      .select('*')
      .eq('user_id', userId);
    profile.skillsExtra = (skillsExtra || []).map(s => ({
      nome: s.nome,
      nivel: s.nivel,
    }));

    // Buscar projects
    const { data: projects } = await this.supabase
      .from('profile_projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    profile.projects = (projects || []).map(p => ({
      nome: p.nome,
      descricao: p.descricao || '',
      ano: p.ano || undefined,
      tags: p.tags || [],
      link: p.link_portfolio || '',
    }));

    // Calcular métricas
    const totalProjetos = projects?.length || 0;
    
    // Buscar rating médio
    const { data: ratingData } = await this.supabase
      .from('profile_reviews')
      .select('rating')
      .eq('profile_user_id', userId);
    
    let rating = 0;
    if (ratingData && ratingData.length > 0) {
      const sum = ratingData.reduce((acc, r) => acc + (r.rating || 0), 0);
      rating = sum / ratingData.length;
    }
    
    profile.metrics = {
      total_projetos: totalProjetos,
      rating: Math.round(rating * 10) / 10, // Arredondar para 1 casa decimal
    };

    // Buscar nome do usuário
    const { data: userRole } = await this.supabase
      .from('user_roles')
      .select('name')
      .eq('user_id', userId)
      .single();
    
    profile.user = {
      nome: userRole?.name || '',
    };

    return profile;
  }

  // ============================================================
  // UPDATE PROFILE
  // ============================================================

  async updateProfile(userId: string, tipoUsuario: 'mentorado' | 'aluno', payload: UpdateProfilePayload) {
    console.log('[ProfileService] updateProfile chamado:', { userId, tipoUsuario, payload: JSON.stringify(payload, null, 2) });
    
    // 1. Salvar perfil base
    if (payload.profile) {
      const profileData: any = {
        headline: payload.profile.headline || '',
        city: payload.profile.cidade || '',
        whatsapp: payload.profile.whatsapp || '',
        idiomas: payload.profile.idiomas || [],
        anos_experiencia: payload.profile.anos_experiencia || 0,
        horas_semanais: payload.profile.horas_semanais || 0,
        disponivel: payload.profile.disponivel ?? true,
        modelo_trabalho: (payload.profile as any).modelo_trabalho || 'remoto',
        updated_at: new Date().toISOString(),
      };
      
      // Adicionar availability_tags apenas se a coluna existir (será adicionada via migration)
      const availabilityTags = (payload.profile as any).availability_tags || [];
      if (availabilityTags.length > 0 || true) { // Sempre tentar salvar, se a coluna não existir o erro será claro
        profileData.availability_tags = availabilityTags;
      }

      if (tipoUsuario === 'mentorado') {
        profileData.bio = payload.profile.bio_busca || '';
        profileData.goal_text = payload.profile.objetivo || '';
        profileData.search_bio = payload.profile.bio_busca || '';
        
        // Campos de Expert/Coprodutor agora são salvos diretamente em tinder_mentor_profiles
        if (payload.isExpert !== undefined || payload.isCoprodutor !== undefined) {
          profileData.is_expert = payload.isExpert || false;
          profileData.is_coproducer = payload.isCoprodutor || false;
        }
        
        const { data, error } = await this.supabase
          .from('tinder_mentor_profiles')
          .upsert({ user_id: userId, ...profileData }, { onConflict: 'user_id' });
        
        if (error) {
          console.error('[ProfileService] Erro ao salvar tinder_mentor_profiles:', error);
          throw new Error(`Erro ao salvar perfil: ${error.message}`);
        }
        console.log('[ProfileService] Perfil mentorado salvo com sucesso:', data);
      } else {
        profileData.bio = payload.profile.bio_busca || '';
        profileData.objetivo = payload.profile.objetivo || '';
        
        const { data, error } = await this.supabase
          .from('tinder_service_profiles')
          .upsert({ user_id: userId, ...profileData }, { onConflict: 'user_id' });
        
        if (error) {
          console.error('[ProfileService] Erro ao salvar tinder_service_profiles:', error);
          throw new Error(`Erro ao salvar perfil: ${error.message}`);
        }
        console.log('[ProfileService] Perfil prestador salvo com sucesso:', data);
      }
    }

    // 2. Salvar expert_details
    if (payload.expert && (payload.isExpert || tipoUsuario === 'mentorado')) {
      await this.supabase
        .from('expert_details')
        .upsert({
          user_id: userId,
          tipo_produto: payload.expert.tipo_produto || '',
          preco: payload.expert.preco || 0,
          modelo: payload.expert.modelo || '',
          precisa_trafego: payload.expert.precisa_trafego || false,
          precisa_coprodutor: payload.expert.precisa_coprodutor || false,
          precisa_copy: payload.expert.precisa_copy || false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    }

    // 3. Salvar coprodutor_details
    if (payload.coprodutor && (payload.isCoprodutor || tipoUsuario === 'mentorado')) {
      await this.supabase
        .from('coprodutor_details')
        .upsert({
          user_id: userId,
          faz_trafego: payload.coprodutor.faz_trafego || false,
          faz_lancamento: payload.coprodutor.faz_lancamento || false,
          faz_perpetuo: payload.coprodutor.faz_perpetuo || false,
          ticket_minimo: payload.coprodutor.ticket_minimo || 0,
          percentual_minimo: payload.coprodutor.percentual_minimo || 0,
          aceita_sociedade: payload.coprodutor.aceita_sociedade || false,
          aceita_fee_percentual: payload.coprodutor.aceita_fee_percentual || false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    }

    // 4. Salvar prestador_details
    if (payload.prestador && tipoUsuario === 'aluno') {
      await this.supabase
        .from('prestador_details')
        .upsert({
          user_id: userId,
          servicos: payload.prestador.servicos || [],
          valor_minimo: payload.prestador.valor_minimo || 0,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      // Atualizar modelo_trabalho no service profile
      if (payload.prestador.modelo_contratacao) {
        await this.supabase
          .from('tinder_service_profiles')
          .update({ modelo_trabalho: payload.prestador.modelo_contratacao })
          .eq('user_id', userId);
      }
    }

    // 5. Salvar skills
    if (payload.skills) {
      // Deletar skills existentes
      await this.supabase
        .from('profile_skills')
        .delete()
        .eq('user_id', userId);

      // Inserir novas skills
      if (payload.skills.length > 0) {
        await this.supabase
          .from('profile_skills')
          .insert(
            payload.skills.map(skill => ({
              user_id: userId,
              categoria: skill.categoria,
              nivel: skill.nivel,
            }))
          );
      }
    }

    // 6. Salvar skillsExtra
    if (payload.skillsExtra) {
      // Deletar skills extra existentes
      await this.supabase
        .from('profile_skills_extra')
        .delete()
        .eq('user_id', userId);

      // Inserir novas skills extra
      if (payload.skillsExtra.length > 0) {
        await this.supabase
          .from('profile_skills_extra')
          .insert(
            payload.skillsExtra.map(skill => ({
              user_id: userId,
              nome: skill.nome,
              nivel: skill.nivel,
            }))
          );
      }
    }

    // 7. Salvar projects
    if (payload.projects) {
      // Buscar projetos existentes
      const { data: existingProjects } = await this.supabase
        .from('profile_projects')
        .select('id')
        .eq('user_id', userId);

      const projectIds = payload.projects
        .filter(p => (p as any).id)
        .map(p => (p as any).id);
      
      const idsToDelete = existingProjects
        ?.filter(p => !projectIds.includes(p.id))
        .map(p => p.id) || [];

      // Deletar projetos removidos
      if (idsToDelete.length > 0) {
        await this.supabase
          .from('profile_projects')
          .delete()
          .in('id', idsToDelete);
      }

      // Inserir/atualizar projetos
      for (const project of payload.projects) {
        if (!project.nome || !project.nome.trim()) continue;

        const projectData: any = {
          nome: project.nome.trim(),
          descricao: project.descricao || '',
          ano: project.ano || null,
          tags: project.tags || [],
          link_portfolio: project.link || '',
        };

        if ((project as any).id) {
          // Atualizar
          await this.supabase
            .from('profile_projects')
            .update({ ...projectData, updated_at: new Date().toISOString() })
            .eq('id', (project as any).id);
        } else {
          // Inserir
          await this.supabase
            .from('profile_projects')
            .insert({ user_id: userId, ...projectData });
        }
      }
    }

    return { success: true };
  }

  // ============================================================
  // UPLOAD AVATAR
  // ============================================================

  async uploadAvatar(userId: string, file: Buffer, filename: string, contentType: string) {
    const bucketName = 'avatars';
    
    // Verificar se o bucket existe, se não, criar
    const { data: buckets } = await this.supabase.storage.listBuckets();
    const bucketExists = (buckets || []).some((b) => b.name === bucketName);
    
    if (!bucketExists) {
      const { error: createError } = await this.supabase.storage.createBucket(bucketName, {
        public: true, // Bucket público para permitir acesso às imagens
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      });
      
      if (createError) {
        throw new Error(`Erro ao criar bucket de avatares: ${createError.message}`);
      }
    }
    
    const fileExt = filename.split('.').pop();
    const filePath = `${userId}/avatar.${fileExt}`;

    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }

    const { data: { publicUrl } } = this.supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    // Atualizar photo_url no perfil
    const { data: userRole } = await this.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (userRole?.role === 'MENTORADO') {
      await this.supabase
        .from('tinder_mentor_profiles')
        .update({ photo_url: publicUrl })
        .eq('user_id', userId);
    } else {
      await this.supabase
        .from('tinder_service_profiles')
        .update({ photo_url: publicUrl })
        .eq('user_id', userId);
    }

    return { url: publicUrl };
  }
}
