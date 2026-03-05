import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../components/AppLayout';
import TinderDoFluxoPageShell from '../components/tinder-do-fluxo/TinderDoFluxoPageShell';
import { ExpertSwipeDeck, type ExpertUser } from '../components/tinder-do-fluxo/ExpertSwipeDeck';
import { api } from '../services/api';
import TemaSidebar from '../components/comunidade/TemaSidebar';
import FeedHeader from '../components/comunidade/FeedHeader';
import PostCard from '../components/comunidade/PostCard';
import TrendingPosts from '../components/comunidade/TrendingPosts';
import GlobalSearch from '../components/search/GlobalSearch';
import { useDebounce } from '../hooks/useDebounce';
import type { PostWithCounts } from '../types/comunidade';
import ProfileDiscoveryCard, { ProfileDiscoveryCardActions } from '../components/tinder/ProfileDiscoveryCard';
import MatchModal from '../components/tinder/MatchModal';
import MatchesList from '../components/tinder/MatchesList';
import SwipeActions from '../components/tinder/SwipeActions';

function EmptyState({ text }: { text: string }) {
  return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{text}</p>;
}

export function TinderComunidadePage() {
  const [selectedTemaId, setSelectedTemaId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'trending'>('recent');
  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 400);
  
  const { data: feedData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['feed', selectedTemaId, sortBy, debouncedSearchText],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      if (selectedTemaId) params.append('tema_id', selectedTemaId);
      if (debouncedSearchText) params.append('q', debouncedSearchText);
      params.append('page', String(pageParam));
      params.append('per_page', '10');
      
      const res = await api.get<{ posts: PostWithCounts[]; hasMore: boolean }>(
        `/api/tinder-do-fluxo/comunidade/posts?${params.toString()}`
      );
      return res;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const posts = feedData?.pages.flatMap((page) => page.posts) || [];

  return (
    <TinderDoFluxoPageShell title="Comunidade">
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 300px', gap: 20, alignItems: 'start' }}>
        {/* Sidebar de Temas */}
        <TemaSidebar selectedTemaId={selectedTemaId} onSelectTema={setSelectedTemaId} />

        {/* Feed Principal */}
        <div>
          <GlobalSearch
            placeholder="Buscar por tema, autor, título ou conteúdo..."
            onSearch={setSearchText}
          />
          
          <FeedHeader 
            selectedTemaId={selectedTemaId}
            onSortChange={setSortBy}
            sortBy={sortBy}
          />

          {isLoading ? (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ color: 'var(--text-secondary)' }}>Carregando publicações...</p>
            </div>
          ) : posts.length === 0 ? (
      <div className="card">
              <EmptyState text={debouncedSearchText ? "Nenhuma publicação encontrada para sua busca." : "Nenhuma publicação encontrada."} />
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              
              {hasNextPage && (
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="btn btn-outline"
                  >
                    {isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}
                  </button>
                </div>
              )}
            </>
          )}
              </div>

        {/* Trending Sidebar */}
        <TrendingPosts />
      </div>
    </TinderDoFluxoPageShell>
  );
}

function ExpertDeckSkeleton() {
  return (
    <div className="tinder-deck-wrap">
      <div className="tinder-deck">
        <div className="tinder-card tinder-card-skeleton">
          <div className="skeleton-line" style={{ width: '60%', height: 20 }} />
          <div className="skeleton-line" style={{ width: '40%', height: 14, marginTop: 8 }} />
          <div className="skeleton-line" style={{ width: '100%', height: 14, marginTop: 12 }} />
          <div className="skeleton-line" style={{ width: '80%', height: 14, marginTop: 6 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <div className="skeleton-line" style={{ width: 60, height: 36, borderRadius: 8 }} />
            <div className="skeleton-line" style={{ width: 60, height: 36, borderRadius: 8 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TinderExpertPage() {
  const navigate = useNavigate();
  const [discoveryProfiles, setDiscoveryProfiles] = useState<any[]>([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSendingInterest, setIsSendingInterest] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(() => new Set());
  
  // Header: busca + Expert/Coprodutor (sem filtros de parceria/cidade)
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  const currentUser = api.getUser();

  // Carregar favoritos ao montar a página
  useEffect(() => {
    api.get<{ favorites: { target_user_id: string }[] }>('/api/tinder-do-fluxo/favorites')
      .then((r) => {
        const ids = new Set((r.favorites || []).map((f) => f.target_user_id).filter(Boolean));
        setFavoritedIds(ids);
      })
      .catch(() => {});
  }, []);

  // Load discovery profiles (busca por nome/objetivo + tipo Expert/Coprodutor)
  useEffect(() => {
    loadDiscoveryProfiles();
  }, [lookingFor, debouncedSearchQuery]);

  const loadDiscoveryProfiles = async () => {
    setLoading(true);
    try {
    const params = new URLSearchParams();
      if (debouncedSearchQuery?.trim()) {
        params.append('q', debouncedSearchQuery.trim());
      }
      if (lookingFor.length > 0) {
        if (lookingFor.includes('expert')) {
          params.append('tipo_perfil', 'expert');
        }
        if (lookingFor.includes('coprodutor')) {
          if (params.has('tipo_perfil')) {
            params.set('tipo_perfil', params.get('tipo_perfil') + ',coprodutor');
          } else {
            params.append('tipo_perfil', 'coprodutor');
          }
        }
      }
      params.append('smart_ordering', 'true');

      const url = `/api/tinder-do-fluxo/feed/expert${params.toString() ? '?' + params.toString() : ''}`;
      const res = await api.get<{ users?: any[] }>(url);
      const users = res.users || [];

      // Formato = interesses (availability_tags): Projetos, Parcerias, Coprodução, Sociedade
      const interesseLabels: Record<string, string> = {
        projetos: 'Projetos',
        parcerias: 'Parcerias',
        coproducao: 'Coprodução',
        sociedade: 'Sociedade',
      };

      // Transform users to match ProfileDiscoveryCard format (conectado às colunas do Supabase)
      const transformed = users.map((u: any) => {
        const expertProfile = u.tinder_expert_profiles || u.tinder_mentor_profiles;
        const mentorProfile = u.tinder_mentor_profiles;

        const isExpert = expertProfile?.is_expert || false;
        const isCoprodutor = expertProfile?.is_coproducer || false;

        const tags = mentorProfile?.availability_tags || [];
        const formato = Array.isArray(tags) && tags.length > 0
          ? tags.map((t: string) => interesseLabels[t] || t).filter(Boolean).join(', ')
          : undefined;

        return {
          id: u.id,
          name: u.name,
          photo_url: mentorProfile?.photo_url,
          objective: mentorProfile?.goal_text || mentorProfile?.headline || expertProfile?.goal_text || '',
          bio: mentorProfile?.bio || '',
          niche: mentorProfile?.niche || undefined,
          formato: formato || undefined,
          isExpert: isExpert && !isCoprodutor,
          isCoprodutor: isCoprodutor && !isExpert,
          products: [],
          needs: isExpert && !isCoprodutor ? {
            precisa_trafego_pago: mentorProfile?.precisa_trafego_pago || false,
            precisa_copy: mentorProfile?.precisa_copy || false,
            precisa_automacoes: mentorProfile?.precisa_automacoes || false,
            precisa_estrategista: mentorProfile?.precisa_estrategista || false,
          } : undefined,
          capabilities: isCoprodutor && !isExpert ? {
            faz_perpetuo: mentorProfile?.faz_perpetuo || false,
            faz_pico_vendas: mentorProfile?.faz_pico_vendas || false,
            faz_trafego_pago: mentorProfile?.faz_trafego_pago || false,
            faz_copy: mentorProfile?.faz_copy || false,
            faz_automacoes: mentorProfile?.faz_automacoes || false,
          } : undefined,
          skills: [],
          skillsExtra: [],
          projects: [],
          rawData: u,
        };
      });

      setDiscoveryProfiles(transformed);
      setCurrentProfileIndex(0);
    } catch (err) {
      console.error('[TinderExpertPage] Erro ao carregar perfis:', err);
      setDiscoveryProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Load full profile data for current profile
  useEffect(() => {
    const currentProfile = discoveryProfiles[currentProfileIndex];
    if (!currentProfile || !currentProfile.rawData) return;
    
    const needsLoading = currentProfile.products.length === 0 && 
                         currentProfile.skills.length === 0 && 
                         currentProfile.projects.length === 0 &&
                         currentProfile.rawData;
    
    if (!needsLoading) return;
    
    api.get(`/api/tinder-do-fluxo/profile/me?userId=${currentProfile.id}`)
      .then((profileData: any) => {
        const profileObj = profileData.profile || {};
        setDiscoveryProfiles(prev => prev.map((p, idx) => {
          if (idx === currentProfileIndex) {
            return {
              ...p,
              objective: profileObj.goal_text || profileObj.headline || p.objective,
              bio: profileObj.bio_busca || profileObj.bio || p.bio,
              products: profileData.expertDetails?.products || [],
              skills: profileData.skills || [],
              skillsExtra: profileData.skillsExtra || [],
              projects: profileData.projects || [],
            };
          }
          return p;
        }));
      })
      .catch(err => {
        console.error('Erro ao carregar perfil completo:', err);
      });
  }, [currentProfileIndex, discoveryProfiles]);

  const handlePass = () => {
    if (currentProfileIndex < discoveryProfiles.length - 1) {
      setCurrentProfileIndex(currentProfileIndex + 1);
    } else {
      loadDiscoveryProfiles();
    }
  };

  const handleMatch = async () => {
    const currentProfile = discoveryProfiles[currentProfileIndex];
    if (!currentProfile || isSendingInterest) return;

    setIsSendingInterest(true);
    try {
      const res = await api.post<{ ok: boolean; matched: boolean; matchId?: number }>(
        '/api/tinder-do-fluxo/interest',
        { toUserId: currentProfile.id, type: 'EXPERT' }
      );
      
      // Sempre mostrar modal quando dá match
      setMatchedUser({
        id: currentProfile.id,
        name: currentProfile.name,
        photo_url: currentProfile.photo_url,
        isMutual: res?.matched || false,
      });
    setShowMatchModal(true);
      
      // Se não for match mútuo, passar automaticamente após 1.5s
      if (!res?.matched) {
        setTimeout(() => {
          setShowMatchModal(false);
          handlePass();
        }, 1500);
      }
    } catch (err) {
      console.error('Erro ao enviar interesse:', err);
    } finally {
      setIsSendingInterest(false);
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      handlePass();
    } else {
      handleMatch();
    }
  };

  const handleViewWhatsApp = () => {
    if (matchedUser) {
      // Buscar WhatsApp do match
      api.get<{ matches: any[] }>('/api/tinder-do-fluxo/matches')
        .then((r) => {
          const match = r.matches.find(m => m.otherUser?.id === matchedUser.id);
          if (match?.otherUser?.whatsapp) {
            const digits = match.otherUser.whatsapp.replace(/\D/g, '');
            const withCountry = digits.length <= 11 && !digits.startsWith('55') ? '55' + digits : digits;
            window.open(`https://wa.me/${withCountry}`, '_blank');
          }
        });
    }
    setShowMatchModal(false);
  };

  const handleClearFilters = () => {
    setLookingFor([]);
    setSearchQuery('');
  };

  const hasActiveFilters = lookingFor.length > 0 || !!searchQuery.trim();

  const currentProfile = discoveryProfiles[currentProfileIndex];

  const toggleLookingFor = (value: 'expert' | 'coprodutor') => {
    if (lookingFor.includes(value)) {
      setLookingFor(lookingFor.filter((t) => t !== value));
    } else {
      setLookingFor([...lookingFor, value]);
    }
  };

  const handleToggleFavorite = async (userId: string) => {
    const isFav = favoritedIds.has(userId);
    try {
      if (isFav) {
        await api.delete('/api/tinder-do-fluxo/favorite', { targetUserId: userId, type: 'EXPERT' });
        setFavoritedIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      } else {
        await api.post('/api/tinder-do-fluxo/favorite', { targetUserId: userId, type: 'EXPERT' });
        setFavoritedIds((prev) => new Set(prev).add(userId));
      }
    } catch (err) {
      console.error('Erro ao atualizar favorito:', err);
    }
  };

  return (
    <TinderDoFluxoPageShell title="Expert & Coprodutor" subtitle="Descubra perfis e faça matches">
      <div id="tinder-expert-page-root" data-page="expert" style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', minHeight: 0, background: '#F8FAFC' }}>
      {/* Header: glass referência - h-20, backdrop-blur, px-8 */}
      <header
        data-page="expert-search"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          height: 80,
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, maxWidth: 672 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <label htmlFor="expert-search-input" style={{ position: 'absolute', left: -9999 }}>Busca</label>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 20, pointerEvents: 'none' }} aria-hidden>search</span>
            <input
              id="expert-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por objetivo, nome..."
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                fontSize: 14,
                border: 'none',
                borderRadius: 12,
                background: '#f1f5f9',
                color: '#0f172a',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(190, 242, 100, 0.5)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => toggleLookingFor('expert')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                borderRadius: 12,
                background: lookingFor.includes('expert') ? '#BEF264' : '#f1f5f9',
                color: lookingFor.includes('expert') ? '#0f172a' : '#0f172a',
                cursor: 'pointer',
              }}
            >
              Expert
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>keyboard_arrow_down</span>
            </button>
            <button
              type="button"
              onClick={() => toggleLookingFor('coprodutor')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                borderRadius: 12,
                background: lookingFor.includes('coprodutor') ? '#8b5cf6' : '#f1f5f9',
                color: lookingFor.includes('coprodutor') ? '#fff' : '#0f172a',
                cursor: 'pointer',
              }}
            >
              Coprodutor
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>keyboard_arrow_down</span>
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link
            to="/tinder-do-fluxo/matches"
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: '#f1f5f9',
              color: '#475569',
              textDecoration: 'none',
              position: 'relative',
            }}
            title="Notificações / Matches"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>notifications</span>
            <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '2px solid white' }} />
          </Link>
          <Link
            to="/tinder-do-fluxo/matches"
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: '#f1f5f9',
              color: '#475569',
              textDecoration: 'none',
            }}
            title="Filtros"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>tune</span>
          </Link>
      </div>
      </header>

      {/* Área central: card tamanho fixo 800px, overflow visible para botões; scroll horizontal em telas estreitas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: 32, overflowX: 'auto', overflowY: 'visible', position: 'relative', background: '#F8FAFC', minHeight: 0 }}>
        {loading ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <div className="loading-spinner" />
          <p style={{ color: 'var(--text-secondary)', marginTop: 16 }}>Carregando perfis...</p>
          </div>
      ) : discoveryProfiles.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
              {hasActiveFilters
                ? 'Nenhum perfil encontrado com a busca ou tipo selecionado.'
                : 'Nenhum perfil disponível no momento. O feed mostra outros usuários Expert ou Coprodutor; verifique se há outros perfis no sistema.'}
            </p>
            {hasActiveFilters && (
            <button className="btn btn-outline" onClick={handleClearFilters}>
                Limpar busca e filtros
            </button>
        )}
      </div>
      ) : !currentProfile ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Nenhum perfil disponível no momento</p>
            </div>
      ) : (
          <>
            {/* Container tamanho fixo (800x678) - card não redimensiona com a tela */}
            <div style={{ position: 'relative', width: 800, minWidth: 800, flexShrink: 0, height: 678, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
              {/* Back cards (stack) - posição fixa atrás do card */}
              <div
                style={{
                  position: 'absolute',
                  width: 760,
                  height: 550,
                  top: 0,
                  left: '50%',
                  marginLeft: -380,
                  background: '#fff',
                  borderRadius: 16,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                  border: '1px solid #e2e8f0',
                  transform: 'scale(0.9) translateY(-40px)',
                  zIndex: 5,
                  opacity: 0.3,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: 784,
                  height: 550,
                  top: 0,
                  left: '50%',
                  marginLeft: -392,
                  background: '#fff',
                  borderRadius: 16,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                  border: '1px solid #e2e8f0',
                  transform: 'scale(0.95) translateY(-20px)',
                  zIndex: 10,
                  opacity: 0.6,
                }}
              />
        <div style={{ position: 'relative', zIndex: 20 }}>
          <SwipeActions onSwipeLeft={handlePass} onSwipeRight={handleMatch} disabled={isSendingInterest}>
                <div style={{ width: 800, height: 550, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ProfileDiscoveryCard
            profile={currentProfile}
            onPass={handlePass}
            onMatch={handleMatch}
            onSwipe={handleSwipe}
                    isSendingInterest={isSendingInterest}
                    isFavorited={favoritedIds.has(String(currentProfile.id))}
                    onFavorite={() => handleToggleFavorite(String(currentProfile.id))}
          />
                </div>
          </SwipeActions>
        </div>
              <ProfileDiscoveryCardActions
                profile={currentProfile}
                onPass={handlePass}
                onMatch={handleMatch}
                onFavorite={() => handleToggleFavorite(String(currentProfile.id))}
                isSendingInterest={isSendingInterest}
                isFavorited={favoritedIds.has(String(currentProfile.id))}
              />
            </div>
            <button
              type="button"
              onClick={() => navigate(`/tinder-do-fluxo/profile-view?userId=${currentProfile.id}`)}
              style={{
                position: 'absolute',
                bottom: 32,
                right: 32,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                borderRadius: 9999,
                border: '1px solid #e2e8f0',
                background: '#fff',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                color: '#0f172a',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                zIndex: 40,
              }}
            >
              Ver Perfil Completo
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </button>
          </>
        )}
      </div>

      {/* Match Modal */}
      <MatchModal
        isOpen={showMatchModal}
        matchedUser={matchedUser}
        currentUser={currentUser ? {
          name: currentUser.name,
          photo_url: undefined,
        } : null}
        isMutualMatch={matchedUser?.isMutual || false}
        onClose={() => setShowMatchModal(false)}
        onViewWhatsApp={matchedUser?.isMutual ? handleViewWhatsApp : undefined}
        onContinue={() => {
          setShowMatchModal(false);
          if (!matchedUser?.isMutual) {
            handlePass();
          }
        }}
      />
      </div>
    </TinderDoFluxoPageShell>
  );
}

function ExpertProfileDrawer({ userId, onClose }: { userId: number | string; onClose: () => void }) {
  const [data, setData] = useState<{
    user: { name?: string };
    mentorProfile?: { city?: string; niche?: string; instagram?: string; bio?: string };
    expertProfile?: { goal_text?: string; search_bio?: string; is_expert?: boolean; is_coproducer?: boolean };
    canSeeWhatsapp?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/tinder-do-fluxo/users/${userId}`)
      .then((r: any) => setData(r))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="tinder-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="tinder-drawer card" onClick={(e) => e.stopPropagation()}>
        <div className="tinder-drawer-header">
          <h3>Perfil</h3>
          <button type="button" className="tinder-drawer-close" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        {loading ? (
          <div className="tinder-drawer-body">
            <div className="skeleton-line" style={{ width: '50%', height: 20 }} />
            <div className="skeleton-line" style={{ width: '80%', height: 14, marginTop: 12 }} />
          </div>
        ) : data?.user ? (
          <div className="tinder-drawer-body">
            <p style={{ fontWeight: 700, fontSize: 18 }}>{data.user.name}</p>
            {data.expertProfile && (
              <>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                  {data.expertProfile.is_expert && 'Expert'}
                  {data.expertProfile.is_expert && data.expertProfile.is_coproducer && ' / '}
                  {data.expertProfile.is_coproducer && 'Coprodutor'}
                </p>
                <p style={{ marginTop: 12 }}>{data.expertProfile.goal_text || '—'}</p>
                <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>{data.expertProfile.search_bio || '—'}</p>
              </>
            )}
            {data.mentorProfile && (
              <p style={{ marginTop: 8, fontSize: 13 }}>{data.mentorProfile.city || ''} • {data.mentorProfile.niche || ''}</p>
            )}
            <Link to={`/tinder-do-fluxo/u/${userId}`} className="btn btn-outline" style={{ marginTop: 16 }} onClick={onClose}>
              Abrir perfil completo
            </Link>
          </div>
        ) : (
          <div className="tinder-drawer-body"><EmptyState text="Perfil não encontrado." /></div>
        )}
      </div>
    </div>
  );
}

const PRESTADORES_PAGE_SIZE = 9;
const SPECIALTY_TABS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'COPY', label: 'Copy' },
  { value: 'TRAFEGO', label: 'Tráfego' },
  { value: 'AUTOMACAO', label: 'Automação' },
] as const;

function prestadoresAvatarUrl(s: { photo_url?: string | null; users?: { name?: string } | null }): string {
  if (s.photo_url && s.photo_url.trim()) return s.photo_url;
  const name = s.users?.name || 'Prestador';
  const encoded = encodeURIComponent(name.replace(/\s+/g, ' ').trim() || 'P');
  return `https://ui-avatars.com/api/?name=${encoded}&size=160&background=94a3b8&color=fff`;
}

function prestadoresCityDisplay(s: { city?: string | null; state?: string | null }): string {
  const city = (s.city || '').trim();
  const state = (s.state || '').trim();
  if (!city && !state) return 'Localização não informada';
  if (city && state) return `${city}, ${state}`;
  return city || state;
}

export function TinderPrestadoresPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'COPY' | 'TRAFEGO' | 'AUTOMACAO'>('ALL');
  const [ratingMin, setRatingMin] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchText = useDebounce(searchText, 400);

  useEffect(() => {
    loadServices();
  }, [debouncedSearchText, activeTab, ratingMin]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearchText) params.append('q', debouncedSearchText);
      if (activeTab !== 'ALL') params.append('tipo_servico', activeTab);
      if (ratingMin != null) params.append('rating_min', String(ratingMin));
      
      const res = await api.get<{ services: any[] }>(`/api/tinder-do-fluxo/services?${params.toString()}`);
      setServices(res.services || []);
      setCurrentPage(1);
    } catch (err) {
      console.error('Erro ao carregar prestadores:', err);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(services.length / PRESTADORES_PAGE_SIZE));
  const start = (currentPage - 1) * PRESTADORES_PAGE_SIZE;
  const pageServices = services.slice(start, start + PRESTADORES_PAGE_SIZE);

  return (
    <TinderDoFluxoPageShell title="Prestadores">
      <div className="prestadores-directory">
        {/* Search + Filters */}
        <div className="prestadores-search-filter-card">
          <div className="prestadores-search-wrap">
            <label>
              <span className="material-symbols-outlined search-icon">search</span>
                <input
                type="search"
                placeholder="Buscar por nome, habilidade ou palavra-chave..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              </label>
          </div>
          <div className="prestadores-filter-buttons">
            <button type="button" className="prestadores-filter-btn" title="Especialidade filtrada pelas abas abaixo">
              <span>Especialidade</span>
              <span className="material-symbols-outlined">expand_more</span>
            </button>
            <button type="button" className="prestadores-filter-btn" title="Em breve">
              <span>Certificação</span>
              <span className="material-symbols-outlined">expand_more</span>
            </button>
            <button type="button" className="prestadores-filter-btn" title="Em breve">
              <span>Cidade</span>
              <span className="material-symbols-outlined">expand_more</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Avaliação mínima:</span>
              {([null, 1, 2, 3, 4, 5] as const).map((r) => (
              <button
                  key={r ?? 0}
                type="button"
                  onClick={() => setRatingMin(r === ratingMin ? null : r)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius)',
                    border: `1px solid ${ratingMin === r ? 'var(--accent-dark)' : 'var(--border)'}`,
                    background: ratingMin === r ? 'color-mix(in srgb, var(--accent) 18%, transparent)' : 'var(--bg-white)',
                    color: ratingMin === r ? 'var(--accent-dark)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: 14,
                    fontWeight: 600,
                }}
              >
                  {r == null ? 'Qualquer' : `${r}+`}
              </button>
            ))}
          </div>
        </div>
          <div className="prestadores-tabs">
            {SPECIALTY_TABS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`prestadores-tab ${activeTab === value ? 'active' : ''}`}
                onClick={() => setActiveTab(value)}
              >
                {label}
              </button>
            ))}
          </div>
      </div>

        {/* Results Grid */}
        {loading ? (
          <div className="prestadores-loading">
            <p>Carregando prestadores...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="prestadores-empty">
            <p>{debouncedSearchText ? 'Nenhum prestador encontrado para sua busca.' : 'Nenhum prestador encontrado.'}</p>
          </div>
        ) : (
          <>
            <div className="prestadores-grid">
              {pageServices.map((s) => (
                <article key={s.id} className="prestadores-card">
                  <div className={`prestadores-card-banner ${(s.specialty || '').toUpperCase() === 'AUTOMACAO' ? 'dark' : ''}`}>
                    <img
                      className="prestadores-card-avatar"
                      src={prestadoresAvatarUrl(s)}
                      alt=""
                    />
                </div>
                  <div className="prestadores-card-body">
                    <div>
                      <div className="prestadores-card-header">
                        <h3 className="prestadores-card-name">{s.users?.name || 'Prestador'}</h3>
                        <div className="prestadores-card-rating">
                          <span className="material-symbols-outlined">star</span>
                          {Number(s.rating_avg ?? 0).toFixed(1)}
              </div>
                      </div>
                      <p className="prestadores-card-city">{prestadoresCityDisplay(s)}</p>
                    </div>
                    <div className="prestadores-card-tags">
                      {s.specialty && (
                        <span className="prestadores-card-tag primary">
                          {s.specialty === 'TRAFEGO' ? 'Tráfego' : s.specialty === 'AUTOMACAO' ? 'Automação' : s.specialty === 'COPY' ? 'Copy' : s.specialty}
                        </span>
                      )}
                      {s.certification && (
                        <span className="prestadores-card-tag secondary">{s.certification}</span>
                      )}
                    </div>
                    <p className="prestadores-card-bio">
                      {(s.bio || s.experience || 'Sem descrição cadastrada.').replace(/\s+/g, ' ').trim().slice(0, 160)}
                      {((s.bio || s.experience) && (s.bio || s.experience).length > 160) ? '…' : ''}
                    </p>
                    <Link className="prestadores-card-cta" to={`/tinder-do-fluxo/prestadores/${s.id}`}>
                      Ver Perfil Completo
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="prestadores-pagination">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={currentPage === p ? 'active' : ''}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Próxima página"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
          </div>
        )}
          </>
        )}

        {/* Footer */}
        <footer className="prestadores-footer">
          <div className="prestadores-footer-inner">
            <div className="prestadores-footer-logo">
              <div className="prestadores-footer-logo-icon">
                <span className="material-symbols-outlined">local_fire_department</span>
              </div>
              <span>Tinder do Fluxo</span>
            </div>
            <div className="prestadores-footer-links">
              <a href="#">Sobre</a>
              <a href="#">Termos de Uso</a>
              <a href="#">Privacidade</a>
              <a href="#">Suporte</a>
            </div>
            <div className="prestadores-footer-copy">
              © {new Date().getFullYear()} Tinder do Fluxo. Todos os direitos reservados.
            </div>
          </div>
        </footer>
      </div>
    </TinderDoFluxoPageShell>
  );
}

// Mapeia specialty (tinder_jobs.specialty) para ícone Material Symbols
function getJobCardIcon(specialty: string | undefined): string {
  if (!specialty) return 'work';
  const s = (specialty || '').toUpperCase();
  if (s.includes('DESIGN') || s.includes('UI') || s.includes('UX')) return 'palette';
  if (s.includes('CODE') || s.includes('FRONT') || s.includes('REACT') || s.includes('DEV')) return 'code';
  if (s.includes('SOCIAL') || s.includes('CAMPAIGN') || s.includes('MÍDIA')) return 'campaign';
  if (s.includes('MOTION') || s.includes('VIDEO') || s.includes('EDIT')) return 'movie_edit';
  if (s.includes('RESEARCH') || s.includes('PESQUISA')) return 'search_insights';
  if (s.includes('COPY') || s.includes('TRAFEGO') || s.includes('TRAFEGO')) return 'campaign';
  return 'work';
}

// Formata prazo para o card: "Prazo: X dias" ou "Encerrada há X dias" (Supabase: tinder_jobs.deadline, status)
function formatPrazo(job: { status?: string; deadline?: string | null }): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineStr = job.deadline ? String(job.deadline).split('T')[0] : null;
  const isClosed = job.status === 'CLOSED' || (deadlineStr && new Date(deadlineStr) < today);

  if (!deadlineStr) return isClosed ? 'Encerrada' : 'Sem prazo';
  const deadline = new Date(deadlineStr);
  deadline.setHours(0, 0, 0, 0);
  const diffMs = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (isClosed) {
    const pastMs = today.getTime() - deadline.getTime();
    const pastDays = Math.floor(pastMs / (1000 * 60 * 60 * 24));
    if (pastDays <= 0) return 'Encerrada hoje';
    return pastDays === 1 ? 'Encerrada há 1 dia' : `Encerrada há ${pastDays} dias`;
  }
  if (diffDays <= 0) return 'Prazo: hoje';
  return diffDays === 1 ? 'Prazo: 1 dia' : `Prazo: ${diffDays} dias`;
}

// Verifica se vaga está aberta (status OPEN e deadline não vencido)
function isJobOpen(job: { status?: string; deadline?: string | null }): boolean {
  if (job.status !== 'OPEN') return false;
  if (!job.deadline) return true;
  const d = String(job.deadline).split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  return d >= today;
}

const TIPO_VAGA_OPTIONS = ['Projeto', 'Fixo', 'Parceria'];
const MODELO_TRABALHO_OPTIONS = ['Remoto', 'Presencial', 'Híbrido'];

export function TinderVagasPage() {
  const user = api.getUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'todas';
  const statusTab: 'todas' | 'minhas' | 'abertas' | 'encerradas' =
    (tabParam === 'todas' || tabParam === 'minhas' || tabParam === 'abertas' || tabParam === 'encerradas')
      ? tabParam
      : 'todas';
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [filters, setFilters] = useState({
    tipo_vaga: '',
    pretensao_min: '',
    pretensao_max: '',
    modelo_trabalho: ''
  });
  const [jobs, setJobs] = useState<any[]>([]);
  const [totalVagas, setTotalVagas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 12;

  const statusFilterApi = statusTab === 'minhas' ? 'all' : statusTab === 'abertas' ? 'open' : 'closed';
  const apiTab = statusTab === 'todas' ? 'abertas' : statusTab === 'minhas' ? 'minhas' : statusTab === 'abertas' ? 'minhas' : 'minhas';
  const apiStatusFilter = statusTab === 'todas' ? 'open' : statusFilterApi;
  const hasActiveFilters = !!(
    debouncedSearch ||
    filters.tipo_vaga ||
    filters.pretensao_min ||
    filters.pretensao_max ||
    filters.modelo_trabalho
  );

  // Sincronizar URL com aba padrão "Todas" ao abrir a página (sem ?tab=)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (!tab) {
      setSearchParams((p) => {
        const next = new URLSearchParams(p);
        next.set('tab', 'todas');
        return next;
      }, { replace: true });
    }
  }, []);

  useEffect(() => {
    if ((location.state as { fromApply?: boolean })?.fromApply) {
      loadJobs();
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [location.state]);

  useEffect(() => {
      loadJobs();
  }, [statusTab, page, debouncedSearch, filters.tipo_vaga, filters.pretensao_min, filters.pretensao_max, filters.modelo_trabalho]);

  const loadJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('tab', apiTab);
      if (apiTab === 'minhas') params.set('status_filter', apiStatusFilter);
      params.set('page', page.toString());
      params.set('per_page', perPage.toString());
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (filters.tipo_vaga) params.set('tipo_vaga', filters.tipo_vaga.toLowerCase());
      if (filters.pretensao_min) params.set('pretensao_min', filters.pretensao_min);
      if (filters.pretensao_max) params.set('pretensao_max', filters.pretensao_max);
      if (filters.modelo_trabalho) params.set('modelo_trabalho', filters.modelo_trabalho.toLowerCase());
      const res = await api.get<{ jobs: any[]; total_vagas: number }>(`/api/tinder-do-fluxo/jobs?${params.toString()}`);
      setJobs(res.jobs || []);
      setTotalVagas(res.total_vagas ?? 0);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar vagas.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({ tipo_vaga: '', pretensao_min: '', pretensao_max: '', modelo_trabalho: '' });
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalVagas / perPage));

  const canCreate = user?.role === 'MENTORADO' || user?.role === 'PRESTADOR' || user?.role === 'LIDERANCA';

  return (
    <TinderDoFluxoPageShell
      title="Minhas Vagas"
      subtitle="Gerencie suas oportunidades e encontre talentos de elite."
      headerRight={
        <div className="vagas-tabs">
          {(['todas', 'minhas', 'abertas', 'encerradas'] as const).map((t) => (
          <button
            key={t}
            type="button"
              className={statusTab === t ? 'active' : ''}
            onClick={() => {
              setSearchParams((p) => {
                const next = new URLSearchParams(p);
                next.set('tab', t);
                return next;
              });
              setPage(1);
            }}
            >
              {t === 'todas' ? 'Todas' : t === 'minhas' ? 'Minhas vagas' : t === 'abertas' ? 'Abertas' : 'Encerradas'}
          </button>
        ))}
      </div>
      }
    >
      <div className="vagas-page">
        <div style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
            <GlobalSearch
              placeholder="Buscar por título, descrição ou localização..."
              onSearch={setSearchQuery}
              initialValue={searchQuery}
            />
        </div>
          <Link className="btn btn-outline" to="/tinder-do-fluxo/vagas/minhas-candidaturas">
            Minhas Candidaturas
          </Link>
          {canCreate && (
            <Link className="btn btn-primary" to="/tinder-do-fluxo/vagas/criar">
              Criar vaga
            </Link>
          )}
        </div>

        <div
          className="card"
          style={{
            marginBottom: 24,
            padding: 16,
            background: 'var(--bg-white)',
            border: '1px solid var(--border)',
            borderRadius: 16
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 140 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                Tipo da vaga
              </label>
              <select
                value={filters.tipo_vaga}
                onChange={(e) => { setFilters((f) => ({ ...f, tipo_vaga: e.target.value })); setPage(1); }}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}
              >
              <option value="">Todos</option>
                {TIPO_VAGA_OPTIONS.map((opt) => (
                <option key={opt} value={opt.toLowerCase()}>{opt}</option>
              ))}
            </select>
          </div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 120 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                Valor mín. (R$)
              </label>
            <input
              type="number"
              placeholder="0"
              value={filters.pretensao_min}
                onChange={(e) => { setFilters((f) => ({ ...f, pretensao_min: e.target.value })); setPage(1); }}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}
            />
          </div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 120 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                Valor máx. (R$)
              </label>
            <input
              type="number"
                placeholder="—"
              value={filters.pretensao_max}
                onChange={(e) => { setFilters((f) => ({ ...f, pretensao_max: e.target.value })); setPage(1); }}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}
            />
          </div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 140 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                Modelo de trabalho
              </label>
              <select
                value={filters.modelo_trabalho}
                onChange={(e) => { setFilters((f) => ({ ...f, modelo_trabalho: e.target.value })); setPage(1); }}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}
              >
              <option value="">Todos</option>
                {MODELO_TRABALHO_OPTIONS.map((opt) => (
                <option key={opt} value={opt.toLowerCase()}>{opt}</option>
              ))}
            </select>
          </div>
            {hasActiveFilters && (
              <button type="button" className="btn btn-outline" onClick={clearFilters} style={{ padding: '8px 16px', fontSize: 13 }}>
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {!loading && (
          <p style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-secondary)' }}>
            {totalVagas === 0 ? 'Nenhuma vaga' : totalVagas === 1 ? '1 vaga' : `${totalVagas} vagas`}
            {hasActiveFilters && ' (com filtros aplicados)'}
          </p>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            {error}
            </div>
        )}

        {loading ? (
          <div className="vagas-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="vagas-card" style={{ pointerEvents: 'none' }}>
                <div style={{ height: 48, background: 'var(--border-light)', borderRadius: 12, marginBottom: 16, width: 48 }} />
                <div style={{ height: 24, background: 'var(--border-light)', borderRadius: 8, marginBottom: 8 }} />
                <div style={{ height: 16, background: 'var(--border-light)', borderRadius: 8, marginBottom: 16 }} />
                <div style={{ height: 16, background: 'var(--border-light)', borderRadius: 8, width: '60%' }} />
          </div>
            ))}
          </div>
        ) : (
          <>
            {(jobs.length === 0 && !canCreate) ? (
              <div className="card" style={{ padding: 48, textAlign: 'center', borderRadius: 16 }}>
                <EmptyState
                  text={
                    statusTab === 'todas'
                      ? 'Nenhuma vaga aberta no momento.'
                      : 'Você ainda não publicou nenhuma vaga.'
                  }
                />
                <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>
                  {statusTab === 'todas'
                    ? 'As vagas abertas de todos os usuários aparecem na aba Todas.'
                    : 'Vagas criadas por você aparecerão aqui (Minhas, Abertas e Encerradas).'}
                </p>
                    </div>
            ) : jobs.length === 0 && hasActiveFilters ? (
              <div className="card" style={{ padding: 48, textAlign: 'center', borderRadius: 16 }}>
                <EmptyState text="Nenhuma vaga encontrada com os filtros selecionados." />
                <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>
                  Tente alterar os filtros ou clique em &quot;Limpar filtros&quot; para ver todas as vagas.
                </p>
                <button type="button" className="btn btn-primary" onClick={clearFilters} style={{ marginTop: 16 }}>
                  Limpar filtros
                </button>
                    </div>
            ) : (
              <div className="vagas-grid">
                {jobs.map((j) => {
                  const open = isJobOpen(j);
                  return (
                    <Link
                      key={j.id}
                      to={`/tinder-do-fluxo/vagas/${j.id}`}
                      className={`vagas-card ${open ? '' : 'vagas-card--closed'}`}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: open ? 'rgba(163,230,53,0.15)' : 'var(--border-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: open ? 'var(--accent-dark)' : 'var(--text-muted)'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                            {getJobCardIcon(j.specialty)}
                      </span>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            padding: '4px 12px',
                            borderRadius: 9999,
                            background: open ? 'var(--accent)' : 'var(--border-light)',
                            color: open ? 'var(--bg-sidebar)' : 'var(--text-secondary)'
                          }}
                        >
                          {open ? 'Aberta' : 'Encerrada'}
                        </span>
                      </div>
                      {user && (j as { creator_id?: string }).creator_id === user.id && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 12,
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--accent-dark)',
                            background: 'rgba(163,230,53,0.12)',
                            padding: '4px 10px',
                            borderRadius: 8
                          }}
                          title="Criada por você"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            person
                        </span>
                          Sua vaga
                        </div>
                      )}
                      <h3 className="vagas-card-title" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
                        {j.title || j.titulo}
                      </h3>
                      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
                        Especialidade: {j.specialty || 'Não informada'}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--text-muted)' }}>
                            {j.location && /remoto/i.test(String(j.location)) ? 'distance' : 'location_on'}
                          </span>
                          {j.location || j.localizacao || 'Não especificado'}
                    </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--text-muted)' }}>
                            calendar_today
                          </span>
                          {formatPrazo(j)}
                </div>
              </div>
                      <div
                        style={{
                          paddingTop: 20,
                          borderTop: '1px solid var(--border-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>
                            {open ? 'Valor' : 'Valor Final'}
                          </span>
                          <div className={open ? '' : 'vagas-card-value'} style={{ fontSize: 20, fontWeight: 800, color: open ? 'var(--accent)' : 'var(--text-muted)' }}>
                            {j.value != null && Number(j.value) > 0
                              ? `R$ ${Number(j.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                              : 'A combinar'}
          </div>
                        </div>
                        <div
                          className="vagas-card-arrow"
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: 'var(--border-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                            {open ? 'arrow_forward' : 'lock'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {canCreate && (
                  <Link to="/tinder-do-fluxo/vagas/criar" className="vagas-card vagas-card--create">
                    <div className="vagas-card-create-icon">
                      <span className="material-symbols-outlined" style={{ fontSize: 32, fontWeight: 700 }}>
                        add
                      </span>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
                      Publicar nova vaga
                    </h3>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 200 }}>
                      Encontre o especialista perfeito para seu próximo projeto.
                    </p>
                  </Link>
                )}
              </div>
            )}

            {totalPages > 1 && (
              <div className="vagas-pagination">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    chevron_left
                  </span>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} type="button" onClick={() => setPage(p)} className={page === p ? 'active' : ''}>
                      {p}
                    </button>
                  );
                })}
                {totalPages > 5 && <span style={{ padding: '0 8px', color: 'var(--text-muted)' }}>...</span>}
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    chevron_right
                </span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </TinderDoFluxoPageShell>
  );
}

export function TinderJobCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    specialty: '', 
    model: '', 
    location: '',
    value: '',
    workingConditions: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await api.post<{ job: { id: number } }>('/api/tinder-do-fluxo/jobs', {
        ...form,
        value: form.value ? Number(form.value) : null
      });
      // Navegar para Minhas vagas
      navigate('/tinder-do-fluxo/vagas?tab=minhas', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Erro ao criar vaga.');
      setIsSubmitting(false);
    }
  };
  
  return (
    <TinderDoFluxoPageShell title="Criar vaga">
      <form className="card" onSubmit={submit}>
        <div className="form-group">
          <label>Título</label>
          <input 
            value={form.title} 
            onChange={(e) => setForm({ ...form, title: e.target.value })} 
            required 
            style={{ width: '100%' }}
          />
        </div>
        
        <div className="form-group">
          <label>Descrição</label>
          <textarea 
            value={form.description} 
            onChange={(e) => setForm({ ...form, description: e.target.value })} 
            required 
            style={{ 
              width: '100%', 
              minHeight: '200px',
              resize: 'vertical'
            }}
            placeholder="Descreva detalhadamente a vaga, requisitos, responsabilidades..."
          />
        </div>
        
        <div className="form-group">
          <label>Especialidade</label>
          <input 
            value={form.specialty} 
            onChange={(e) => setForm({ ...form, specialty: e.target.value })} 
            placeholder="Ex: Tráfego Pago, Copy, Automações..."
          />
        </div>
        
        <div className="form-group">
          <label>Modelo de trabalho</label>
          <select 
            value={form.model} 
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            style={{ width: '100%' }}
          >
            <option value="">Selecione...</option>
            <option value="Online">Online</option>
            <option value="Presencial">Presencial</option>
            <option value="Híbrido">Híbrido</option>
            <option value="Indiferente">Indiferente</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Local</label>
          <input 
            value={form.location} 
            onChange={(e) => setForm({ ...form, location: e.target.value })} 
            placeholder="Ex: Remoto, São Paulo, Rio de Janeiro..."
          />
        </div>
        
        <div className="form-group">
          <label>Salarial (R$)</label>
          <input 
            type="number"
            value={form.value} 
            onChange={(e) => setForm({ ...form, value: e.target.value })} 
            placeholder="Ex: 5000"
            min="0"
            step="0.01"
          />
        </div>
        
        <div className="form-group">
          <label>Condições de trabalho</label>
          <select 
            value={form.workingConditions} 
            onChange={(e) => setForm({ ...form, workingConditions: e.target.value })}
            style={{ width: '100%' }}
          >
            <option value="">Selecione...</option>
            <option value="CLT">CLT</option>
            <option value="PJ">PJ</option>
            <option value="Freelancer">Freelancer</option>
            <option value="Indiferente">Indiferente</option>
          </select>
        </div>
        
        {error && <div className="alert alert-error visible">{error}</div>}
        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Criando vaga...' : 'Salvar vaga'}
        </button>
      </form>
    </TinderDoFluxoPageShell>
  );
}

export function TinderJobDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const user = api.getUser();
  const [job, setJob] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isCandidaturaSucesso, setIsCandidaturaSucesso] = useState(false);

  const isCreator = user?.id && job?.creator_id === user.id;

  useEffect(() => {
    if (!params.id) return;
    api.get<{ job: any }>(`/api/tinder-do-fluxo/jobs/${params.id}`).then((r) => setJob(r.job));
  }, [params.id]);

  useEffect(() => {
    if (!params.id || !isCreator) return;
    api.get<{ applicants: any[] }>(`/api/tinder-do-fluxo/jobs/${params.id}/applicants`)
      .then((r) => setApplicants(r.applicants || []))
      .catch(() => setApplicants([]));
  }, [params.id, isCreator]);

  const apply = async () => {
    if (!params.id) return;
    setIsApplying(true);
    setFeedback('');
    try {
      const res = await api.post<{ ok: boolean; message?: string }>(`/api/tinder-do-fluxo/jobs/${params.id}/apply`, { message });
      setFeedback(res.message || 'Candidatura concluída!');
      setIsCandidaturaSucesso(true);
      setMessage('');
      setTimeout(() => {
        navigate('/tinder-do-fluxo/vagas?tab=abertas', { replace: true, state: { fromApply: true } });
      }, 2000);
    } catch (err: any) {
      setFeedback(err.message || 'Erro ao candidatar-se.');
    } finally {
      setIsApplying(false);
    }
  };

  const closeJob = async () => {
    if (!params.id) return;
    setIsClosing(true);
    try {
      await api.patch(`/api/tinder-do-fluxo/jobs/${params.id}/close`);
      setJob((prev: any) => prev ? { ...prev, status: 'CLOSED' } : null);
    } catch (err: any) {
      setFeedback(err.message || 'Erro ao encerrar vaga.');
    } finally {
      setIsClosing(false);
    }
  };

  const formatWhatsAppLink = (w: string) => {
    const digits = (w || '').replace(/\D/g, '');
    if (!digits.length) return '';
    const withCountry = digits.length <= 11 && !digits.startsWith('55') ? '55' + digits : digits;
    return `https://wa.me/${withCountry}`;
  };

  const isClosed = !job || job.status === 'CLOSED' || (() => {
    if (!job?.deadline) return false;
    const today = new Date().toISOString().split('T')[0];
    const deadlineStr = String(job.deadline).split('T')[0];
    return deadlineStr < today;
  })();
  const alreadyApplied = !!job?.applied;
  const canApply = !isCreator && !isClosed && !alreadyApplied && job?.status === 'OPEN';

  return (
    <TinderDoFluxoPageShell title="Detalhe da vaga">
      {!job ? <div className="card"><EmptyState text="Carregando vaga..." /></div> : (
        <div 
          className="card" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flex: 1,
            minHeight: 'calc(100vh - 200px)',
            padding: 20
          }}
        >
          <Link to="/tinder-do-fluxo/vagas?tab=abertas" className="btn btn-outline" style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
            ← Voltar para vagas em aberto
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>{job.title}</h3>
            {isCreator && job.status === 'OPEN' && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={closeJob}
                disabled={isClosing}
                style={{ color: 'var(--red)' }}
              >
                {isClosing ? 'Encerrando...' : 'Encerrar vaga'}
              </button>
            )}
          </div>
          {!isCreator && isClosed && (
            <button type="button" disabled style={{ marginTop: 16, alignSelf: 'flex-start', opacity: 0.7, cursor: 'not-allowed' }} className="btn btn-outline">
              Vaga encerrada
            </button>
          )}
          {!isCreator && !isClosed && alreadyApplied && (
            <button
              type="button"
              disabled
              style={{ marginTop: 16, alignSelf: 'flex-start', opacity: 0.7, cursor: 'not-allowed' }}
              className="btn btn-outline"
              title="Você já se candidatou a esta vaga"
            >
              ✓ Já se candidatou
            </button>
          )}
          <p style={{ marginTop: 8 }}>{job.description}</p>
          
          {/* Informações da vaga */}
          <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
            {job.specialty && <p style={{ margin: '4px 0' }}><strong>Especialidade:</strong> {job.specialty}</p>}
            {job.model && <p style={{ margin: '4px 0' }}><strong>Modelo de trabalho:</strong> {job.model}</p>}
            {job.location && <p style={{ margin: '4px 0' }}><strong>Local:</strong> {job.location}</p>}
            {job.value && <p style={{ margin: '4px 0' }}><strong>Valor:</strong> R$ {Number(job.value).toLocaleString('pt-BR')}</p>}
            {job.deadline && <p style={{ margin: '4px 0' }}><strong>Prazo:</strong> {job.deadline}</p>}
          </div>

          {/* Candidatos (apenas para o criador) */}
          {isCreator && (
            <div style={{ marginTop: 24 }}>
              <h4 style={{ margin: '0 0 12px 0' }}>Candidatos ({applicants.length})</h4>
              {applicants.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhum candidato ainda.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {applicants.map((a: any) => (
                    <div key={a.candidate_id} style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>{a.name}</div>
                          {a.message && <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>{a.message}</p>}
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <Link
                            to={`/tinder-do-fluxo/profile-view?userId=${a.candidate_id}&returnTo=${encodeURIComponent(`/tinder-do-fluxo/vagas/${params.id}`)}`}
                            className="btn btn-outline"
                            style={{ fontSize: 13 }}
                          >
                            Ver perfil
                          </Link>
                          {a.whatsapp ? (
                            <a
                              href={formatWhatsAppLink(a.whatsapp)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary"
                              style={{ fontSize: 13 }}
                            >
                              WhatsApp
                            </a>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sem WhatsApp</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Formulário de candidatura - APENAS quando NÃO sou o criador E vaga está aberta */}
          {!isCreator && canApply && (
            <>
              <div 
                className="form-group" 
                style={{ 
                  marginTop: 24, 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  minHeight: 200
                }}
              >
                <label>Mensagem de candidatura</label>
                <textarea 
                  style={{ 
                    width: '100%', 
                    flex: 1,
                    minHeight: 200,
                    resize: 'vertical',
                    marginTop: 8
                  }}
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escreva uma mensagem explicando por que você é o candidato ideal para esta vaga..."
                />
              </div>
              
              <button 
                className="btn btn-primary" 
                type="button" 
                onClick={apply}
                disabled={isApplying}
                style={{ marginTop: 16, alignSelf: 'flex-start' }}
              >
                {isApplying ? 'Candidatando...' : 'Me candidatar'}
              </button>
            </>
          )}

          
          {feedback && (
            <div style={{ 
              marginTop: 16, 
              padding: 12, 
              background: isCandidaturaSucesso ? 'var(--green)' : 'var(--red)',
              color: 'white',
              borderRadius: 'var(--radius)'
            }}>
              {feedback}
              {isCandidaturaSucesso && ' Redirecionando para a lista de vagas...'}
            </div>
          )}
        </div>
      )}
    </TinderDoFluxoPageShell>
  );
}

function whatsappLink(whatsapp: string): string {
  const digits = (whatsapp || '').replace(/\D/g, '');
  if (!digits.length) return '';
  const withCountry = digits.length <= 11 && !digits.startsWith('55') ? '55' + digits : digits;
  return `https://wa.me/${withCountry}`;
}

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - msgDay.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

const MATCHES_QUERY_KEY = ['tinder-do-fluxo', 'matches'] as const;

function MatchesListSkeleton() {
  return (
    <>
      <div className="matches-chat-section-title">Novos Matches</div>
      <div className="matches-chat-new-matches" style={{ gap: 16 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="matches-chat-new-match-item" style={{ cursor: 'default' }}>
            <div className="skeleton-line" style={{ width: 64, height: 64, borderRadius: '50%', flexShrink: 0 }} />
            <div className="skeleton-line" style={{ width: 40, height: 12, borderRadius: 4 }} />
          </div>
        ))}
      </div>
      <div className="matches-chat-section-title">Mensagens Recentes</div>
      <div className="matches-chat-messages-list">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="matches-chat-message-row" style={{ cursor: 'default' }}>
            <div className="skeleton-line" style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }} />
            <div className="meta" style={{ flex: 1, minWidth: 0 }}>
              <div className="name-row">
                <div className="skeleton-line" style={{ width: 120, height: 14, borderRadius: 4 }} />
                <div className="skeleton-line" style={{ width: 36, height: 10, borderRadius: 4 }} />
              </div>
              <div className="skeleton-line" style={{ width: '80%', height: 12, borderRadius: 4, marginTop: 6 }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

const POLL_MESSAGES_MS = 4000;
const POLL_TYPING_MS = 1500;
const TYPING_DEBOUNCE_START_MS = 400;
const TYPING_DEBOUNCE_STOP_MS = 2000;

export function TinderMatchesPage() {
  const queryClient = useQueryClient();
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const navigate = useNavigate();
  const currentUser = api.getUser() as { id: string; name: string; photo_url?: string } | null;
  const typingStartRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: matches = [], isLoading: loading } = useQuery({
    queryKey: MATCHES_QUERY_KEY,
    queryFn: async () => {
      const res = await api.get<{ matches: any[] }>('/api/tinder-do-fluxo/matches');
      return res.matches || [];
    },
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (matches.length > 0 && selectedMatchId === null) {
      setSelectedMatchId(matches[0].id);
    }
  }, [matches, selectedMatchId]);

  const fetchMessages = useCallback((matchId: number) => {
    return api.get<{ messages: any[] }>(`/api/tinder-do-fluxo/matches/${matchId}/messages`).then((r) => r.messages || []);
  }, []);

  useEffect(() => {
    if (!selectedMatchId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setMessagesLoading(true);
    fetchMessages(selectedMatchId)
      .then((list) => { if (!cancelled) setMessages(list); })
      .catch(() => { if (!cancelled) setMessages([]); })
      .finally(() => { if (!cancelled) setMessagesLoading(false); });
    const interval = setInterval(() => {
      if (cancelled) return;
      fetchMessages(selectedMatchId)
        .then((list) => { if (!cancelled) setMessages(list); })
        .catch(() => {});
    }, POLL_MESSAGES_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedMatchId, fetchMessages]);

  useEffect(() => {
    if (!selectedMatchId) {
      setOtherTyping(false);
      return;
    }
    let cancelled = false;
    const poll = () => {
      if (cancelled) return;
      api.get<{ typing: boolean }>(`/api/tinder-do-fluxo/matches/${selectedMatchId}/typing`)
        .then((r) => { if (!cancelled) setOtherTyping(r.typing); })
        .catch(() => {});
    };
    poll();
    const interval = setInterval(poll, POLL_TYPING_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedMatchId]);

  const sendTyping = useCallback((matchId: number, typing: boolean) => {
    api.post(`/api/tinder-do-fluxo/matches/${matchId}/typing`, { typing }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedMatchId) return;
    if (typingStartRef.current) clearTimeout(typingStartRef.current);
    if (typingStopRef.current) clearTimeout(typingStopRef.current);
    if (!inputValue.trim()) {
      sendTyping(selectedMatchId, false);
      return;
    }
    typingStartRef.current = setTimeout(() => sendTyping(selectedMatchId, true), TYPING_DEBOUNCE_START_MS);
    typingStopRef.current = setTimeout(() => sendTyping(selectedMatchId, false), TYPING_DEBOUNCE_STOP_MS);
    return () => {
      if (typingStartRef.current) clearTimeout(typingStartRef.current);
      if (typingStopRef.current) clearTimeout(typingStopRef.current);
    };
  }, [selectedMatchId, inputValue, sendTyping]);

  const selectedMatch = selectedMatchId ? matches.find((m) => m.id === selectedMatchId) : null;
  const sortedByRecent = [...matches].sort((a, b) => {
    const at = a.lastMessageAt || a.created_at || '';
    const bt = b.lastMessageAt || b.created_at || '';
    return bt.localeCompare(at);
  });

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || !selectedMatchId || sending) return;
    sendTyping(selectedMatchId, false);
    setSending(true);
    setInputValue('');
    try {
      const r = await api.post<{ message: any }>(`/api/tinder-do-fluxo/matches/${selectedMatchId}/messages`, { body: text });
      setMessages((prev) => [...prev, r.message]);
      queryClient.setQueryData<any[]>(MATCHES_QUERY_KEY, (old) =>
        (old || []).map((m) =>
          m.id === selectedMatchId
            ? {
                ...m,
                lastMessage: text,
                lastMessageAt: r.message.created_at,
                lastMessageSenderId: currentUser?.id,
              }
            : m
        )
      );
    } catch (err) {
      console.error('[TinderMatchesPage] Erro ao enviar mensagem:', err);
      setInputValue(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <AppLayout breadcrumbs={[{ label: 'Tinder do Fluxo' }, { label: 'Matches' }]}>
      <div className="matches-chat-page">
        {/* Left panel */}
        <aside className="matches-chat-left">
          <div className="matches-chat-left-header">
            <h2>Faça amigos no <span className="accent">Fluxo!</span></h2>
            <p>Gerencie suas conexões e conversas</p>
                  </div>

      {loading ? (
            <MatchesListSkeleton />
          ) : (
            <>
              <div className="matches-chat-section-title">Novos Matches</div>
              <div className="matches-chat-new-matches">
                {matches.map((match) => {
                  const user = match.otherUser;
                  if (!user) return null;
                  const name = user.name || 'Usuário';
                  const isSelected = match.id === selectedMatchId;
                  return (
                    <div
                      key={match.id}
                      className="matches-chat-new-match-item"
                      onClick={() => setSelectedMatchId(match.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedMatchId(match.id)}
                    >
                      {user.photo_url ? (
                        <img src={user.photo_url} alt={name} className="matches-chat-new-match-avatar" />
                      ) : (
                        <div className="matches-chat-new-match-avatar-placeholder">{name.charAt(0).toUpperCase()}</div>
                      )}
                      <span className="matches-chat-new-match-name">{name.split(' ')[0]}</span>
                    </div>
                  );
                })}
              </div>

              <div className="matches-chat-section-title">Mensagens Recentes</div>
              <div className="matches-chat-messages-list">
                {sortedByRecent.map((match) => {
                  const user = match.otherUser;
                  if (!user) return null;
                  const name = user.name || 'Usuário';
                  const isActive = match.id === selectedMatchId;
                  const preview = match.lastMessage
                    ? match.lastMessage.length > 40
                      ? match.lastMessage.slice(0, 40) + '...'
                      : match.lastMessage
                    : 'Sem mensagens ainda';
                  const timeStr = match.lastMessageAt
                    ? formatMessageTime(match.lastMessageAt)
                    : match.created_at
                      ? formatMessageTime(match.created_at)
                      : '';
                  return (
                    <div
                      key={match.id}
                      className={`matches-chat-message-row${isActive ? ' active' : ''}`}
                      onClick={() => setSelectedMatchId(match.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedMatchId(match.id)}
                    >
                      <div className="avatar-wrap">
                        {user.photo_url ? (
                          <img src={user.photo_url} alt={name} />
                        ) : (
                          <div className="avatar-placeholder">{name.charAt(0).toUpperCase()}</div>
                        )}
                        <div className="online-dot" aria-hidden />
                      </div>
                      <div className="meta">
                        <div className="name-row">
                          <span className="name">{name}</span>
                          <span className="time">{timeStr}</span>
                        </div>
                        <p className="preview">{preview}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </aside>

        {/* Right panel - Chat */}
        <section className="matches-chat-right">
          {!selectedMatch ? (
            <div className="matches-chat-empty-right">
              {loading ? 'Carregando...' : matches.length === 0 ? 'Você ainda não fez nenhum match. Descubra perfis para começar!' : 'Selecione uma conversa'}
            </div>
          ) : (
            <>
              <header className="matches-chat-right-header">
                <div className="user-info">
                  {selectedMatch.otherUser?.photo_url ? (
                    <img src={selectedMatch.otherUser.photo_url} alt="" className="avatar" />
                  ) : (
                    <div className="avatar-placeholder">
                      {(selectedMatch.otherUser?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="name">{selectedMatch.otherUser?.name || 'Usuário'}</div>
                    <div className="status">{otherTyping ? 'digitando...' : 'Online agora'}</div>
                  </div>
                </div>
                <div className="actions">
                  <button
                    type="button"
                    className="matches-chat-btn-outline"
                    onClick={() => navigate(`/tinder-do-fluxo/profile-view?userId=${selectedMatch.otherUser?.id}`)}
                  >
                    Ver Perfil Completo
                  </button>
                  <button type="button" className="matches-chat-btn-icon" aria-label="Mais opções">
                    <span style={{ fontSize: 20 }}>⋮</span>
                  </button>
                </div>
              </header>

              <div className="matches-chat-messages-area">
                <div className="matches-chat-date-sep">
                  <span>Hoje</span>
                </div>
                {messagesLoading ? (
                  <div style={{ textAlign: 'center', padding: 24 }}>
          <div className="loading-spinner" />
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Carregando mensagens...</p>
                  </div>
      ) : (
                  <>
                    {messages.map((msg) => {
                      const isSent = msg.sender_id === currentUser?.id;
                      const senderName = isSent ? (currentUser?.name || 'Você') : (selectedMatch.otherUser?.name || 'Usuário');
                      const senderPhoto = isSent ? currentUser?.photo_url : selectedMatch.otherUser?.photo_url;
                      return (
                        <div key={msg.id} className={`matches-chat-msg-bubble ${isSent ? 'sent' : ''}`}>
                          {senderPhoto ? (
                            <img src={senderPhoto} alt="" className="small-avatar" />
                          ) : (
                            <div className="small-avatar-placeholder">{senderName.charAt(0).toUpperCase()}</div>
                          )}
                          <div className={`bubble ${isSent ? 'sent' : 'received'}`}>
                            <p>{msg.body}</p>
                            <span className="time">{formatMessageTime(msg.created_at)}</span>
                          </div>
                        </div>
                      );
                    })}
                    {otherTyping && (
                      <div className="matches-chat-msg-bubble">
                        <div className="small-avatar-placeholder">{(selectedMatch.otherUser?.name || 'U').charAt(0).toUpperCase()}</div>
                        <div className="bubble received matches-chat-typing-bubble">
                          <span className="matches-chat-typing-dots">...</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="matches-chat-input-area">
                <div className="matches-chat-input-wrap">
                  <button type="button" className="matches-chat-btn-icon" aria-label="Anexar">
                    <span style={{ fontSize: 20 }}>+</span>
                  </button>
                  <input
                    type="text"
                    placeholder="Escreva sua mensagem..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    onBlur={() => selectedMatchId && sendTyping(selectedMatchId, false)}
                  />
                  <button
                    type="button"
                    className="matches-chat-send-btn"
                    onClick={handleSend}
                    disabled={sending || !inputValue.trim()}
                    aria-label="Enviar"
                  >
                    ➤
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

function getInitials(name: string | undefined, fallback: string): string {
  if (!name || !name.trim()) return fallback.slice(0, 2).toUpperCase();
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatFavoriteType(type: string): string {
  const t = (type || '').toUpperCase();
  if (t === 'COMUNIDADE') return 'Comunidade';
  if (t === 'EXPERT') return 'Expert';
  if (t === 'COPRODUTOR') return 'Coprodutor';
  return type || 'Favorito';
}

export function TinderFavoritosPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(() => {
    api.get<{ favorites: any[] }>('/api/tinder-do-fluxo/favorites').then((r) => {
      setFavorites(r.favorites || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get<{ favorites: any[] }>('/api/tinder-do-fluxo/favorites').then((r) => {
      const list = r.favorites || [];
      setFavorites(list);
      setLoading(false);
      if (list.length === 0) {
        api.post<{ ok: boolean }>('/api/tinder-do-fluxo/favorites/seed-current-user').then(() => fetchFavorites()).catch(() => {});
      }
    }).catch(() => setLoading(false));
  }, [fetchFavorites]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return favorites;
    return favorites.filter((f) => {
      const name = (f.users?.name || '').toLowerCase();
      const type = (f.type || '').toLowerCase();
      return name.includes(q) || type.includes(q);
    });
  }, [favorites, searchQuery]);

  return (
    <TinderDoFluxoPageShell title="Favoritos">
      <header className="favoritos-page-header" data-page="favoritos">
        <div className="favoritos-search-wrap">
          <span className="favoritos-search-icon" aria-hidden>🔍</span>
          <input
            type="search"
            placeholder="Buscar por objetivo, nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Buscar favoritos"
          />
          </div>
        <div className="favoritos-header-actions">
          <button type="button" className="favoritos-filter-dropdown" aria-haspopup="listbox" aria-label="Filtro">
            Favoritos <span style={{ fontSize: 14 }}>▼</span>
          </button>
          <Link to="/tinder-do-fluxo/matches" className="favoritos-header-btn" title="Matches">🔔</Link>
          <Link to="/tinder-do-fluxo/perfil" className="favoritos-header-btn" title="Meu perfil">👤</Link>
      </div>
      </header>

      {favorites.length === 0 ? (
        <div className="favoritos-empty">
          <p>Nenhum favorito salvo.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="favoritos-empty">
          <p>Nenhum favorito encontrado para &quot;{searchQuery}&quot;.</p>
        </div>
      ) : (
        <div className="favoritos-grid">
          {filtered.map((f) => {
            const name = f.users?.name || `Usuário ${f.target_user_id}`;
            const typeLabel = formatFavoriteType(f.type);
            const profileUrl = `/tinder-do-fluxo/u/${f.target_user_id}`;
            return (
              <article key={f.id} className="favoritos-card">
                <div className="favoritos-card-top">
                  <div className="favoritos-card-avatar">
                    <span>{getInitials(name, 'U')}</span>
                    <span className="favoritos-card-badge-pct">—</span>
                  </div>
                  <div className="favoritos-card-info">
                    <div className="favoritos-card-name-row">
                      <h3 className="favoritos-card-name">{name}</h3>
                      <span className="favoritos-card-expert-badge">{typeLabel.toUpperCase()}</span>
                    </div>
                    <p className="favoritos-card-role">{typeLabel}</p>
                    <p className="favoritos-card-quote">&quot;Perfil favoritado na comunidade.&quot;</p>
                  </div>
                </div>
                <div className="favoritos-card-actions">
                  <Link to={profileUrl} className="favoritos-card-btn-profile">Ver Perfil</Link>
                  <Link to={profileUrl} className="favoritos-card-btn-chat" title="Ver perfil / Contato">💬</Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </TinderDoFluxoPageShell>
  );
}

const FAVORITOS_2_MOCK: Array<{ id: string; nome: string; especialidade: string; tags: string[]; avatarUrl: string }> = [
  { id: '1', nome: 'Ana Silva', especialidade: 'Estrategista Digital', tags: ['VENDA TODO SANTO DIA', '+2 CURSOS'], avatarUrl: 'https://i.pravatar.cc/192?u=ana-silva-1' },
  { id: '2', nome: 'Marcos Oliveira', especialidade: 'Copywriter Senior', tags: ['COPYWRITING PRO', 'LANÇAMENTO METEÓRICO'], avatarUrl: 'https://i.pravatar.cc/192?u=marcos-oliveira-2' },
  { id: '3', nome: 'Juliana Costa', especialidade: 'Gestora de Tráfego', tags: ['GESTÃO DE TRÁFEGO'], avatarUrl: 'https://i.pravatar.cc/192?u=juliana-costa-3' },
  { id: '4', nome: 'Ricardo Santos', especialidade: 'Social Media', tags: ['CONTEÚDO INFINITO', 'CANVA PRO'], avatarUrl: 'https://i.pravatar.cc/192?u=ricardo-santos-4' },
  { id: '5', nome: 'Beatriz Lima', especialidade: 'Lançadora', tags: ['ESTRATÉGIA DE LANÇAMENTO'], avatarUrl: 'https://i.pravatar.cc/192?u=beatriz-lima-5' },
  { id: '6', nome: 'Felipe Mendes', especialidade: 'UX Designer', tags: ['DESIGN PARA CONVERSÃO', 'FIGMA MASTER'], avatarUrl: 'https://i.pravatar.cc/192?u=felipe-mendes-6' },
];

function getInitialsF2(name: string): string {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function TinderFavoritos2Page() {
  const [searchQuery, setSearchQuery] = useState('');
  const [heartedIds, setHeartedIds] = useState<Set<string>>(new Set(FAVORITOS_2_MOCK.map((f) => f.id)));

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return FAVORITOS_2_MOCK;
    return FAVORITOS_2_MOCK.filter(
      (f) =>
        f.nome.toLowerCase().includes(q) ||
        f.especialidade.toLowerCase().includes(q) ||
        f.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const toggleHeart = (id: string) => {
    setHeartedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <TinderDoFluxoPageShell
      title="Favoritos"
      subtitle="Alunos e parceiros que você salvou na sua rede"
    >
      <header className="favoritos-2-actions">
        <div className="favoritos-search-wrap">
          <span className="favoritos-search-icon" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Buscar nos favoritos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Buscar nos favoritos"
          />
        </div>
        <button type="button" className="favoritos-2-btn-filter">
          Filtrar
        </button>
      </header>

      <div className="favoritos-2-grid">
        {filtered.map((f) => (
          <article key={f.id} className="favoritos-2-card">
            <button
              type="button"
              className="favoritos-2-heart"
              onClick={() => toggleHeart(f.id)}
              aria-label={heartedIds.has(f.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: heartedIds.has(f.id) ? '"FILL" 1' : '"FILL" 0' }} aria-hidden>star</span>
            </button>
            <div className="favoritos-2-avatar-wrap">
              {f.avatarUrl ? (
                <img src={f.avatarUrl} alt="" className="favoritos-2-avatar-img" />
              ) : (
                <span className="favoritos-2-avatar-initials">{getInitialsF2(f.nome)}</span>
              )}
            </div>
            <h3 className="favoritos-2-name">{f.nome}</h3>
            <p className="favoritos-2-especialidade">{f.especialidade}</p>
            <div className="favoritos-2-chips">
              {f.tags.map((tag) => (
                <span key={tag} className="favoritos-2-chip">{tag}</span>
              ))}
            </div>
            <hr className="favoritos-2-divider" />
            <div className="favoritos-2-footer">
              <div className="favoritos-2-mini-avatars" aria-hidden>
                <span className="favoritos-2-mini-avatar" />
                <span className="favoritos-2-mini-avatar" />
                <span className="favoritos-2-mini-avatar" />
              </div>
              <button type="button" className="favoritos-2-btn-ver-perfil">
                Ver Perfil
              </button>
            </div>
          </article>
        ))}
      </div>
    </TinderDoFluxoPageShell>
  );
}

export function TinderAvaliacoesPrestadorPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  useEffect(() => {
    api.get<{ profile: any }>('/api/tinder-do-fluxo/service-profile')
      .then((r) => r.profile?.id ? api.get<{ reviews: any[] }>(`/api/tinder-do-fluxo/services/${r.profile.id}/reviews`) : { reviews: [] })
      .then((r: any) => setReviews(r.reviews || []))
      .catch(() => setReviews([]));
  }, []);
  return (
    <TinderDoFluxoPageShell title="Minhas Avaliações">
      <div className="card">
        {reviews.length === 0 ? <EmptyState text="Você ainda não recebeu avaliações." /> : (
          <div style={{ display: 'grid', gap: 8 }}>
            {reviews.map((r) => <div key={r.id} className="quick-action">Nota {r.rating} ★ — {r.comment || 'Sem comentário'}</div>)}
          </div>
        )}
      </div>
    </TinderDoFluxoPageShell>
  );
}

function prestadorProfileAvatarUrl(s: { photo_url?: string | null; users?: { name?: string } | null }): string {
  if (s?.photo_url && String(s.photo_url).trim()) return s.photo_url;
  const name = s?.users?.name || 'Prestador';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=256&background=94a3b8&color=fff`;
}

function prestadorProfileCityDisplay(s: { city?: string | null; state?: string | null }): string {
  const city = (s?.city || '').trim();
  const state = (s?.state || '').trim();
  if (city && state) return `${city}, ${state}`;
  return city || state || 'Localização não informada';
}

function formatPrecoMinimo(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

const PRESTADOR_TABS = [
  { id: 'sobre', label: 'Sobre & Experiência' },
  { id: 'portfolio', label: 'Portfólio' },
  { id: 'avaliacoes', label: 'Avaliações' },
  { id: 'servicos', label: 'Serviços' },
] as const;

export function TinderServiceDetailPage() {
  const { id } = useParams();
  const [service, setService] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<(typeof PRESTADOR_TABS)[number]['id']>('sobre');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get<{ service: any }>(`/api/tinder-do-fluxo/services/${id}`).then((r) => r.service),
      api.get<{ reviews: any[] }>(`/api/tinder-do-fluxo/services/${id}/reviews`).then((r) => r.reviews || []),
    ])
      .then(([svc, rev]) => {
        setService(svc);
        setReviews(rev);
      })
      .catch(() => {
        setService(null);
        setReviews([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const submitReview = async () => {
    if (!id) return;
    await api.post(`/api/tinder-do-fluxo/services/${id}/reviews`, { rating, comment });
    setMessage('Avaliação enviada.');
    setComment('');
    const r = await api.get<{ reviews: any[] }>(`/api/tinder-do-fluxo/services/${id}/reviews`);
    setReviews(r.reviews || []);
  };

  const beneficios: string[] = Array.isArray(service?.beneficios) ? service.beneficios : [];
  if (beneficios.length === 0 && service) {
    beneficios.push('Análise de Avatar Gratuita', '2 Rodadas de Revisão', 'Entrega em até 7 dias úteis');
  }

  if (loading) {
  return (
    <TinderDoFluxoPageShell title="Perfil do Prestador">
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <EmptyState text="Carregando prestador..." />
        </div>
      </TinderDoFluxoPageShell>
    );
  }

  if (!service) {
    return (
      <TinderDoFluxoPageShell title="Perfil do Prestador">
          <div className="card">
          <EmptyState text="Prestador não encontrado." />
          </div>
      </TinderDoFluxoPageShell>
    );
  }

  const memberSince = service.created_at ? new Date(service.created_at).getFullYear() : null;
  const whatsappUrl = whatsappLink(service.whatsapp ?? '');

  return (
    <TinderDoFluxoPageShell title="Perfil do Prestador">
      <div className="prestador-profile">
        <div className="prestador-profile-header-card">
          <div className="prestador-profile-header">
            <div className="prestador-profile-avatar-wrap">
              <img className="prestador-profile-avatar" src={prestadorProfileAvatarUrl(service)} alt="" />
              <span className="prestador-profile-avatar-online" title="Online" />
            </div>
            <div className="prestador-profile-header-text">
              <div className="prestador-profile-name-row">
                <h2 className="prestador-profile-name">{service.users?.name || 'Prestador'}</h2>
                {service.certification && (
                  <span className="prestador-profile-badge">
                    <span className="material-symbols-outlined">verified</span>
                    {service.certification}
                  </span>
                )}
              </div>
              {service.headline && <p className="prestador-profile-headline">{service.headline}</p>}
              <div className="prestador-profile-meta">
                <span><span className="material-symbols-outlined">location_on</span> {prestadorProfileCityDisplay(service)}</span>
                <span><span className="material-symbols-outlined">star</span> {Number(service.rating_avg || 0).toFixed(1)} ({service.rating_count || 0} avaliações)</span>
                {memberSince && <span><span className="material-symbols-outlined">calendar_today</span> Membro desde {memberSince}</span>}
              </div>
            </div>
            <div className="prestador-profile-header-actions">
              <button type="button" title="Compartilhar"><span className="material-symbols-outlined">share</span></button>
              <button type="button" title="Favoritar"><span className="material-symbols-outlined">favorite</span></button>
            </div>
          </div>
        </div>

        <div className="prestador-profile-tabs">
          {PRESTADOR_TABS.map((tab) => (
            <button key={tab.id} type="button" className={`prestador-profile-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="prestador-profile-grid">
          <div className="prestador-profile-main">
            {activeTab === 'sobre' && (
              <>
                <section>
                  <h3><span className="material-symbols-outlined">description</span> Bio Profissional</h3>
                  <p className="prestador-profile-bio-text">{service.bio || 'Sem bio cadastrada.'}</p>
                  {service.experience && <p className="prestador-profile-bio-text" style={{ marginTop: 16 }}>{service.experience}</p>}
                </section>
                <section>
                  <h3><span className="material-symbols-outlined">history_edu</span> Experiência & Certificações</h3>
                  {service.certification && (
                    <div className="prestador-profile-exp-card">
                      <div className="prestador-profile-exp-icon"><span className="material-symbols-outlined">workspace_premium</span></div>
                      <div><h4>{service.certification}</h4><p>Certificação</p></div>
                    </div>
                  )}
                  {service.specialty && (
                    <div className="prestador-profile-exp-card">
                      <div className="prestador-profile-exp-icon"><span className="material-symbols-outlined">campaign</span></div>
                      <div><h4>Especialidade: {service.specialty}</h4><p>{service.headline || service.experience || '—'}</p></div>
                    </div>
                  )}
                </section>
              </>
            )}
            {activeTab === 'portfolio' && (
              <section>
                <h3><span className="material-symbols-outlined">photo_library</span> Portfólio</h3>
                <p className="prestador-profile-bio-text">{service.portfolio || 'Portfólio não informado.'}</p>
              </section>
            )}
            {activeTab === 'servicos' && (
              <section>
                <h3><span className="material-symbols-outlined">work</span> Serviços</h3>
                <p className="prestador-profile-bio-text">Especialidade: {service.specialty || '—'}. {service.bio || ''}</p>
              </section>
            )}
            {activeTab === 'avaliacoes' && (
              <section>
                <div className="prestador-profile-reviews-header">
                  <h3><span className="material-symbols-outlined">reviews</span> Avaliações dos Clientes</h3>
                  <div className="prestador-profile-review-rating-summary">
                    <span>{Number(service.rating_avg || 0).toFixed(1)}</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                    <span>({reviews.length})</span>
                  </div>
                </div>
                {reviews.length === 0 ? <EmptyState text="Sem avaliações." /> : (
                  reviews.slice(0, 10).map((r) => (
                    <div key={r.id} className="prestador-profile-review-item">
                      <div className="prestador-profile-review-top">
                        <div className="prestador-profile-review-author">
                          <img className="prestador-profile-review-avatar" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(r.users?.name || 'A')}&size=80`} alt="" />
                          <div><p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{r.users?.name || 'Anônimo'}</p><p className="author-role">Avaliação</p></div>
                        </div>
                        <div className="prestador-profile-review-stars">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i} className="material-symbols-outlined" style={{ fontVariationSettings: i < (r.rating || 0) ? '"FILL" 1' : '"FILL" 0' }}>star</span>
                          ))}
                        </div>
                      </div>
                      <p className="prestador-profile-review-body">"{r.comment || 'Sem comentário.'}"</p>
                    </div>
                  ))
                )}
                {reviews.length > 10 && <button type="button" className="prestador-profile-btn-all-reviews">Ver todas as {reviews.length} avaliações</button>}
                <div className="prestador-profile-form-review">
                  <h4 style={{ marginBottom: 16 }}>Deixar avaliação</h4>
            <div className="form-group"><label>Nota (1-5)</label><input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} /></div>
                  <div className="form-group"><label>Comentário</label><textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Conte sua experiência..." /></div>
            <button className="btn btn-primary" type="button" onClick={submitReview}>Avaliar prestador</button>
            {message && <p style={{ marginTop: 8, color: 'var(--green)' }}>{message}</p>}
          </div>
              </section>
            )}
            </div>

          <aside className="prestador-profile-sidebar">
            <div className="prestador-profile-price-card">
              <p className="prestador-profile-price-label">A partir de</p>
              <p className="prestador-profile-price-value">
                {formatPrecoMinimo(service.preco_minimo) || '—'}
                {service.preco_minimo != null && <span> /projeto</span>}
              </p>
              <div className="prestador-profile-benefits">
                {beneficios.map((b, i) => (
                  <div key={i} className="prestador-profile-benefit"><span className="material-symbols-outlined">check_circle</span><span>{b}</span></div>
                ))}
          </div>
              {whatsappUrl && (
                <a className="prestador-profile-whatsapp-btn" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <span className="material-symbols-outlined">chat</span> Chamar no WhatsApp
                </a>
              )}
              <button type="button" className="prestador-profile-orcamento-btn">Solicitar Orçamento</button>
              <p className="prestador-profile-secure-text">Pagamento Seguro Via Plataforma</p>
            </div>
            <div className="prestador-profile-portfolio-card">
              <h4>Trabalhos Recentes</h4>
              <div className="prestador-profile-portfolio-grid">
                <div className="prestador-profile-portfolio-thumb" style={{ background: 'var(--bg-main)' }} />
                <div className="prestador-profile-portfolio-thumb" style={{ background: 'var(--bg-main)' }} />
              </div>
              <button type="button" className="prestador-profile-orcamento-btn" style={{ marginTop: 16, background: 'transparent', border: 'none', fontSize: 14 }}>Ver Portfólio Completo</button>
            </div>
          </aside>
        </div>
      </div>
    </TinderDoFluxoPageShell>
  );
}

// Dados mock para a página Minhas Candidaturas (apenas frontend) — design referência
type ApplicationStatus = 'ENVIADA' | 'VISUALIZADA' | 'EM_CONVERSA' | 'ENCERRADA';
const MOCK_MY_APPLICATIONS: Array<{
  id: number;
  applicationStatus: ApplicationStatus;
  created_at: string;
  tinder_jobs: { id: number; title: string; specialty?: string };
  recruiter: { name: string; avatar_url: string; tags: string[] };
  creator_id?: number;
}> = [
  {
    id: 1,
    applicationStatus: 'ENVIADA',
    created_at: '2023-10-12T10:00:00.000Z',
    tinder_jobs: { id: 101, title: 'Gestor de Tráfego para Perpétuo', specialty: 'Tráfego' },
    recruiter: { name: 'Bernardo Silva', avatar_url: 'https://i.pravatar.cc/400?u=bernardo-silva', tags: ['VTSD', 'FLUXO'] },
    creator_id: 1,
  },
  {
    id: 2,
    applicationStatus: 'VISUALIZADA',
    created_at: '2023-10-08T14:30:00.000Z',
    tinder_jobs: { id: 102, title: 'Copywriter para Lançamento High-Ticket', specialty: 'Copy' },
    recruiter: { name: 'Juliana Rocha', avatar_url: 'https://i.pravatar.cc/400?u=juliana-rocha', tags: ['VTSD'] },
    creator_id: 2,
  },
  {
    id: 3,
    applicationStatus: 'EM_CONVERSA',
    created_at: '2023-10-05T09:15:00.000Z',
    tinder_jobs: { id: 103, title: 'Especialista em Automação (n8n/Make)', specialty: 'Automação' },
    recruiter: { name: 'Marcos Olive', avatar_url: 'https://i.pravatar.cc/400?u=marcos-olive', tags: ['VTSD', 'FLUXO'] },
    creator_id: 3,
  },
  {
    id: 4,
    applicationStatus: 'ENCERRADA',
    created_at: '2023-09-20T16:00:00.000Z',
    tinder_jobs: { id: 104, title: 'Lançador de Infoprodutos Wellness', specialty: 'Produto' },
    recruiter: { name: 'Clara Nunes', avatar_url: 'https://i.pravatar.cc/400?u=clara-nunes', tags: ['VTSD'] },
    creator_id: 4,
  },
];

const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  ENVIADA: 'Enviada',
  VISUALIZADA: 'Visualizada',
  EM_CONVERSA: 'Em conversa',
  ENCERRADA: 'Encerrada',
};

export function TinderMyApplicationsPage() {
  const [search, setSearch] = useState('');
  const applications = MOCK_MY_APPLICATIONS;
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const filteredApplications = search.trim()
    ? applications.filter(
        (app) =>
          app.tinder_jobs.title.toLowerCase().includes(search.toLowerCase()) ||
          app.recruiter.name.toLowerCase().includes(search.toLowerCase()) ||
          (app.tinder_jobs.specialty && app.tinder_jobs.specialty.toLowerCase().includes(search.toLowerCase()))
      )
    : applications;

  return (
    <TinderDoFluxoPageShell title="Minhas Candidaturas" subtitle="Acompanhe as vagas para as quais você se candidatou.">
      <div className="candidaturas-page">
        <header className="candidaturas-header">
          <div className="search-wrap">
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              placeholder="Buscar candidaturas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
        </div>
          <div className="header-actions">
            <button type="button" title="Notificações">
              <span className="material-symbols-outlined">notifications</span>
              <span className="notif-dot" aria-hidden />
            </button>
            <button type="button" title="Chat">
              <span className="material-symbols-outlined">chat_bubble</span>
            </button>
          </div>
        </header>

        <div className="filters">
          <button type="button">
            Status
            <span className="material-symbols-outlined">keyboard_arrow_down</span>
          </button>
          <button type="button">
            Categoria
            <span className="material-symbols-outlined">keyboard_arrow_down</span>
          </button>
          <button type="button">
            Ordenação (Mais recentes)
            <span className="material-symbols-outlined">keyboard_arrow_down</span>
          </button>
        </div>

        {filteredApplications.length === 0 ? (
          <div className="card empty-state-card">
            <EmptyState text={search ? 'Nenhuma candidatura encontrada para essa busca.' : 'Você ainda não se candidatou para nenhuma vaga.'} />
        </div>
      ) : (
          <>
            <div className="cards-list">
              {filteredApplications.map((app) => {
            const job = app.tinder_jobs;
                const statusClass = app.applicationStatus.toLowerCase().replace('_', '-');
                const isEncerrada = app.applicationStatus === 'ENCERRADA';
                const isEmConversa = app.applicationStatus === 'EM_CONVERSA';
            return (
                  <div key={app.id} className={`app-card ${isEncerrada ? 'encerrada' : ''} ${isEmConversa ? 'em-conversa' : ''}`}>
                    <div className="app-card-body">
                      <div className="app-card-meta">
                        <span className={`app-card-badge ${statusClass}`}>{APPLICATION_STATUS_LABEL[app.applicationStatus]}</span>
                        <span className="app-card-date">Aplicada em {formatDate(app.created_at)}</span>
                  </div>
                      <h3 className="app-card-title">{job.title}</h3>
                      <p className="app-card-category">{job.specialty || 'Vaga'}</p>
                      <div className="app-card-recruiter">
                        <div className="avatar">
                          <img src={app.recruiter.avatar_url} alt="" />
                </div>
                        <div>
                          <p className="recruiter-name">{app.recruiter.name}</p>
                          <div className="recruiter-tags">
                            {app.recruiter.tags.map((tag) => (
                              <span key={tag}>{tag}</span>
                            ))}
                </div>
                  </div>
                      </div>
                    </div>
                    <div className="app-card-actions">
                      {isEmConversa && (
                        <Link className="btn-card primary" to="/tinder-do-fluxo/matches">
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chat</span>
                          Abrir conversa
                        </Link>
                      )}
                      {isEncerrada ? (
                        <button type="button" className="btn-card disabled">Encerrada</button>
                      ) : (
                        <Link className="btn-card secondary" to={`/tinder-do-fluxo/vagas/${job.id}`}>Ver vaga</Link>
                      )}
                      {!isEncerrada && (
                        <Link className="btn-card outline" to={app.creator_id ? `/tinder-do-fluxo/u/${app.creator_id}` : '#'}>Ver perfil</Link>
                      )}
                      {isEncerrada && (
                        <Link className="btn-card outline" to={`/tinder-do-fluxo/vagas/${job.id}`}>Ver vaga</Link>
                      )}
                    </div>
              </div>
            );
          })}
        </div>
            <div className="pagination">
              <nav>
                <button type="button" disabled aria-label="Página anterior">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button type="button" className="active">1</button>
                <button type="button">2</button>
                <button type="button" aria-label="Próxima página">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </nav>
            </div>
          </>
        )}
      </div>
    </TinderDoFluxoPageShell>
  );
}

export function TinderUserPublicPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    if (!id) return;
    api.get<any>(`/api/tinder-do-fluxo/users/${id}`).then(setData);
  }, [id]);
  return (
    <TinderDoFluxoPageShell title="Perfil Público">
      {!data ? <div className="card"><EmptyState text="Carregando perfil..." /></div> : (
        <div className="card">
          <h3>{data.user?.name}</h3>
          <p style={{ marginTop: 8 }}>{data.mentorProfile?.bio || data.serviceProfile?.bio || 'Sem bio cadastrada.'}</p>
          {data.canSeeWhatsapp ? (
            <p style={{ marginTop: 8, color: 'var(--green)' }}>WhatsApp disponível</p>
          ) : (
            <p style={{ marginTop: 8, color: 'var(--text-muted)' }}>WhatsApp liberado após match.</p>
          )}
        </div>
      )}
    </TinderDoFluxoPageShell>
  );
}

export function TinderAdminDashboardPage() {
  const [kpis, setKpis] = useState<any>(null);
  useEffect(() => {
    api.get<{ kpis: any }>('/api/tinder-do-fluxo/admin/dashboard').then((r) => setKpis(r.kpis));
  }, []);
  return (
    <TinderDoFluxoPageShell title="Admin • Dashboard">
      <div className="stats-grid">
        {Object.entries(kpis || {}).map(([key, val]) => (
          <div className="stat-card" key={key}>
            <div className="stat-label">{key}</div>
            <div className="stat-value">{String(val)}</div>
          </div>
        ))}
      </div>
    </TinderDoFluxoPageShell>
  );
}

export function TinderAdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  useEffect(() => {
    setLoading(true);
    setError('');
    api.get<{ users: any[] }>('/api/tinder-do-fluxo/admin/users')
      .then((r) => {
        setUsers(r.users || []);
        setLoading(false);
      })
      .catch((err: any) => {
        console.error('[TinderAdminUsersPage] Erro:', err);
        setError(err.message || 'Erro ao carregar usuários.');
        setLoading(false);
      });
  }, []);
  
  return (
    <TinderDoFluxoPageShell title="Admin • Usuários">
      <div className="card">
        {loading && <div style={{ textAlign: 'center', padding: 48 }}><div className="loading-spinner" /></div>}
        {error && <div style={{ padding: 16, background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 8, marginBottom: 16 }}>
          <strong>Erro:</strong> {error}
        </div>}
        {!loading && !error && users.length === 0 && <EmptyState text="Nenhum usuário encontrado." />}
        {!loading && !error && users.length > 0 && users.map((u) => (
          <div key={u.id} className="quick-action">{u.name} • {u.email} • {u.role}</div>
        ))}
      </div>
    </TinderDoFluxoPageShell>
  );
}

export function TinderAdminJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  useEffect(() => {
    api.get<{ jobs: any[] }>('/api/tinder-do-fluxo/admin/jobs').then((r) => setJobs(r.jobs || []));
  }, []);
  return (
    <TinderDoFluxoPageShell title="Admin • Vagas">
      <div className="card">
        {jobs.length === 0 ? <EmptyState text="Nenhuma vaga registrada." /> : jobs.map((j) => (
          <div key={j.id} className="quick-action">{j.title} • {j.status}</div>
        ))}
      </div>
    </TinderDoFluxoPageShell>
  );
}

export function TinderAdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  useEffect(() => {
    api.get<{ reviews: any[] }>('/api/tinder-do-fluxo/admin/reviews').then((r) => setReviews(r.reviews || []));
  }, []);
  return (
    <TinderDoFluxoPageShell title="Admin • Avaliações">
      <div className="card">
        {reviews.length === 0 ? <EmptyState text="Nenhuma avaliação registrada." /> : reviews.map((r) => (
          <div key={r.id} className="quick-action">Review #{r.id} • Nota {r.rating}</div>
        ))}
      </div>
    </TinderDoFluxoPageShell>
  );
}

export function TinderAdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    api.get<{ logs: any[] }>('/api/tinder-do-fluxo/admin/logs').then((r) => setLogs(r.logs || []));
  }, []);
  return (
    <TinderDoFluxoPageShell title="Admin • Logs">
      <div className="card">
        {logs.length === 0 ? <EmptyState text="Sem logs no momento." /> : logs.map((l) => (
          <div key={l.id} className="quick-action">{l.action} • {new Date(l.created_at).toLocaleString()}</div>
        ))}
      </div>
    </TinderDoFluxoPageShell>
  );
}

export function TinderSimplePlaceholderPage({ title, subtitle }: { title: string; subtitle?: string }) {
  return <TinderDoFluxoPageShell title={title} subtitle={subtitle} />;
}
