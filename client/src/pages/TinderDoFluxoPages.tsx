import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
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

  const currentUser = api.getUser();

  // Load available cities
  useEffect(() => {
    loadAvailableCities();
  }, []);

  // Load discovery profiles
  useEffect(() => {
    loadDiscoveryProfiles();
  }, [partnershipTypes, lookingFor, cities]);

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

      // Transform users to match ProfileDiscoveryCard format
      const transformed = users.map((u: any) => {
        const expertProfile = u.tinder_expert_profiles || u.tinder_mentor_profiles;
        const mentorProfile = u.tinder_mentor_profiles;

        const isExpert = expertProfile?.is_expert || false;
        const isCoprodutor = expertProfile?.is_coproducer || false;

        return {
          id: u.id,
          name: u.name,
          photo_url: mentorProfile?.photo_url,
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
        setDiscoveryProfiles(prev => prev.map((p, idx) => {
          if (idx === currentProfileIndex) {
            return {
              ...p,
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
  };

  const currentProfile = discoveryProfiles[currentProfileIndex];

  return (
    <TinderDoFluxoPageShell title="Tinder do Fluxo" subtitle="Descubra perfis e faça matches">
      {/* Header com link para matches */}
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
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
            Nenhum perfil encontrado com os filtros selecionados
          </p>
          {(partnershipTypes.length > 0 || lookingFor.length > 0) && (
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

export function TinderVagasPage() {
  const user = api.getUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'abertas';
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    tipo_vaga: '',
    pretensao_min: '',
    pretensao_max: '',
    tipo_contratacao: '',
    modelo_trabalho: '',
    habilidades: {
      copywriter: false,
      trafego_pago: [] as string[],
      automacao_ia: false
    }
  });
  const [jobs, setJobs] = useState<any[]>([]);
  const [totalVagas, setTotalVagas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const tipoVagaOptions = ['Projeto', 'Fixo', 'Parceria'];
  const tipoContratacaoOptions = ['PJ', 'CLT', 'Freelancer', 'Indiferente'];
  const modeloTrabalhoOptions = ['Remoto', 'Presencial', 'Híbrido', 'Indiferente'];
  const trafegoSubcategorias = [
    { value: 'facebook_ads', label: 'Facebook Ads' },
    { value: 'google_ads', label: 'Google Ads' },
    { value: 'tiktok_ads', label: 'TikTok Ads' },
    { value: 'linkedin_ads', label: 'LinkedIn Ads' },
    { value: 'twitter_ads', label: 'Twitter Ads' },
    { value: 'pinterest_ads', label: 'Pinterest Ads' },
    { value: 'native_ads', label: 'Native Ads' }
  ];

  // Refetch ao voltar da candidatura (garante que "Já se candidatou" apareça)
  useEffect(() => {
    if ((location.state as { fromApply?: boolean })?.fromApply) {
      loadJobs();
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [location.state]);

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      loadJobs();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, filters, page, tab]);

  const loadJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('tab', tab);
      if (searchQuery) params.append('q', searchQuery);
      if (filters.tipo_vaga) params.append('tipo_vaga', filters.tipo_vaga);
      if (filters.pretensao_min) params.append('pretensao_min', filters.pretensao_min);
      if (filters.pretensao_max) params.append('pretensao_max', filters.pretensao_max);
      if (filters.tipo_contratacao) params.append('tipo_contratacao', filters.tipo_contratacao);
      if (filters.modelo_trabalho) params.append('modelo_trabalho', filters.modelo_trabalho);
      if (filters.habilidades.copywriter || filters.habilidades.trafego_pago.length > 0 || filters.habilidades.automacao_ia) {
        const habilidadesObj: any = {};
        if (filters.habilidades.copywriter) habilidadesObj.copywriter = true;
        if (filters.habilidades.trafego_pago.length > 0) habilidadesObj.trafego_pago = filters.habilidades.trafego_pago;
        if (filters.habilidades.automacao_ia) habilidadesObj.automacao_ia = true;
        params.append('habilidades', JSON.stringify(habilidadesObj));
      }
      params.append('page', page.toString());
      params.append('per_page', perPage.toString());

      const res = await api.get<{ jobs: any[], total_vagas: number }>(`/api/tinder-do-fluxo/jobs?${params.toString()}`);
      setJobs(res.jobs || []);
      setTotalVagas(res.total_vagas || 0);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar vagas.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Publicado há menos de 1 hora';
    if (diffHours < 24) return `Publicado há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    return `Publicado há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
  };

  const truncateDescription = (text: string, maxLength: number = 240): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <TinderDoFluxoPageShell title="Vagas">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <GlobalSearch
            placeholder="Buscar vagas por título, empresa, cidade..."
            onSearch={setSearchQuery}
            initialValue={searchQuery}
          />
        </div>
        <Link className="btn btn-outline" to="/tinder-do-fluxo/vagas/minhas-candidaturas">Minhas Candidaturas</Link>
        {(user?.role === 'MENTORADO' || user?.role === 'PRESTADOR' || user?.role === 'LIDERANCA') && (
          <Link className="btn btn-primary" to="/tinder-do-fluxo/vagas/criar">Criar vaga</Link>
        )}
      </div>

      {/* Abas: Em aberto | Encerrado | Minhas vagas */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {(['abertas', 'encerradas', 'minhas'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setSearchParams((p) => {
                const next = new URLSearchParams(p);
                next.set('tab', t);
                return next;
              });
              setPage(1);
            }}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              background: 'none',
              color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: tab === t ? 600 : 400,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            {t === 'abertas' ? 'Em aberto' : t === 'encerradas' ? 'Encerrado' : 'Minhas vagas'}
          </button>
        ))}
      </div>

      {/* Contador de vagas */}
      {!loading && totalVagas > 0 && (
        <div className="card" style={{ marginBottom: 12, padding: 16, background: 'var(--bg-secondary)' }}>
          <strong>
            {tab === 'abertas' && `${totalVagas} vagas em aberto`}
            {tab === 'encerradas' && `${totalVagas} vagas encerradas`}
            {tab === 'minhas' && `${totalVagas} vagas criadas por você`}
          </strong>
        </div>
      )}

      {/* Filtros */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-title" style={{ marginBottom: 16 }}>Filtros</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div className="form-group">
            <label>Tipo da vaga</label>
            <select value={filters.tipo_vaga} onChange={(e) => setFilters({ ...filters, tipo_vaga: e.target.value })}>
              <option value="">Todos</option>
              {tipoVagaOptions.map(opt => (
                <option key={opt} value={opt.toLowerCase()}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Pretensão mínima (R$)</label>
            <input
              type="number"
              placeholder="0"
              value={filters.pretensao_min}
              onChange={(e) => setFilters({ ...filters, pretensao_min: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Pretensão máxima (R$)</label>
            <input
              type="number"
              placeholder="0"
              value={filters.pretensao_max}
              onChange={(e) => setFilters({ ...filters, pretensao_max: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Tipo de contratação</label>
            <select value={filters.tipo_contratacao} onChange={(e) => setFilters({ ...filters, tipo_contratacao: e.target.value })}>
              <option value="">Todos</option>
              {tipoContratacaoOptions.map(opt => (
                <option key={opt} value={opt.toLowerCase()}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Modelo de trabalho</label>
            <select value={filters.modelo_trabalho} onChange={(e) => setFilters({ ...filters, modelo_trabalho: e.target.value })}>
              <option value="">Todos</option>
              {modeloTrabalhoOptions.map(opt => (
                <option key={opt} value={opt.toLowerCase()}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Habilidades */}
        <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Habilidades</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.habilidades.copywriter}
                onChange={(e) => setFilters({
                  ...filters,
                  habilidades: { ...filters.habilidades, copywriter: e.target.checked }
                })}
              />
              <span>✍️ Copywriter</span>
            </label>
            <div>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', marginBottom: 8 }}>
                <input
                  type="checkbox"
                  checked={filters.habilidades.trafego_pago.length > 0}
                  onChange={(e) => {
                    if (!e.target.checked) {
                      setFilters({
                        ...filters,
                        habilidades: { ...filters.habilidades, trafego_pago: [] }
                      });
                    }
                  }}
                />
                <span>📊 Tráfego Pago</span>
              </label>
              {filters.habilidades.trafego_pago.length > 0 && (
                <div style={{ marginLeft: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {trafegoSubcategorias.map(sub => (
                    <label key={sub.value} style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={filters.habilidades.trafego_pago.includes(sub.value)}
                        onChange={(e) => {
                          const newSubs = e.target.checked
                            ? [...filters.habilidades.trafego_pago, sub.value]
                            : filters.habilidades.trafego_pago.filter(s => s !== sub.value);
                          setFilters({
                            ...filters,
                            habilidades: { ...filters.habilidades, trafego_pago: newSubs }
                          });
                        }}
                      />
                      <span>{sub.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.habilidades.automacao_ia}
                onChange={(e) => setFilters({
                  ...filters,
                  habilidades: { ...filters.habilidades, automacao_ia: e.target.checked }
                })}
              />
              <span>🤖 Automação e IA</span>
            </label>
          </div>
        </div>
      </div>

      {/* Listagem de vagas */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div className="loading-spinner" />
          </div>
        ) : error ? (
          <div className="alert alert-error" style={{ display: 'block' }}>{error}</div>
        ) : jobs.length === 0 ? (
          <EmptyState text="Nenhuma vaga encontrada com esses filtros." />
        ) : (
          <>
            <div style={{ display: 'grid', gap: 12 }}>
            {jobs.map((j) => (
                <div key={j.id} className="quick-action" style={{ padding: 16 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{j.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                      {j.empresa || j.creator_name || 'Empresa'} • {j.localizacao || j.location || 'Não especificado'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                      {truncateDescription(j.descricao_resumida || j.description || '', 240)}
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                      {j.tipo_contratacao && <span>{j.tipo_contratacao}</span>}
                      {j.modelo_trabalho && <span>• {j.modelo_trabalho}</span>}
                      {j.valor && <span>• R$ {Number(j.valor).toLocaleString('pt-BR')}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {formatRelativeDate(j.data_publicacao || j.created_at)}
                      </span>
                      {j.applied && (
                        <span
                          style={{
                            fontSize: 12,
                            padding: '4px 10px',
                            background: 'var(--accent-light)',
                            color: 'var(--accent-dark)',
                            borderRadius: 'var(--radius)',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                          title="Você já se candidatou a esta vaga"
                        >
                          ✓ Já se candidatou
                        </span>
                      )}
                    </div>
                </div>
                <Link className="btn btn-outline" to={`/tinder-do-fluxo/vagas/${j.id}`}>Detalhes</Link>
              </div>
            ))}
          </div>
            {/* Paginação */}
            {totalVagas > perPage && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                <button
                  className="btn btn-outline"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                  Página {page} de {Math.ceil(totalVagas / perPage)}
                </span>
                <button
                  className="btn btn-outline"
                  disabled={page >= Math.ceil(totalVagas / perPage)}
                  onClick={() => setPage(p => p + 1)}
                >
                  Próxima
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

export function TinderMatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();
  const currentUser = api.getUser() as { id: string; name: string; photo_url?: string } | null;

  useEffect(() => {
    loadMatches();
  }, []);

  useEffect(() => {
    if (!selectedMatchId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setMessagesLoading(true);
    api.get<{ messages: any[] }>(`/api/tinder-do-fluxo/matches/${selectedMatchId}/messages`)
      .then((r) => {
        if (!cancelled) setMessages(r.messages || []);
      })
      .catch(() => { if (!cancelled) setMessages([]); })
      .finally(() => { if (!cancelled) setMessagesLoading(false); });
    return () => { cancelled = true; };
  }, [selectedMatchId]);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const matchesRes = await api.get<{ matches: any[] }>('/api/tinder-do-fluxo/matches');
      const list = matchesRes.matches || [];
      setMatches(list);
      setSelectedMatchId((prev) => (prev === null && list.length > 0 ? list[0].id : prev));
    } catch (err) {
      console.error('[TinderMatchesPage] Erro ao carregar matches:', err);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedMatch = selectedMatchId ? matches.find((m) => m.id === selectedMatchId) : null;
  const sortedByRecent = [...matches].sort((a, b) => {
    const at = a.lastMessageAt || a.created_at || '';
    const bt = b.lastMessageAt || b.created_at || '';
    return bt.localeCompare(at);
  });

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || !selectedMatchId || sending) return;
    setSending(true);
    setInputValue('');
    try {
      const r = await api.post<{ message: any }>(`/api/tinder-do-fluxo/matches/${selectedMatchId}/messages`, { body: text });
      setMessages((prev) => [...prev, r.message]);
      setMatches((prev) =>
        prev.map((m) =>
          m.id === selectedMatchId
            ? {
                ...m,
                lastMessage: text,
                lastMessageAt: r.message.created_at,
                lastMessageSenderId: currentUser?.id
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
            <div style={{ padding: 24, textAlign: 'center' }}>
              <div className="loading-spinner" />
              <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: 13 }}>Carregando matches...</p>
            </div>
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
                    <div className="status">Online agora</div>
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
                  messages.map((msg) => {
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
                  })
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
