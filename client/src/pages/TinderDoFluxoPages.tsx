import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import TinderDoFluxoPageShell from '../components/tinder-do-fluxo/TinderDoFluxoPageShell';
import { api } from '../services/api';

function EmptyState({ text }: { text: string }) {
  return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{text}</p>;
}

export function TinderComunidadePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get<{ users: any[] }>('/api/tinder-do-fluxo/feed/comunidade')
      .then((r) => setUsers(r.users || []))
      .finally(() => setLoading(false));
  }, []);
  return (
    <TinderDoFluxoPageShell title="Comunidade" subtitle="Conexões mentorado ↔ mentorado">
      <div className="card">
        {loading ? <EmptyState text="Carregando comunidade..." /> : users.length === 0 ? <EmptyState text="Nenhum perfil encontrado." /> : (
          <div style={{ display: 'grid', gap: 10 }}>
            {users.map((u) => (
              <div key={u.id} className="quick-action">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.tinder_mentor_profiles?.city || 'Sem cidade'} • {u.tinder_mentor_profiles?.niche || 'Sem nicho'}</div>
                </div>
                <Link className="btn btn-outline" to={`/tinder-do-fluxo/u/${u.id}`}>Ver perfil</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </TinderDoFluxoPageShell>
  );
}

export function TinderExpertPage() {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    api.get<{ users: any[] }>('/api/tinder-do-fluxo/feed/expert').then((r) => setUsers(r.users || []));
  }, []);
  return (
    <TinderDoFluxoPageShell title="Expert & Coprodutor" subtitle="Parcerias estratégicas">
      <div className="card">
        {users.length === 0 ? <EmptyState text="Nenhum perfil expert/coprodutor encontrado." /> : (
          <div style={{ display: 'grid', gap: 10 }}>
            {users.map((u) => (
              <div key={u.id} className="quick-action">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.tinder_expert_profiles?.goal_text || 'Sem objetivo cadastrado'}</div>
                </div>
                <Link className="btn btn-outline" to={`/tinder-do-fluxo/u/${u.id}`}>Ver perfil</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </TinderDoFluxoPageShell>
  );
}

export function TinderPrestadoresPage() {
  const [services, setServices] = useState<any[]>([]);
  useEffect(() => {
    api.get<{ services: any[] }>('/api/tinder-do-fluxo/services').then((r) => setServices(r.services || []));
  }, []);
  return (
    <TinderDoFluxoPageShell title="Prestadores" subtitle="Diretório por especialidade e avaliação">
      <div className="card">
        {services.length === 0 ? <EmptyState text="Nenhum prestador encontrado." /> : (
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
  const [jobs, setJobs] = useState<any[]>([]);
  useEffect(() => {
    api.get<{ jobs: any[] }>('/api/tinder-do-fluxo/jobs').then((r) => setJobs(r.jobs || []));
  }, []);
  return (
    <TinderDoFluxoPageShell title="Vagas" subtitle="Oportunidades abertas no ecossistema">
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">Vagas abertas</span>
          {(user?.role === 'MENTORADO' || user?.role === 'LIDERANCA') && <Link className="btn btn-primary" to="/tinder-do-fluxo/vagas/criar">Criar vaga</Link>}
        </div>
      </div>
      <div className="card">
        {jobs.length === 0 ? <EmptyState text="Nenhuma vaga cadastrada." /> : (
          <div style={{ display: 'grid', gap: 10 }}>
            {jobs.map((j) => (
              <div key={j.id} className="quick-action">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{j.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{j.specialty || 'Sem especialidade'} • {j.model || 'Sem modelo'}</div>
                </div>
                <Link className="btn btn-outline" to={`/tinder-do-fluxo/vagas/${j.id}`}>Detalhes</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </TinderDoFluxoPageShell>
  );
}

export function TinderJobCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', specialty: '', model: '', location: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await api.post<{ job: { id: number } }>('/api/tinder-do-fluxo/jobs', form);
      // Navegar para a lista de vagas e recarregar
      navigate('/tinder-do-fluxo/vagas', { replace: true });
      // Forçar reload da página para atualizar a lista
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar vaga.');
      setIsSubmitting(false);
    }
  };
  return (
    <TinderDoFluxoPageShell title="Criar vaga">
      <form className="card" onSubmit={submit}>
        <div className="form-group"><label>Título</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
        <div className="form-group"><label>Descrição</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={5} /></div>
        <div className="form-group"><label>Especialidade</label><input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} /></div>
        <div className="form-group"><label>Modelo</label><input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
        <div className="form-group"><label>Local</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
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
  const [job, setJob] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    if (!params.id) return;
    api.get<{ job: any }>(`/api/tinder-do-fluxo/jobs/${params.id}`).then((r) => setJob(r.job));
  }, [params.id]);
  const apply = async () => {
    if (!params.id) return;
    await api.post(`/api/tinder-do-fluxo/jobs/${params.id}/apply`, { message });
    setFeedback('Candidatura enviada.');
  };
  return (
    <TinderDoFluxoPageShell title="Detalhe da vaga">
      {!job ? <div className="card"><EmptyState text="Carregando vaga..." /></div> : (
        <div className="card">
          <h3>{job.title}</h3>
          <p style={{ marginTop: 8 }}>{job.description}</p>
          <div className="form-group" style={{ marginTop: 14 }}>
            <label>Mensagem de candidatura</label>
            <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="button" onClick={apply}>Candidatar-se</button>
          {feedback && <p style={{ marginTop: 8, color: 'var(--green)' }}>{feedback}</p>}
        </div>
      )}
    </TinderDoFluxoPageShell>
  );
}

export function TinderMatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  useEffect(() => {
    api.get<{ matches: any[] }>('/api/tinder-do-fluxo/matches').then((r) => setMatches(r.matches || []));
  }, []);
  return (
    <TinderDoFluxoPageShell title="Matches" subtitle="Conexões confirmadas">
      <div className="card">
        {matches.length === 0 ? <EmptyState text="Você ainda não possui matches." /> : (
          <div style={{ display: 'grid', gap: 8 }}>
            {matches.map((m) => <div key={m.id} className="quick-action">Match #{m.id} • {m.type}</div>)}
          </div>
        )}
      </div>
    </TinderDoFluxoPageShell>
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

export function TinderPerfilPage() {
  const [form, setForm] = useState({ 
    city: '', 
    instagram: '', 
    niche: '', 
    nivelFluxo: '', 
    bio: '', 
    phoneCountryCode: '+55', 
    phoneAreaCode: '', 
    phoneNumber: '' 
  });
  const [saved, setSaved] = useState(false);
  
  const nivelOptions = ['Newbie', 'Soft', 'Hard', 'Pro', 'Pro+', 'Master'];
  const countryCodes = [
    { code: '+55', flag: '🇧🇷', label: 'Brasil (+55)' },
    { code: '+1', flag: '🇺🇸', label: 'EUA/Canadá (+1)' },
    { code: '+351', flag: '🇵🇹', label: 'Portugal (+351)' }
  ];

  useEffect(() => {
    api.get<{ profile: any }>('/api/tinder-do-fluxo/mentor-profile').then((r) => {
      if (!r.profile) return;
      const whatsapp = r.profile.whatsapp || '';
      // Parse existing whatsapp format: +55 11 90000-0000
      const phoneMatch = whatsapp.match(/^(\+\d{1,3})\s?(\d{2})\s?(\d{4,5}-?\d{4})$/);
      setForm({
        city: r.profile.city || '',
        instagram: r.profile.instagram || '',
        niche: r.profile.niche || '',
        nivelFluxo: r.profile.nivel_fluxo || '',
        bio: r.profile.bio || '',
        phoneCountryCode: phoneMatch ? phoneMatch[1] : '+55',
        phoneAreaCode: phoneMatch ? phoneMatch[2] : '',
        phoneNumber: phoneMatch ? phoneMatch[3].replace('-', '') : ''
      });
    });
  }, []);

  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 4) return numbers;
    if (numbers.length <= 8) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 9)}`;
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const whatsapp = `${form.phoneCountryCode} ${form.phoneAreaCode} ${formatPhoneNumber(form.phoneNumber)}`;
    await api.post('/api/tinder-do-fluxo/mentor-profile', {
      ...form,
      whatsapp
    });
    setSaved(true);
  };

  return (
    <TinderDoFluxoPageShell title="Meu Perfil">
      <form className="card" onSubmit={save}>
        <div className="form-group">
          <label>Cidade</label>
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Instagram</label>
          <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Nicho</label>
          <input value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Nível Fluxo</label>
          <select value={form.nivelFluxo} onChange={(e) => setForm({ ...form, nivelFluxo: e.target.value })}>
            <option value="">Selecione...</option>
            {nivelOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Bio</label>
          <textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <div className="form-group">
          <label>WhatsApp</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select 
              value={form.phoneCountryCode} 
              onChange={(e) => setForm({ ...form, phoneCountryCode: e.target.value })}
              style={{ width: '140px' }}
            >
              {countryCodes.map(cc => (
                <option key={cc.code} value={cc.code}>{cc.flag} {cc.code}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="DDD"
              value={form.phoneAreaCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                setForm({ ...form, phoneAreaCode: val });
              }}
              style={{ width: '80px' }}
              maxLength={2}
            />
            <input
              type="text"
              placeholder="Número"
              value={formatPhoneNumber(form.phoneNumber)}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                setForm({ ...form, phoneNumber: val });
              }}
              style={{ flex: 1 }}
              maxLength={10}
            />
          </div>
        </div>
        <button className="btn btn-primary" type="submit">Salvar perfil</button>
        {saved && <p style={{ marginTop: 8, color: 'var(--green)' }}>Perfil salvo com sucesso.</p>}
      </form>
    </TinderDoFluxoPageShell>
  );
}

export function TinderPerfilExpertPage() {
  const [form, setForm] = useState({ isExpert: false, isCoproducer: false, goalText: '', searchBio: '' });
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    api.get<{ profile: any }>('/api/tinder-do-fluxo/expert-profile').then((r) => {
      if (!r.profile) return;
      setForm({
        isExpert: !!r.profile.is_expert,
        isCoproducer: !!r.profile.is_coproducer,
        goalText: r.profile.goal_text || '',
        searchBio: r.profile.search_bio || ''
      });
    });
  }, []);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    await api.post('/api/tinder-do-fluxo/expert-profile', form);
    setSaved(true);
  };
  return (
    <TinderDoFluxoPageShell title="Perfil Expert/Coprodutor">
      <form className="card" onSubmit={save}>
        <label style={{ display: 'flex', gap: 8, marginBottom: 10 }}><input type="checkbox" checked={form.isExpert} onChange={(e) => setForm({ ...form, isExpert: e.target.checked })} /> Quero aparecer como Expert</label>
        <label style={{ display: 'flex', gap: 8, marginBottom: 12 }}><input type="checkbox" checked={form.isCoproducer} onChange={(e) => setForm({ ...form, isCoproducer: e.target.checked })} /> Quero aparecer como Coprodutor</label>
        <div className="form-group"><label>Objetivo</label><input value={form.goalText} onChange={(e) => setForm({ ...form, goalText: e.target.value })} /></div>
        <div className="form-group"><label>Bio de busca</label><textarea rows={4} value={form.searchBio} onChange={(e) => setForm({ ...form, searchBio: e.target.value })} /></div>
        <button className="btn btn-primary" type="submit">Salvar</button>
        {saved && <p style={{ marginTop: 8, color: 'var(--green)' }}>Configuração salva.</p>}
      </form>
    </TinderDoFluxoPageShell>
  );
}

export function TinderMeuPerfilPrestadorPage() {
  const [form, setForm] = useState({ 
    city: '', 
    instagram: '', 
    phoneCountryCode: '+55', 
    phoneAreaCode: '', 
    phoneNumber: '', 
    specialty: '', 
    certification: '', 
    portfolio: '', 
    experience: '', 
    bio: '' 
  });
  const [saved, setSaved] = useState(false);
  
  const specialtyOptions = ['COPY', 'TRAFEGO', 'AUTOMACAO'];
  const countryCodes = [
    { code: '+55', flag: '🇧🇷', label: 'Brasil (+55)' },
    { code: '+1', flag: '🇺🇸', label: 'EUA/Canadá (+1)' },
    { code: '+351', flag: '🇵🇹', label: 'Portugal (+351)' }
  ];

  useEffect(() => {
    api.get<{ profile: any }>('/api/tinder-do-fluxo/service-profile').then((r) => {
      if (!r.profile) return;
      const whatsapp = r.profile.whatsapp || '';
      const phoneMatch = whatsapp.match(/^(\+\d{1,3})\s?(\d{2})\s?(\d{4,5}-?\d{4})$/);
      setForm({
        city: r.profile.city || '',
        instagram: r.profile.instagram || '',
        phoneCountryCode: phoneMatch ? phoneMatch[1] : '+55',
        phoneAreaCode: phoneMatch ? phoneMatch[2] : '',
        phoneNumber: phoneMatch ? phoneMatch[3].replace('-', '') : '',
        specialty: r.profile.specialty || '',
        certification: r.profile.certification || '',
        portfolio: r.profile.portfolio || '',
        experience: r.profile.experience || '',
        bio: r.profile.bio || ''
      });
    });
  }, []);

  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 4) return numbers;
    if (numbers.length <= 8) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 9)}`;
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const whatsapp = `${form.phoneCountryCode} ${form.phoneAreaCode} ${formatPhoneNumber(form.phoneNumber)}`;
    await api.post('/api/tinder-do-fluxo/service-profile', {
      ...form,
      whatsapp
    });
    setSaved(true);
  };

  return (
    <TinderDoFluxoPageShell title="Meu Perfil (Prestador)">
      <form className="card" onSubmit={save}>
        <div className="form-group">
          <label>Cidade</label>
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Instagram</label>
          <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
        </div>
        <div className="form-group">
          <label>WhatsApp</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select 
              value={form.phoneCountryCode} 
              onChange={(e) => setForm({ ...form, phoneCountryCode: e.target.value })}
              style={{ width: '140px' }}
            >
              {countryCodes.map(cc => (
                <option key={cc.code} value={cc.code}>{cc.flag} {cc.code}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="DDD"
              value={form.phoneAreaCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                setForm({ ...form, phoneAreaCode: val });
              }}
              style={{ width: '80px' }}
              maxLength={2}
            />
            <input
              type="text"
              placeholder="Número"
              value={formatPhoneNumber(form.phoneNumber)}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                setForm({ ...form, phoneNumber: val });
              }}
              style={{ flex: 1 }}
              maxLength={10}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Especialidade</label>
          <select value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}>
            <option value="">Selecione...</option>
            {specialtyOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="form-group"><label>Especialidade</label><input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} /></div>
        <div className="form-group"><label>Certificação</label><input value={form.certification} onChange={(e) => setForm({ ...form, certification: e.target.value })} /></div>
        <div className="form-group"><label>Portfólio</label><input value={form.portfolio} onChange={(e) => setForm({ ...form, portfolio: e.target.value })} /></div>
        <div className="form-group"><label>Experiência</label><textarea rows={3} value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} /></div>
        <div className="form-group"><label>Bio</label><textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
        <button className="btn btn-primary" type="submit">Salvar</button>
        {saved && <p style={{ marginTop: 8, color: 'var(--green)' }}>Perfil salvo.</p>}
      </form>
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
  useEffect(() => {
    api.get<{ users: any[] }>('/api/tinder-do-fluxo/admin/users').then((r) => setUsers(r.users || []));
  }, []);
  return (
    <TinderDoFluxoPageShell title="Admin • Usuários">
      <div className="card">
        {users.length === 0 ? <EmptyState text="Nenhum usuário encontrado." /> : users.map((u) => (
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
