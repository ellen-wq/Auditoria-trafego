import { useNavigate } from 'react-router-dom';
import { useProfileView } from '../hooks/useProfileView';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { AvailabilityStatus } from '../components/profile/AvailabilityStatus';
import { ProfileMetrics } from '../components/profile/ProfileMetrics';
import { ProfileAbout } from '../components/profile/ProfileAbout';
import { ProfileProjects } from '../components/profile/ProfileProjects';
import { ProfileSkills } from '../components/profile/ProfileSkills';
import { ProfileInterests } from '../components/profile/ProfileInterests';
import { ProfileReviews } from '../components/profile/ProfileReviews';
import { ExpertDetailsView } from '../components/profile/ExpertDetailsView';
import { CoprodutorDetailsView } from '../components/profile/CoprodutorDetailsView';
import { PrestadorDetailsView } from '../components/profile/PrestadorDetailsView';
import TinderDoFluxoPageShell from '../components/tinder-do-fluxo/TinderDoFluxoPageShell';

interface ProfileViewPageProps {
  userId?: string;
}

export default function ProfileViewPage({ userId }: ProfileViewPageProps) {
  const navigate = useNavigate();
  const { data: profileData, isLoading, error } = useProfileView(userId);

  if (isLoading) {
    return (
      <TinderDoFluxoPageShell title="Meu Perfil">
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-secondary)' }}>Carregando perfil...</p>
        </div>
      </TinderDoFluxoPageShell>
    );
  }

  if (error || !profileData) {
    return (
      <TinderDoFluxoPageShell title="Meu Perfil">
        <div className="card">
          <div style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ color: 'var(--error)', marginBottom: 16 }}>
              Erro ao carregar perfil. Tente novamente.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/tinder-do-fluxo/perfil?edit=true')}>
              Editar Perfil
            </button>
          </div>
        </div>
      </TinderDoFluxoPageShell>
    );
  }

  const { 
    user, 
    profile, 
    expertDetails, 
    coprodutorDetails, 
    prestadorDetails,
    skills,
    skillsExtra,
    projects, 
    metrics 
  } = profileData;

  return (
    <TinderDoFluxoPageShell title="Meu Perfil">
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>
        {/* Header do Perfil */}
        <ProfileHeader
          name={user.nome}
          headline={profile?.headline || ''}
          photoUrl={profile?.photo_url}
          cidade={profile?.cidade}
          objetivo={profile?.objetivo}
          anosExperiencia={profile?.anos_experiencia}
          horasSemanais={profile?.horas_semanais}
          modeloTrabalho={profile?.modelo_trabalho}
          onEdit={() => navigate('/tinder-do-fluxo/perfil?edit=true')}
        />

        {/* Status de Disponibilidade */}
        <AvailabilityStatus
          disponivel={profile?.disponivel ?? true}
          horasSemanais={profile?.horas_semanais ?? 0}
          modeloTrabalho={(profile?.modelo_trabalho as 'remoto' | 'hibrido' | 'presencial') || 'remoto'}
          idiomas={profile?.idiomas || []}
          availabilityTags={(profile as any)?.availability_tags || []}
        />

        {/* Métricas */}
        <ProfileMetrics
          totalProjetos={metrics.total_projetos}
          rating={metrics.rating}
          anosExperiencia={profile?.anos_experiencia || 0}
        />

        {/* Sobre */}
        {profile?.bio_busca && (
          <ProfileAbout bio={profile.bio_busca} />
        )}

        {/* Projetos Concluídos */}
        {projects && projects.length > 0 && (
          <ProfileProjects projects={projects.map((p, idx) => ({ ...p, id: `project-${idx}` }))} />
        )}

        {/* Habilidades */}
        <ProfileSkills
          skills={skills}
          skillsExtra={skillsExtra}
        />

        {/* Interesses em Parceria - Só mostra se não houver objetivo (objetivo está no header) */}
        {!profile?.objetivo && (profileData.isExpert || profileData.isCoprodutor) && (
          <ProfileInterests 
            objetivo={profile?.objetivo} 
            isExpert={profileData.isExpert}
            isCoproducer={profileData.isCoprodutor}
          />
        )}

        {/* Dados Específicos por Perfil */}
        {expertDetails && (
          <ExpertDetailsView expertDetails={expertDetails} />
        )}

        {coprodutorDetails && (
          <CoprodutorDetailsView coprodutorDetails={coprodutorDetails} />
        )}

        {prestadorDetails && (
          <PrestadorDetailsView prestadorDetails={prestadorDetails} />
        )}

        {/* Depoimentos */}
        <ProfileReviews 
          reviews={[]} 
          rating={metrics.rating} 
          totalReviews={0} 
        />

        {/* CTA Final */}
        <div className="card" style={{ marginTop: 32, textAlign: 'center', padding: '40px 32px' }}>
          <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 22, fontWeight: 600 }}>
            Pronto para começar?
          </h3>
          <p style={{ 
            color: 'var(--text-secondary)', 
            marginBottom: 28,
            fontSize: 15,
            lineHeight: 1.6,
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Explore oportunidades de parceria e projetos na plataforma.
          </p>
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/tinder-do-fluxo/expert')}
              style={{ minWidth: '200px' }}
            >
              Ver Experts & Coprodutores
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/tinder-do-fluxo/perfil?edit=true')}
              style={{ minWidth: '200px' }}
            >
              Editar Perfil
            </button>
          </div>
        </div>
      </div>
    </TinderDoFluxoPageShell>
  );
}
