import { useNavigate } from 'react-router-dom';

interface ProfileDiscoveryCardProps {
  profile: {
    id: string;
    name: string;
    photo_url?: string;
    isExpert?: boolean;
    isCoprodutor?: boolean;
    /** Objetivo / headline (ex.: "Especialista em Tráfego Pago") - exibido abaixo do nome */
    objective?: string;
    /** Bio - tinder_mentor_profiles.bio */
    bio?: string;
    /** Nicho - tinder_mentor_profiles.niche */
    niche?: string;
    /** Formato = interesses (availability_tags): Projetos, Parcerias, Coprodução, Sociedade */
    formato?: string;
    // Expert fields
    products?: Array<{
      id?: string;
      tipo_produto: string;
      preco: number;
      modelo: string;
      nicho?: string;
    }>;
    needs?: {
      precisa_trafego_pago?: boolean;
      precisa_copy?: boolean;
      precisa_automacoes?: boolean;
      precisa_estrategista?: boolean;
    };
    // Coprodutor fields
    capabilities?: {
      faz_perpetuo?: boolean;
      faz_pico_vendas?: boolean;
      faz_trafego_pago?: boolean;
      faz_copy?: boolean;
      faz_automacoes?: boolean;
    };
    skills?: Array<{
      categoria: string;
      nivel: number;
    }>;
    skillsExtra?: Array<{
      nome: string;
      nivel: number;
    }>;
    projects?: Array<{
      nome: string;
      descricao?: string;
      tags?: string[];
    }>;
  };
  onPass: () => void;
  onMatch: () => void;
  onSwipe?: (direction: 'left' | 'right') => void;
  isSendingInterest?: boolean;
}

const categoriaLabels: Record<string, string> = {
  'copywriter': 'Copywriter',
  'trafego_pago': 'Tráfego Pago',
  'automacao_ia': 'Automação & IA',
};

const needLabels: Record<string, string> = {
  'precisa_trafego_pago': 'Tráfego Pago',
  'precisa_copy': 'Copy',
  'precisa_automacoes': 'Automações',
  'precisa_estrategista': 'Estrategista',
};

const capabilityLabels: Record<string, string> = {
  'faz_perpetuo': 'Perpétuo',
  'faz_pico_vendas': 'Pico de Vendas',
  'faz_trafego_pago': 'Tráfego Pago',
  'faz_copy': 'Copy',
  'faz_automacoes': 'Automações',
};

export default function ProfileDiscoveryCard({
  profile,
  onPass,
  onMatch,
  onSwipe,
  isSendingInterest = false,
}: ProfileDiscoveryCardProps) {
  const navigate = useNavigate();
  const profileType = profile.isExpert
    ? 'Expert'
    : profile.isCoprodutor
    ? 'Coprodutor'
    : '';

  const tags = [
    ...(profile.products?.slice(0, 3).map(p => p.tipo_produto) || []),
    ...(profile.capabilities ? Object.entries(profile.capabilities)
      .filter(([_, v]) => v === true)
      .map(([k]) => capabilityLabels[k] || k)
      .slice(0, 3) : []),
    ...(profile.skills?.map(s => categoriaLabels[s.categoria] || s.categoria).slice(0, 2) || []),
  ].slice(0, 5);
  if (tags.length === 0 && profile.niche) tags.push(profile.niche);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 800 }}>
      <div style={{ position: 'relative', width: '100%', height: 550 }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%) scale(0.90) translateY(-40px)', width: '95%', height: '100%', background: 'var(--bg-white)', borderRadius: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.1)', border: '1px solid var(--expert-slate-200)', zIndex: 5, opacity: 0.3 }} />
        <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%) scale(0.95) translateY(-20px)', width: '98%', height: '100%', background: 'var(--bg-white)', borderRadius: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.1)', border: '1px solid var(--expert-slate-200)', zIndex: 10, opacity: 0.6 }} />
        <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', background: 'var(--bg-white)', borderRadius: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.1)', border: '1px solid var(--expert-slate-200)', overflow: 'hidden', zIndex: 20, display: 'flex', flexDirection: 'row' }}>
          <div style={{ width: '45%', height: '100%', position: 'relative', background: 'var(--expert-slate-200)', backgroundImage: profile.photo_url ? `url(${profile.photo_url})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {!profile.photo_url && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--expert-slate-400)', fontSize: 64, fontWeight: 700 }}>{profile.name.charAt(0).toUpperCase()}</div>
            )}
            <div style={{ position: 'absolute', top: 16, left: 16 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 9999, background: 'var(--expert-primary)', color: '#0f172a', fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>bolt</span>
                95% MATCH
              </span>
            </div>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent 40%, transparent)' }} />
            <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9999, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', color: 'var(--expert-slate-800)', fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--expert-accent-blue)' }}>verified</span>
                Verificado
              </span>
            </div>
          </div>
          <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>{profile.name}</h2>
                {profile.objective && (
                  <p style={{ margin: '4px 0 0 0', fontSize: 14, fontWeight: 700, color: 'var(--expert-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>rocket_launch</span>
                    {profile.objective}
                  </p>
                )}
              </div>
              {profileType && (
                <span style={{ flexShrink: 0, padding: '4px 12px', borderRadius: 6, background: 'rgba(190, 242, 100, 0.2)', border: '1px solid rgba(190, 242, 100, 0.4)', color: 'var(--expert-primary-dark)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{profileType}</span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              {profile.niche && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--expert-slate-400)', margin: '0 0 8px 0' }}>Nicho</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--expert-slate-700)', margin: 0 }}>{profile.niche}</p>
                </div>
              )}
              {profile.formato && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--expert-slate-400)', margin: '0 0 8px 0' }}>Formato</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--expert-slate-700)', margin: 0 }}>{profile.formato}</p>
                </div>
              )}
            </div>
            {profile.bio && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--expert-slate-400)', margin: '0 0 8px 0' }}>Bio</p>
                <p style={{ fontSize: 13, color: 'var(--expert-slate-600)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>&quot;{profile.bio}&quot;</p>
              </div>
            )}
            <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {tags.map((tag, idx) => (
                <span key={idx} style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--expert-background-light)', color: 'var(--expert-slate-600)', fontSize: 12, fontWeight: 700 }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, marginTop: 48, zIndex: 30 }}>
        <button type="button" onClick={onPass} disabled={isSendingInterest} aria-label="Passar" style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid var(--expert-slate-200)', background: 'var(--bg-white)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isSendingInterest ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transition: 'transform 0.15s, background 0.15s' }} onMouseEnter={(e) => { if (!isSendingInterest) { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.transform = 'scale(1.1)'; } }} onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-white)'; e.currentTarget.style.transform = 'scale(1)'; }}>
          <span className="material-symbols-outlined" style={{ fontSize: 28, fontWeight: 700 }}>close</span>
        </button>
        <button type="button" onClick={() => navigate(`/tinder-do-fluxo/profile-view?userId=${profile.id}`)} aria-label="Ver perfil" style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid var(--expert-slate-200)', background: 'var(--bg-white)', color: 'var(--expert-accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transition: 'transform 0.15s, background 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(60, 131, 246, 0.08)'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-white)'; e.currentTarget.style.transform = 'scale(1)'; }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24, fontWeight: 700 }}>star</span>
        </button>
        <button type="button" onClick={onMatch} disabled={isSendingInterest} aria-label="Match" style={{ width: 80, height: 80, borderRadius: '50%', border: 'none', background: 'var(--expert-primary)', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isSendingInterest ? 'not-allowed' : 'pointer', boxShadow: '0 10px 30px rgba(190, 242, 100, 0.4)', transition: 'transform 0.15s, box-shadow 0.15s' }} onMouseEnter={(e) => { if (!isSendingInterest) { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(190, 242, 100, 0.5)'; } }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(190, 242, 100, 0.4)'; }}>
          <span className="material-symbols-outlined" style={{ fontSize: 36, fontWeight: 700, fontVariationSettings: "'FILL' 1" }}>favorite</span>
        </button>
      </div>
    </div>
  );
}
