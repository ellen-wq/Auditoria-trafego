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
import TinderFilters from '../components/tinder/TinderFilters';
import ProfileDiscoveryCard from '../components/tinder/ProfileDiscoveryCard';
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
  
  // Filters
  const [partnershipTypes, setPartnershipTypes] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  // Busca do header (placeholder: "Buscar por objetivo, nome...")
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  const currentUser = api.getUser();

  // Load available cities
  useEffect(() => {
    loadAvailableCities();
  }, []);

  // Load discovery profiles (inclui busca por nome/objetivo)
  useEffect(() => {
    loadDiscoveryProfiles();
  }, [partnershipTypes, lookingFor, cities, debouncedSearchQuery]);

  const loadAvailableCities = async () => {
    try {
      const res = await api.get<{ cities: string[] }>('/api/tinder-do-fluxo/cities');
      setAvailableCities(res.cities || []);
    } catch (err) {
      console.error('Erro ao carregar cidades:', err);
      setAvailableCities([]);
    }
  };

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
      if (cities.length > 0) {
        cities.forEach(city => params.append('city', city));
      }
      params.append('smart_ordering', 'true');

      const url = `/api/tinder-do-fluxo/feed/expert${params.toString() ? '?' + params.toString() : ''}`;
      const res = await api.get<{ users?: any[] }>(url);
      const users = res.users || [];

      // Mapear modelo_trabalho para label de formato (tipos de parceria / formato)
      const formatoLabel: Record<string, string> = {
        remoto: 'Remoto',
        hibrido: 'Híbrido',
        presencial: 'Presencial',
        indiferente: 'Indiferente',
      };

      // Transform users to match ProfileDiscoveryCard format (conectado às colunas do Supabase)
      const transformed = users.map((u: any) => {
        const expertProfile = u.tinder_expert_profiles || u.tinder_mentor_profiles;
        const mentorProfile = u.tinder_mentor_profiles;

        const isExpert = expertProfile?.is_expert || false;
        const isCoprodutor = expertProfile?.is_coproducer || false;

        const modelo = mentorProfile?.modelo_trabalho;
        const formato = modelo ? (formatoLabel[modelo] || modelo) : undefined;

        return {
          id: u.id,
          name: u.name,
          photo_url: mentorProfile?.photo_url,
          objective: mentorProfile?.headline || expertProfile?.goal_text || '',
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
              objective: profileObj.headline || p.objective,
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
    setPartnershipTypes([]);
    setLookingFor([]);
    setCities([]);
    setSearchQuery('');
  };

  const currentProfile = discoveryProfiles[currentProfileIndex];

  const toggleLookingFor = (value: 'expert' | 'coprodutor') => {
    if (lookingFor.includes(value)) {
      setLookingFor(lookingFor.filter((t) => t !== value));
    } else {
      setLookingFor([...lookingFor, value]);
    }
  };

  return (
    <TinderDoFluxoPageShell title="Expert & Coprodutor" subtitle="Descubra perfis e faça matches">
      <div id="tinder-expert-page-root" data-page="expert">
      {/* Header com busca (spec: Buscar por objetivo, nome...) + Expert/Coprodutor + ícones */}
      <header
        data-page="expert-search"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          height: 80,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          background: 'var(--bg-white)',
          borderBottom: '1px solid var(--border)',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, maxWidth: 560 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <label htmlFor="expert-search-input" style={{ position: 'absolute', left: -9999 }}>Busca</label>
            <span
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: 18,
                pointerEvents: 'none',
              }}
              aria-hidden
            >
              🔍
            </span>
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
                background: 'var(--bg-secondary)',
                color: 'var(--text)',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = '0 0 0 2px var(--green)';
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = 'none';
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
                gap: 6,
                padding: '10px 14px',
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                borderRadius: 12,
                background: lookingFor.includes('expert') ? 'var(--accent-dark)' : 'var(--bg-secondary)',
                color: lookingFor.includes('expert') ? 'white' : 'var(--text)',
                cursor: 'pointer',
              }}
            >
              Expert
              <span style={{ fontSize: 14 }}>▼</span>
            </button>
            <button
              type="button"
              onClick={() => toggleLookingFor('coprodutor')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 14px',
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                borderRadius: 12,
                background: lookingFor.includes('coprodutor') ? 'var(--purple)' : 'var(--bg-secondary)',
                color: lookingFor.includes('coprodutor') ? 'white' : 'var(--text)',
                cursor: 'pointer',
              }}
            >
              Coprodutor
              <span style={{ fontSize: 14 }}>▼</span>
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            to="/tinder-do-fluxo/matches"
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: 'var(--bg-secondary)',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              position: 'relative',
            }}
            title="Notificações / Matches"
          >
            🔔
            <span
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--red)',
                border: '2px solid var(--bg-white)',
              }}
            />
          </Link>
          <button
            type="button"
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: 'var(--bg-secondary)',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            title="Filtros"
            onClick={() => document.querySelector('.tinder-filters-card')?.scrollIntoView({ behavior: 'smooth' })}
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Link rápido para matches (mantido) */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Link to="/tinder-do-fluxo/matches" className="btn btn-outline">
          👋 Ver Matches
        </Link>
      </div>

      {/* Filters */}
      <TinderFilters
        partnershipTypes={partnershipTypes}
        onPartnershipTypesChange={setPartnershipTypes}
        lookingFor={lookingFor}
        onLookingForChange={setLookingFor}
        cities={cities}
        onCitiesChange={setCities}
        availableCities={availableCities}
      />

      {/* Discovery Card */}
        {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 600, margin: '0 auto 24px' }}>
          <div className="loading-spinner" />
          <p style={{ color: 'var(--text-secondary)', marginTop: 16 }}>Carregando perfis...</p>
          </div>
      ) : discoveryProfiles.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 600, margin: '0 auto 24px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
            {partnershipTypes.length > 0 || lookingFor.length > 0 || searchQuery.trim()
              ? 'Nenhum perfil encontrado com os filtros ou busca selecionados.'
              : 'Nenhum perfil disponível no momento. O feed mostra outros usuários Expert ou Coprodutor; verifique se há outros perfis no sistema.'}
          </p>
          {(partnershipTypes.length > 0 || lookingFor.length > 0 || searchQuery.trim()) && (
            <button className="btn btn-outline" onClick={handleClearFilters}>
              Limpar filtros
            </button>
          )}
        </div>
      ) : !currentProfile ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 600, margin: '0 auto 24px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
            Nenhum perfil disponível no momento
          </p>
            </div>
      ) : (
        <SwipeActions onSwipeLeft={handlePass} onSwipeRight={handleMatch} disabled={isSendingInterest}>
          <ProfileDiscoveryCard
            profile={currentProfile}
            onPass={handlePass}
            onMatch={handleMatch}
            onSwipe={handleSwipe}
          />
        </SwipeActions>
      )}

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

export function TinderPrestadoresPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    tipo_servico: [] as string[],
    rating_min: null as number | null,
    modo_trabalho: [] as string[],
  });
  const debouncedSearchText = useDebounce(searchText, 400);

  useEffect(() => {
    loadServices();
  }, [debouncedSearchText, filters]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearchText) params.append('q', debouncedSearchText);
      if (filters.tipo_servico.length > 0) {
        params.append('tipo_servico', filters.tipo_servico.join(','));
      }
      if (filters.rating_min) {
        params.append('rating_min', filters.rating_min.toString());
      }
      if (filters.modo_trabalho.length > 0) {
        params.append('modo_trabalho', filters.modo_trabalho.join(','));
      }
      
      const res = await api.get<{ services: any[] }>(`/api/tinder-do-fluxo/services?${params.toString()}`);
      setServices(res.services || []);
    } catch (err) {
      console.error('Erro ao carregar prestadores:', err);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TinderDoFluxoPageShell title="Prestadores" subtitle="Diretório por especialidade e avaliação">
      <GlobalSearch
        placeholder="Buscar por nome, especialidade..."
        onSearch={setSearchText}
      />
      
      {/* Filtros */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 14, fontWeight: 600 }}>Tipo de serviço:</label>
            {['COPY', 'TRAFEGO', 'AUTOMACAO'].map((tipo) => (
              <label key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filters.tipo_servico.includes(tipo)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilters({ ...filters, tipo_servico: [...filters.tipo_servico, tipo] });
                    } else {
                      setFilters({ ...filters, tipo_servico: filters.tipo_servico.filter(t => t !== tipo) });
                    }
                  }}
                />
                <span>{tipo === 'TRAFEGO' ? 'Tráfego' : tipo === 'AUTOMACAO' ? 'Automação' : tipo}</span>
              </label>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 14, fontWeight: 600 }}>Avaliação mínima:</label>
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => {
                  setFilters({ 
                    ...filters, 
                    rating_min: filters.rating_min === rating ? null : rating 
                  });
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius)',
                  border: `1px solid ${filters.rating_min === rating ? 'var(--accent-dark)' : 'var(--border)'}`,
                  background: filters.rating_min === rating ? 'var(--accent-light)' : 'var(--bg-white)',
                  color: filters.rating_min === rating ? 'var(--accent-dark)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                {Array.from({ length: rating }).map((_, i) => '★')} {rating}+
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: 'var(--text-secondary)' }}>Carregando prestadores...</p>
          </div>
        ) : services.length === 0 ? (
          <EmptyState text={debouncedSearchText ? "Nenhum prestador encontrado para sua busca." : "Nenhum prestador encontrado."} />
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {services.map((s) => (
              <div key={s.id} className="quick-action">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{s.users?.name || 'Prestador'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.specialty || 'Especialidade não informada'} • {Number(s.rating_avg || 0).toFixed(1)} ★</div>
                </div>
                <Link className="btn btn-outline" to={`/tinder-do-fluxo/prestadores/${s.id}`}>Ver perfil</Link>
              </div>
            ))}
          </div>
        )}
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
  const tabParam = searchParams.get('tab') || 'minhas';
  const statusTab: 'minhas' | 'abertas' | 'encerradas' =
    tabParam === 'todas' ? 'minhas' : tabParam === 'abertas' || tabParam === 'encerradas' ? tabParam : 'minhas';
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
  const hasActiveFilters = !!(
    debouncedSearch ||
    filters.tipo_vaga ||
    filters.pretensao_min ||
    filters.pretensao_max ||
    filters.modelo_trabalho
  );

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
      params.set('tab', 'minhas');
      params.set('status_filter', statusFilterApi);
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
          {(['minhas', 'abertas', 'encerradas'] as const).map((t) => (
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
              {t === 'minhas' ? 'Minhas' : t === 'abertas' ? 'Abertas' : 'Encerradas'}
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
                <EmptyState text="Você ainda não publicou nenhuma vaga." />
                <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>
                  Vagas criadas por você aparecerão aqui (Minhas, Abertas e Encerradas).
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

export function TinderFavoritosPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  useEffect(() => {
    api.get<{ favorites: any[] }>('/api/tinder-do-fluxo/favorites').then((r) => setFavorites(r.favorites || []));
  }, []);
  return (
    <TinderDoFluxoPageShell title="Favoritos">
      <div className="card">
        {favorites.length === 0 ? <EmptyState text="Nenhum favorito salvo." /> : (
          <div style={{ display: 'grid', gap: 8 }}>
            {favorites.map((f) => <div key={f.id} className="quick-action">{f.users?.name || `Usuário ${f.target_user_id}`} • {f.type}</div>)}
          </div>
        )}
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

export function TinderServiceDetailPage() {
  const { id } = useParams();
  const [service, setService] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!id) return;
    api.get<{ service: any }>(`/api/tinder-do-fluxo/services/${id}`).then((r) => setService(r.service));
    api.get<{ reviews: any[] }>(`/api/tinder-do-fluxo/services/${id}/reviews`).then((r) => setReviews(r.reviews || []));
  }, [id]);

  const submitReview = async () => {
    if (!id) return;
    await api.post(`/api/tinder-do-fluxo/services/${id}/reviews`, { rating, comment });
    setMessage('Avaliação enviada.');
    const r = await api.get<{ reviews: any[] }>(`/api/tinder-do-fluxo/services/${id}/reviews`);
    setReviews(r.reviews || []);
  };

  return (
    <TinderDoFluxoPageShell title="Perfil do Prestador">
      {!service ? <div className="card"><EmptyState text="Carregando prestador..." /></div> : (
        <>
          <div className="card">
            <h3>{service.users?.name || 'Prestador'}</h3>
            <p style={{ marginTop: 8 }}>{service.bio || 'Sem bio cadastrada.'}</p>
            <p style={{ marginTop: 8, color: 'var(--text-muted)' }}>WhatsApp: {service.whatsapp || '-'}</p>
          </div>
          <div className="card" style={{ marginTop: 12 }}>
            <div className="form-group"><label>Nota (1-5)</label><input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} /></div>
            <div className="form-group"><label>Comentário</label><textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} /></div>
            <button className="btn btn-primary" type="button" onClick={submitReview}>Avaliar prestador</button>
            {message && <p style={{ marginTop: 8, color: 'var(--green)' }}>{message}</p>}
          </div>
          <div className="card" style={{ marginTop: 12 }}>
            <span className="card-title">Avaliações</span>
            <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
              {reviews.length === 0 ? <EmptyState text="Sem avaliações." /> : reviews.map((r) => <div key={r.id} className="quick-action">Nota {r.rating} ★ — {r.comment || 'Sem comentário'}</div>)}
            </div>
          </div>
        </>
      )}
    </TinderDoFluxoPageShell>
  );
}

export function TinderMyApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadApplications();
  }, []);
  
  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ applications: any[] }>('/api/tinder-do-fluxo/jobs/my-applications');
      setApplications(res.applications || []);
    } catch (err: any) {
      console.error('Erro ao carregar candidaturas:', err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <TinderDoFluxoPageShell title="Minhas Candidaturas" subtitle="Vagas que você se candidatou">
      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div className="loading-spinner" />
          <p style={{ color: 'var(--text-secondary)', marginTop: 16 }}>Carregando candidaturas...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="card">
          <EmptyState text="Você ainda não se candidatou para nenhuma vaga." />
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {applications.map((app: any) => {
            const job = app.tinder_jobs;
            if (!job) return null;
            
            return (
              <div key={app.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, marginBottom: 8 }}>{job.title}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
                      Candidatado em {formatDate(app.created_at)}
                    </p>
                  </div>
                  <Link 
                    className="btn btn-outline" 
                    to={`/tinder-do-fluxo/vagas/${job.id}`}
                    style={{ marginLeft: 12 }}
                  >
                    Ver vaga
                  </Link>
                </div>
                
                {job.description && (
                  <p style={{ marginTop: 8, marginBottom: 8, color: 'var(--text-secondary)' }}>
                    {job.description.length > 200 ? job.description.substring(0, 200) + '...' : job.description}
                  </p>
                )}
                
                <div style={{ 
                  display: 'flex', 
                  gap: 12, 
                  flexWrap: 'wrap', 
                  marginTop: 12,
                  padding: 12,
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius)'
                }}>
                  {job.specialty && <span style={{ fontSize: 12 }}>📌 {job.specialty}</span>}
                  {job.model && <span style={{ fontSize: 12 }}>💼 {job.model}</span>}
                  {job.location && <span style={{ fontSize: 12 }}>📍 {job.location}</span>}
                  {job.value && <span style={{ fontSize: 12 }}>💰 R$ {Number(job.value).toLocaleString('pt-BR')}</span>}
                  {job.status && (
                    <span style={{ 
                      fontSize: 12,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: job.status === 'OPEN' ? 'var(--green)' : 'var(--text-muted)',
                      color: 'white'
                    }}>
                      {job.status === 'OPEN' ? 'Aberta' : 'Fechada'}
                    </span>
                  )}
                </div>
                
                {app.message && (
                  <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-sidebar)', borderRadius: 'var(--radius)' }}>
                    <strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sua mensagem:</strong>
                    <p style={{ marginTop: 4, fontSize: 14 }}>{app.message}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
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
