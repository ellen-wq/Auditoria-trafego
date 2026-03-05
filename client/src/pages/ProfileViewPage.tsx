// VERSION: 2024-02-28-v2
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useProfileView } from '../hooks/useProfileView';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { AvailabilityStatus } from '../components/profile/AvailabilityStatus';
import { ProfileMetrics } from '../components/profile/ProfileMetrics';
import { ProfileAbout } from '../components/profile/ProfileAbout';
import { ProfileProjects } from '../components/profile/ProfileProjects';
import { ProfileSkills } from '../components/profile/ProfileSkills';
import { ProfileReviews } from '../components/profile/ProfileReviews';
import { ExpertProductsList } from '../components/profile/ExpertProductsList';
import { CoprodutorCapabilitiesList } from '../components/profile/CoprodutorCapabilitiesList';
import { PrestadorDetailsView } from '../components/profile/PrestadorDetailsView';
import { ProfileMentoradoLayout } from '../components/profile/ProfileMentoradoLayout';
import TinderDoFluxoPageShell from '../components/tinder-do-fluxo/TinderDoFluxoPageShell';
import { api } from '../services/api';

interface ProfileViewPageProps {
  userId?: string;
}

export default function ProfileViewPage({ userId: userIdProp }: ProfileViewPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Pegar userId de prop, query param ou usuário atual
  const currentUser = api.getUser();
  const userId = userIdProp || searchParams.get('userId') || undefined;
  const returnTo = searchParams.get('returnTo') || undefined;
  const isViewingOtherProfile = userId && userId !== currentUser?.id;
  
  const { data: profileData, isLoading, error } = useProfileView(userId);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [isSendingInterest, setIsSendingInterest] = useState(false);

  const targetUserId = (userId || currentUser?.id) ?? '';

  // Buscar reviews (dependências primitivas para evitar loop de re-renders)
  useEffect(() => {
    if (!profileData || !targetUserId) return;

    setReviewsLoading(true);
    api.get<{ reviews: any[] }>(`/api/tinder-do-fluxo/profile-reviews?userId=${targetUserId}`)
      .then((res) => {
        setReviews(res.reviews || []);
      })
      .catch((err) => {
        console.error('Erro ao buscar reviews:', err);
        setReviews([]);
      })
      .finally(() => {
        setReviewsLoading(false);
      });
  }, [targetUserId, !!profileData]);

  // Handler para criar conexão
  const handleMatch = async () => {
    if (!userId || !isViewingOtherProfile || isSendingInterest) return;

    setIsSendingInterest(true);
    try {
      const res = await api.post<{ ok: boolean; matched: boolean; matchId?: number }>(
        '/api/tinder-do-fluxo/interest',
        { toUserId: userId, type: 'EXPERT' }
      );
      
      if (res?.matched) {
        alert('👋 Nova conexão! Vocês demonstraram interesse mútuo.');
      } else {
        alert('👋 Interesse registrado! Você será notificado quando houver conexão.');
      }
      
      // Voltar para página de descoberta
      navigate('/tinder-do-fluxo/expert');
    } catch (err) {
      console.error('Erro ao enviar interesse:', err);
      alert('Erro ao enviar interesse. Tente novamente.');
    } finally {
      setIsSendingInterest(false);
    }
  };

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

  // Novo layout: próprio perfil e perfil de mentorado (Expert ou Coprodutor, ou sem prestadorDetails = não é aluno)
  const isMentorado =
    profileData.isExpert ||
    profileData.isCoprodutor ||
    (!!profileData.expertDetails && Object.keys(profileData.expertDetails).length > 0) ||
    (!!profileData.coprodutorDetails && Object.keys(profileData.coprodutorDetails).length > 0) ||
    !profileData.prestadorDetails;
  const useNewLayout = !isViewingOtherProfile && isMentorado;

  if (useNewLayout) {
    return (
      <TinderDoFluxoPageShell title="Meu Perfil">
        <ProfileMentoradoLayout
          data={profileData}
          reviews={reviews.map((r) => ({
            id: r.id,
            autor_nome: r.autor_nome,
            rating: r.rating,
            depoimento: r.depoimento,
            created_at: r.created_at,
          }))}
          reviewsLoading={reviewsLoading}
          isOwnProfile
          onEdit={() => navigate('/tinder-do-fluxo/perfil?edit=true')}
        />
      </TinderDoFluxoPageShell>
    );
  }

  return (
    <TinderDoFluxoPageShell title={isViewingOtherProfile ? `Perfil de ${user.nome}` : "Meu Perfil"}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>
        {/* Botão de Conexão se estiver vendo perfil de outro usuário */}
        {(isViewingOtherProfile || returnTo) && (
          <div style={{ marginBottom: 16, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button 
              className="btn btn-outline"
              onClick={() => navigate(returnTo || '/tinder-do-fluxo/expert')}
            >
              ← Voltar
            </button>
            {!returnTo && (
              <button 
                className="btn btn-primary"
                onClick={handleMatch}
                disabled={isSendingInterest}
              >
                {isSendingInterest ? 'Enviando...' : '👋 Conexão'}
              </button>
            )}
          </div>
        )}

        {/* Header do Perfil */}
        <ProfileHeader
          name={user.nome}
          headline={profile?.headline || ''}
          photoUrl={profile?.photo_url}
          cidade={profile?.cidade}
          nicho={profile?.nicho}
          hobbies={profile?.hobbies}
          instagram={(profile as { instagram?: string })?.instagram}
          nivelFluxo={profile?.nivel_fluxo_label}
          isExpert={profileData.isExpert}
          isCoprodutor={profileData.isCoprodutor}
          precisaTrafegoPago={expertDetails?.precisa_trafego_pago || false}
          precisaCopy={expertDetails?.precisa_copy || false}
          precisaAutomacoes={expertDetails?.precisa_automacoes || false}
          precisaEstrategista={expertDetails?.precisa_estrategista || false}
          fazPerpetuo={coprodutorDetails?.faz_perpetuo || false}
          fazPicoVendas={coprodutorDetails?.faz_pico_vendas || false}
          fazTrafegoPago={coprodutorDetails?.faz_trafego_pago || false}
          fazCopy={coprodutorDetails?.faz_copy || false}
          fazAutomacoes={coprodutorDetails?.faz_automacoes || false}
          onEdit={isViewingOtherProfile ? undefined : () => navigate('/tinder-do-fluxo/perfil?edit=true')}
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
        <ProfileProjects 
          projects={projects ? projects.map((p, idx) => ({ ...p, id: `project-${idx}` })) : []} 
          isPrestador={!!prestadorDetails}
        />

        {/* Habilidades */}
        <ProfileSkills
          skills={skills}
          skillsExtra={skillsExtra}
        />

        {/* Interesses em Parceria - REMOVIDO: não mostrar mais esta seção */}

        {/* Produtos do Expert - apenas se for Expert */}
        {profileData.isExpert && expertDetails && expertDetails.products && (
          <ExpertProductsList products={expertDetails.products} />
        )}

        {/* Capacidades do Coprodutor - apenas se for Coprodutor */}
        {profileData.isCoprodutor && coprodutorDetails && (
          <CoprodutorCapabilitiesList capabilities={coprodutorDetails} />
        )}

        {/* Prestador Details */}
        {prestadorDetails && (
          <PrestadorDetailsView prestadorDetails={prestadorDetails} />
        )}

        {/* Depoimentos */}
        <ProfileReviews 
          reviews={reviews.map(r => ({
            id: r.id,
            autor_nome: r.autor_nome,
            rating: r.rating,
            depoimento: r.depoimento,
            created_at: r.created_at
          }))} 
          rating={metrics.rating} 
          totalReviews={reviews.length} 
        />

        {/* CTA Final - só mostrar se for o próprio perfil */}
        {!isViewingOtherProfile && (
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
        )}
      </div>
    </TinderDoFluxoPageShell>
  );
}
