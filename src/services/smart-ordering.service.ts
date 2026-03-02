import { SupabaseClient } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  name: string;
  tinder_mentor_profiles: any;
  tinder_expert_profiles: any;
  rating?: number;
  compatibility_score?: number;
  recent_activity?: string;
}

interface SmartOrderingConfig {
  enabled: boolean;
  priority_order: string[];
  rating: {
    source: string;
    field: string;
    nulls_position: string;
  };
  compatibility_scoring: {
    need_vs_capacity_match: {
      weight: number;
      expert_fields: string[];
      coprodutor_fields: string[];
    };
    skill_match: {
      weight: number;
      source: string[];
      calculation: string;
    };
    partnership_type_match: {
      weight: number;
      source: string;
    };
    has_products_or_projects: {
      weight: number;
      expert_source: string;
      coprodutor_source: string;
    };
  };
}

const DEFAULT_CONFIG: SmartOrderingConfig = {
  enabled: true,
  priority_order: [
    'rating_desc',
    'compatibility_score_desc',
    'recent_profile_activity_desc'
  ],
  rating: {
    source: 'tinder_mentor_profiles',
    field: 'average_rating',
    nulls_position: 'last'
  },
  compatibility_scoring: {
    need_vs_capacity_match: {
      weight: 40,
      expert_fields: [
        'precisa_trafego_pago',
        'precisa_copy',
        'precisa_automacoes',
        'precisa_estrategista'
      ],
      coprodutor_fields: [
        'faz_trafego_pago',
        'faz_copy',
        'faz_automacoes',
        'faz_perpetuo'
      ]
    },
    skill_match: {
      weight: 30,
      source: ['profile_skills', 'profile_skills_extra'],
      calculation: 'skill_percentage * 0.3'
    },
    partnership_type_match: {
      weight: 20,
      source: 'preferences_json'
    },
    has_products_or_projects: {
      weight: 10,
      expert_source: 'expert_products',
      coprodutor_source: 'profile_projects'
    }
  }
};

export class SmartOrderingService {
  private supabase: SupabaseClient;
  private config: SmartOrderingConfig;
  private currentUserId: string;

  constructor(supabase: SupabaseClient, currentUserId: string, config?: Partial<SmartOrderingConfig>) {
    this.supabase = supabase;
    this.currentUserId = currentUserId;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async calculateCompatibilityScore(profile: UserProfile, currentUserProfile: any): Promise<number> {
    let score = 0;
    const mp = profile.tinder_mentor_profiles;
    const currentMP = currentUserProfile?.tinder_mentor_profiles;

    if (!mp || !currentMP) return 0;

    // 1. Need vs Capacity Match (40%)
    const needVsCapacityScore = this.calculateNeedVsCapacityMatch(mp, currentMP);
    score += needVsCapacityScore * (this.config.compatibility_scoring.need_vs_capacity_match.weight / 100);

    // 2. Skill Match (30%)
    const skillScore = await this.calculateSkillMatch(profile.id);
    score += skillScore * (this.config.compatibility_scoring.skill_match.weight / 100);

    // 3. Partnership Type Match (20%)
    const partnershipScore = this.calculatePartnershipTypeMatch(mp, currentMP);
    score += partnershipScore * (this.config.compatibility_scoring.partnership_type_match.weight / 100);

    // 4. Has Products or Projects (10%)
    const hasContentScore = await this.calculateHasProductsOrProjects(profile);
    score += hasContentScore * (this.config.compatibility_scoring.has_products_or_projects.weight / 100);

    return Math.min(100, Math.max(0, score));
  }

  private calculateNeedVsCapacityMatch(profile: any, currentProfile: any): number {
    const isCurrentExpert = currentProfile?.is_expert && !currentProfile?.is_coproducer;
    const isCurrentCoprodutor = currentProfile?.is_coproducer && !currentProfile?.is_expert;
    const isProfileExpert = profile?.is_expert && !profile?.is_coproducer;
    const isProfileCoprodutor = profile?.is_coproducer && !profile?.is_expert;

    if (isCurrentExpert && isProfileCoprodutor) {
      // Expert precisa de algo que Coprodutor faz
      const expertFields = this.config.compatibility_scoring.need_vs_capacity_match.expert_fields;
      const coprodutorFields = this.config.compatibility_scoring.need_vs_capacity_match.coprodutor_fields;
      
      let matches = 0;
      let total = 0;

      expertFields.forEach((field, idx) => {
        const coprodutorField = coprodutorFields[idx];
        if (coprodutorField) {
          total++;
          if (currentProfile[field] && profile[coprodutorField]) {
            matches++;
          }
        }
      });

      return total > 0 ? (matches / total) * 100 : 0;
    }

    if (isCurrentCoprodutor && isProfileExpert) {
      // Coprodutor faz algo que Expert precisa
      const expertFields = this.config.compatibility_scoring.need_vs_capacity_match.expert_fields;
      const coprodutorFields = this.config.compatibility_scoring.need_vs_capacity_match.coprodutor_fields;
      
      let matches = 0;
      let total = 0;

      expertFields.forEach((field, idx) => {
        const coprodutorField = coprodutorFields[idx];
        if (coprodutorField) {
          total++;
          if (profile[field] && currentProfile[coprodutorField]) {
            matches++;
          }
        }
      });

      return total > 0 ? (matches / total) * 100 : 0;
    }

    return 0;
  }

  private async calculateSkillMatch(userId: string): Promise<number> {
    try {
      const { data: skills } = await this.supabase
        .from('profile_skills')
        .select('nivel')
        .eq('user_id', userId);

      const { data: skillsExtra } = await this.supabase
        .from('profile_skills_extra')
        .select('nivel')
        .eq('user_id', userId);

      const allSkills = [...(skills || []), ...(skillsExtra || [])];
      if (allSkills.length === 0) return 0;

      const avgLevel = allSkills.reduce((sum, s) => sum + (s.nivel || 0), 0) / allSkills.length;
      return Math.min(100, avgLevel * 0.3);
    } catch (err) {
      console.error('[SmartOrdering] Erro ao calcular skill match:', err);
      return 0;
    }
  }

  private calculatePartnershipTypeMatch(profile: any, currentProfile: any): number {
    const profilePrefs = profile?.preferences_json || {};
    const currentPrefs = currentProfile?.preferences_json || {};

    // Se ambos têm preferências similares, aumenta score
    if (Object.keys(profilePrefs).length > 0 && Object.keys(currentPrefs).length > 0) {
      return 50; // Score médio se ambos têm preferências
    }

    return 0;
  }

  private async calculateHasProductsOrProjects(profile: UserProfile): Promise<number> {
    const mp = profile.tinder_mentor_profiles;
    const isExpert = mp?.is_expert && !mp?.is_coproducer;
    const isCoprodutor = mp?.is_coproducer && !mp?.is_expert;

    try {
      if (isExpert) {
        const { data: products } = await this.supabase
          .from('expert_products')
          .select('id')
          .eq('user_id', profile.id)
          .limit(1);
        return products && products.length > 0 ? 100 : 0;
      }

      if (isCoprodutor) {
        const { data: projects } = await this.supabase
          .from('profile_projects')
          .select('id')
          .eq('user_id', profile.id)
          .limit(1);
        return projects && projects.length > 0 ? 100 : 0;
      }
    } catch (err) {
      console.error('[SmartOrdering] Erro ao verificar produtos/projetos:', err);
    }

    return 0;
  }

  async orderProfiles(profiles: UserProfile[], currentUserProfile: any): Promise<UserProfile[]> {
    if (!this.config.enabled) {
      return profiles;
    }

    // Buscar ratings de todos os perfis de uma vez
    const profileIds = profiles.map(p => p.id);
    const { data: ratings } = await this.supabase
      .from('profile_rating')
      .select('user_id, rating')
      .in('user_id', profileIds);
    
    const ratingMap = new Map((ratings || []).map((r: any) => [r.user_id, r.rating || 0]));

    // Calcular scores para cada perfil
    const profilesWithScores = await Promise.all(
      profiles.map(async (profile) => {
        const compatibilityScore = await this.calculateCompatibilityScore(profile, currentUserProfile);
        const rating = ratingMap.get(profile.id) || 0;
        const recentActivity = profile.tinder_mentor_profiles?.updated_at || profile.tinder_mentor_profiles?.created_at || '';

        return {
          ...profile,
          compatibility_score: compatibilityScore,
          rating: rating,
          recent_activity: recentActivity,
        };
      })
    );

    // Ordenar conforme priority_order
    profilesWithScores.sort((a, b) => {
      for (const order of this.config.priority_order) {
        let comparison = 0;

        if (order === 'rating_desc') {
          comparison = (b.rating || 0) - (a.rating || 0);
        } else if (order === 'compatibility_score_desc') {
          comparison = (b.compatibility_score || 0) - (a.compatibility_score || 0);
        } else if (order === 'recent_profile_activity_desc') {
          const aDate = new Date(a.recent_activity || 0).getTime();
          const bDate = new Date(b.recent_activity || 0).getTime();
          comparison = bDate - aDate;
        }

        if (comparison !== 0) {
          return comparison;
        }
      }
      return 0;
    });

    return profilesWithScores;
  }
}
