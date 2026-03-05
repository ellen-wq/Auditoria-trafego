import React from 'react';
import { ProfileMentoradoIdentity } from './ProfileMentoradoIdentity';
import { ProfileMentoradoNeedsOrCapabilities } from './ProfileMentoradoNeedsOrCapabilities';
import { ProfileMentoradoNivelFluxo } from './ProfileMentoradoNivelFluxo';
import { ProfileMentoradoRatingStars } from './ProfileMentoradoRatingStars';
import { ProfileMentoradoProjectsCards } from './ProfileMentoradoProjectsCards';
import { ProfileMentoradoProductsCards } from './ProfileMentoradoProductsCards';
import { ProfileReviews } from './ProfileReviews';
import type { ProfileViewData } from '../../hooks/useProfileView';

export interface ProfileMentoradoLayoutProps {
  data: ProfileViewData;
  reviews: Array<{ id: string; autor_nome: string; rating: number; depoimento?: string; created_at?: string }>;
  reviewsLoading?: boolean;
  isOwnProfile: boolean;
  onEdit?: () => void;
}

export function ProfileMentoradoLayout({
  data,
  reviews,
  reviewsLoading,
  isOwnProfile,
  onEdit,
}: ProfileMentoradoLayoutProps) {
  const {
    user,
    profile,
    expertDetails,
    coprodutorDetails,
    projects,
    metrics,
    isExpert,
    isCoprodutor,
  } = data;

  const objetivo = profile?.objetivo ?? profile?.headline ?? '';
  const projectsWithId = (projects || []).map((p, idx) => ({ ...p, id: `project-${idx}` }));

  return (
    <div
      style={{
        maxWidth: 896,
        margin: '0 auto',
        padding: '0 24px 48px',
      }}
    >
      {/* Card container */}
      <div
        className="card"
        style={{
          padding: 0,
          marginBottom: 24,
          overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {/* Cover strip */}
        <div
          style={{
            height: 128,
            background: `linear-gradient(to right, color-mix(in srgb, var(--accent) 30%, transparent), color-mix(in srgb, var(--accent) 10%, transparent), transparent)`,
          }}
        />
        <div style={{ padding: '0 32px 32px' }}>
          <ProfileMentoradoIdentity
            name={user.nome}
            photoUrl={profile?.photo_url}
            cidade={profile?.cidade}
            nicho={profile?.nicho}
            hobbies={profile?.hobbies}
            nivelFluxo={profile?.nivel_fluxo_label}
            isExpert={!!isExpert}
            isCoprodutor={!!isCoprodutor}
            onEdit={isOwnProfile ? onEdit : undefined}
          />

          {/* Grid: 8 + 4 (em telas largas); 1 coluna em mobile */}
          <div
            className="profile-mentorado-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)',
              gap: 40,
              marginTop: 48,
            }}
          >
            {/* Left column - main content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {/* Sobre mim */}
              {profile?.bio_busca && (
                <section>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--accent)' }}>
                      person
                    </span>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 18,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Sobre mim
                    </h3>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.7,
                      fontSize: 16,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {profile.bio_busca}
                  </p>
                </section>
              )}

              {/* Objetivos de parceria (texto) */}
              {objetivo && (
                <section>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--accent)' }}>
                      rocket_launch
                    </span>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 18,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Objetivos de parceria
                    </h3>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      fontSize: 15,
                    }}
                  >
                    {objetivo}
                  </p>
                </section>
              )}

              {/* Quadros em grid de cards (spec): Coprodutor = Projetos, Expert = Produtos */}
              {isCoprodutor && (
                <ProfileMentoradoProjectsCards projects={projectsWithId} />
              )}
              {isExpert && (
                <ProfileMentoradoProductsCards products={expertDetails?.products || []} />
              )}

              {/* Depoimentos */}
              <section>
                <ProfileReviews
                  reviews={reviews}
                  rating={metrics.rating}
                  totalReviews={reviews.length}
                />
              </section>
            </div>

            {/* Right column - sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <ProfileMentoradoNeedsOrCapabilities
                isExpert={!!isExpert}
                isCoprodutor={!!isCoprodutor}
                expertDetails={expertDetails}
                coprodutorDetails={coprodutorDetails}
              />
              <ProfileMentoradoNivelFluxo
                nivelLabel={profile?.nivel_fluxo_label}
                nivelPercent={profile?.nivel_fluxo_percent}
              />
              <ProfileMentoradoRatingStars
                rating={metrics.rating}
                totalReviews={reviews.length}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer help */}
      {isOwnProfile && (
        <footer style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
            Precisa de ajuda com seu perfil?{' '}
            <a href="#" style={{ color: 'var(--accent)', fontWeight: 700 }}>
              Fale com o suporte
            </a>
          </p>
        </footer>
      )}
    </div>
  );
}
