import { FormEvent, useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TinderDoFluxoPageShell from '../components/tinder-do-fluxo/TinderDoFluxoPageShell';
import { useProfileForm, ProfileFormData } from '../hooks/useProfileFormNew';
import { useQueryClient } from '@tanstack/react-query';
import { ExpertSection } from '../components/profile/ExpertSection';
import { CoprodutorSection } from '../components/profile/CoprodutorSection';
import { PrestadorSection } from '../components/profile/PrestadorSection';
import { SkillsSection } from '../components/profile/SkillsSection';
import { ProjectsSection } from '../components/profile/ProjectsSection';
import { api } from '../services/api';
import { getNivelFluxoDisplayLabel } from '../utils/format';
import { HOBBIES_OPTIONS } from '../constants/registration';

const idiomasOptions = ['Português', 'Inglês', 'Espanhol', 'Francês', 'Italiano', 'Alemão'];
const countryCodes = [
  { code: '+55', flag: '🇧🇷', label: 'Brasil (+55)' },
  { code: '+1', flag: '🇺🇸', label: 'EUA/Canadá (+1)' },
  { code: '+351', flag: '🇵🇹', label: 'Portugal (+351)' }
];

const NIVEL_FLUXO_OPTIONS = [
  { value: 'newbie', label: 'Newbie', desc: '0 vendas' },
  { value: 'soft', label: 'Soft', desc: '1 a 10 mil' },
  { value: 'hard', label: 'Hard', desc: '10 a 100 mil' },
  { value: 'pro', label: 'Pro', desc: '100 mil a 1 milhão' },
  { value: 'Pro +', label: 'Pro +', desc: '1 milhão a 2 milhões' },
  { value: 'master', label: 'Master', desc: '2 milhões +' },
] as const;

export default function ProfileFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const user = api.getUser();
  const { formData, isLoading, save, isSaving, error, tipoUsuario, isExpert, isCoprodutor } = useProfileForm();
  
  // Se abriu via ?edit=true, forçar refetch dos dados (apenas uma vez)
  const hasRefetchedRef = useRef(false);
  useEffect(() => {
    if (searchParams.get('edit') === 'true' && !hasRefetchedRef.current) {
      hasRefetchedRef.current = true;
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.refetchQueries({ queryKey: ['profile', 'me'] });
    }
  }, [searchParams.get('edit')]); // Remover queryClient das dependências
  
  // Valor padrão inicial para evitar null
  const getDefaultFormData = (): ProfileFormData => ({
    headline: '',
    cidade: '',
    whatsapp: '',
    instagram: '',
    nicho: '',
    hobbies: [] as string[],
    idiomas: [],
    anos_experiencia: 0,
    bio_busca: '',
    disponivel: true,
    horas_semanais: 0,
    availability_tags: [],
    modelo_trabalho: 'remoto',
    skills: {},
    skillsExtra: [],
    projects: [],
  });

  const [localFormData, setLocalFormData] = useState<ProfileFormData>(getDefaultFormData());
  const [isExpertChecked, setIsExpertChecked] = useState(false);
  const [isCoprodutorChecked, setIsCoprodutorChecked] = useState(false);
  const initializedRef = useRef(false);
  const uploadingRef = useRef(false);
  
  // Sincronizar formData do hook com estado local
  useEffect(() => {
    if (isLoading) return; // Aguardar carregamento
    
    if (formData) {
      // Criar uma chave única baseada em vários campos para detectar mudanças
      const formDataKey = JSON.stringify({
        headline: formData.headline,
        cidade: formData.cidade,
        bio_busca: formData.bio_busca,
        photo_url: formData.photo_url,
        instagram: formData.instagram,
        nicho: formData.nicho,
        projectsCount: formData.projects?.length || 0,
      });
      
      const currentKey = JSON.stringify({
        headline: localFormData?.headline,
        cidade: localFormData?.cidade,
        bio_busca: localFormData?.bio_busca,
        photo_url: localFormData?.photo_url,
        instagram: localFormData?.instagram,
        nicho: localFormData?.nicho,
        projectsCount: localFormData?.projects?.length || 0,
      });
      
      // Se já foi inicializado e os dados não mudaram, não atualizar
      if (initializedRef.current && formDataKey === currentKey && currentKey !== JSON.stringify({
        headline: '',
        cidade: '',
        bio_busca: '',
        photo_url: '',
        projectsCount: 0,
      })) {
        return;
      }
      
      // Garantir que todos os campos tenham valores padrão
      const defaultFormData: ProfileFormData = {
        ...getDefaultFormData(),
        ...formData,
      };
      setLocalFormData(defaultFormData);
      setIsExpertChecked(formData.isExpert || false);
      setIsCoprodutorChecked(formData.isCoprodutor || false);
      initializedRef.current = true;
    } else if (!initializedRef.current) {
      // Se não tem formData e ainda não foi inicializado, usar padrão
      setLocalFormData(getDefaultFormData());
      initializedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, formData]); // Usar formData completo para detectar mudanças
  
  const updateFormData = (partial: Partial<ProfileFormData>) => {
    setLocalFormData(prev => ({ ...prev, ...partial }));
  };
  
  const [phoneCountryCode, setPhoneCountryCode] = useState('+55');
  const [phoneAreaCode, setPhoneAreaCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [localError, setLocalError] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');

  // Parse WhatsApp quando localFormData carregar
  useEffect(() => {
    if (localFormData?.whatsapp) {
      const whatsapp = localFormData.whatsapp;
      const phoneMatch = whatsapp.match(/^(\+\d{1,3})\s?(\d{2})\s?(\d{4,5}-?\d{4})$/);
      if (phoneMatch) {
        setPhoneCountryCode(phoneMatch[1]);
        setPhoneAreaCode(phoneMatch[2]);
        setPhoneNumber(phoneMatch[3].replace('-', ''));
      }
    }
  }, [localFormData?.whatsapp]);

  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 4) return numbers;
    if (numbers.length <= 8) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 9)}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setLocalSuccess('');
    
    // Validações
    if (tipoUsuario === 'mentorado' && !isExpertChecked && !isCoprodutorChecked) {
      setLocalError('Você deve selecionar uma opção: Expert OU Coprodutor.');
      return;
    }
    
    // Validações específicas para Expert
    if (tipoUsuario === 'mentorado' && isExpertChecked) {
      const expert = localFormData.expert || {};
      const products = (expert as any).products || [];
      const hasProducts = products.length > 0 && products.some((p: any) => p.tipo_produto && p.tipo_produto.trim());
      const hasNeeds = expert.precisa_trafego_pago || expert.precisa_copy || expert.precisa_automacoes || expert.precisa_estrategista;
      
      if (!hasProducts) {
        setLocalError('Como Expert, você deve adicionar pelo menos um produto.');
        return;
      }
      
      if (!hasNeeds) {
        setLocalError('Como Expert, você deve selecionar pelo menos uma necessidade (Tráfego Pago, Copy, Automações ou Estrategista).');
        return;
      }
    }
    
    // Validações específicas para Coprodutor
    if (tipoUsuario === 'mentorado' && isCoprodutorChecked) {
      const coprodutor = localFormData.coprodutor || {};
      const hasCapabilities = coprodutor.faz_perpetuo || coprodutor.faz_pico_vendas || coprodutor.faz_trafego_pago || coprodutor.faz_copy || coprodutor.faz_automacoes;
      
      if (!hasCapabilities) {
        setLocalError('Como Coprodutor, você deve selecionar pelo menos uma capacidade (Faz Perpétuo, Faz Pico de Vendas, Faz Tráfego Pago, Faz Copy ou Faz Automações).');
        return;
      }
    }
    
    // Validar se pelo menos um serviço foi selecionado para prestador
    if (tipoUsuario === 'aluno' && (!localFormData.prestador?.servicos || localFormData.prestador.servicos.length === 0)) {
      setLocalError('Você deve selecionar pelo menos um serviço.');
      return;
    }

    // Validar se pelo menos uma opção de disponibilidade foi selecionada (OBRIGATÓRIO)
    const availabilityTags = localFormData.availability_tags || [];
    if (availabilityTags.length === 0) {
      setLocalError('Você deve selecionar pelo menos uma opção de disponibilidade (Projetos, Parcerias, Coprodução ou Sociedade).');
      return;
    }

    try {
      const whatsapp = `${phoneCountryCode} ${phoneAreaCode} ${formatPhoneNumber(phoneNumber)}`;
      
      // Preparar dados para salvar - garantir que apenas o tipo selecionado tenha dados
      // IMPORTANTE: Preservar produtos existentes
      let expertData = localFormData.expert;
      if (isExpertChecked) {
        // Se expert não existe, criar com estrutura vazia, mas preservar produtos se existirem
        if (!expertData) {
          expertData = {
            products: [],
            precisa_trafego_pago: false,
            precisa_copy: false,
            precisa_automacoes: false,
            precisa_estrategista: false,
          };
        } else {
          // Garantir que products existe e não seja perdido
          expertData = {
            ...expertData,
            products: expertData.products || [],
          };
        }
      }
      
      const dataToSave: ProfileFormData = {
        ...localFormData,
        whatsapp,
        isExpert: isExpertChecked,
        isCoprodutor: isCoprodutorChecked,
        // Limpar dados do tipo não selecionado, mas preservar produtos do expert
        expert: isExpertChecked ? expertData : undefined,
        coprodutor: isCoprodutorChecked ? localFormData.coprodutor : undefined,
      };

      // Debug: verificar se produtos estão sendo incluídos
      if (isExpertChecked && dataToSave.expert) {
        console.log('[ProfileFormPage] Salvando perfil com produtos:', {
          isExpert: isExpertChecked,
          expertExists: !!dataToSave.expert,
          productsCount: (dataToSave.expert.products || []).length,
          products: JSON.stringify(dataToSave.expert.products, null, 2),
          fullExpert: JSON.stringify(dataToSave.expert, null, 2)
        });
      } else {
        console.log('[ProfileFormPage] Salvando perfil SEM produtos:', {
          isExpert: isExpertChecked,
          expertExists: !!dataToSave.expert
        });
      }

      await save(dataToSave);
      
      setLocalSuccess('Perfil salvo com sucesso!');
      
      // Resetar initializedRef para permitir recarregamento quando voltar
      initializedRef.current = false;
      
      // Aguardar um pouco para garantir que o cache foi atualizado
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Redirecionar para visualização
      navigate('/tinder-do-fluxo/profile-view', { replace: true });
    } catch (err: any) {
      console.error('[ProfileForm] Erro ao salvar:', err);
      setLocalError(err.message || 'Erro ao salvar perfil. Tente novamente.');
    }
  };

  // Mostrar mensagem de carregamento apenas enquanto carrega inicialmente
  if (isLoading && !initializedRef.current) {
    return (
      <TinderDoFluxoPageShell title="Meu Perfil">
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-secondary)' }}>Carregando perfil...</p>
        </div>
      </TinderDoFluxoPageShell>
    );
  }

  if (user?.role === 'LIDERANCA') {
    return (
      <TinderDoFluxoPageShell title="Meu Perfil">
        <div className="card">
          <div style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>
              Como Liderança, você não precisa criar um perfil. Você tem acesso total ao sistema.
            </p>
          </div>
        </div>
      </TinderDoFluxoPageShell>
    );
  }

  return (
    <TinderDoFluxoPageShell title="Meu Perfil">
      <div className="perfil-mentorado-page">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 40 }}>
          <div>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em', margin: 0 }}>Perfil do Mentorado</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: 14 }}>Gerencie suas informações no ecossistema Fluxer</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/tinder-do-fluxo/profile-view')} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>visibility</span>
              Ver como outros veem
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="perfil-mentorado-card">
        {/* DADOS BÁSICOS */}
        <div style={{ marginBottom: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Dados Básicos</h3>

          {/* Avatar */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ flexShrink: 0 }}>
              {localFormData.photo_url ? (
                <img
                  src={localFormData.photo_url}
                  alt={user?.name || 'Avatar'}
                  style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
                />
              ) : (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'var(--bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    border: '2px solid var(--border)',
                    fontSize: 24,
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>Foto de perfil</label>
              <input
                type="file"
                accept="image/*"
                disabled={uploadingRef.current}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || uploadingRef.current) return;
                  
                  // Validar tamanho (5MB)
                  if (file.size > 5 * 1024 * 1024) {
                    setLocalError('Arquivo muito grande. Máximo: 5MB.');
                    return;
                  }
                  
                  uploadingRef.current = true;
                  setLocalError('');
                  
                  try {
                    const formDataUpload = new FormData();
                    formDataUpload.append('avatar', file);
                    
                    const res = await api.post<{ url: string }>('/api/tinder-do-fluxo/profile/avatar', formDataUpload);
                    
                    if (res && res.url) {
                      updateFormData({ photo_url: res.url });
                      setLocalSuccess('Foto atualizada com sucesso!');
                    } else {
                      throw new Error('Resposta inválida do servidor');
                    }
                  } catch (err: any) {
                    console.error('[ProfileForm] Erro ao fazer upload do avatar:', err);
                    setLocalError(err.message || 'Erro ao fazer upload da foto. Tente novamente.');
                  } finally {
                    uploadingRef.current = false;
                    // Limpar o input para permitir selecionar o mesmo arquivo novamente
                    e.target.value = '';
                  }
                }}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                PNG ou JPG, até 5MB.
              </small>
            </div>
          </div>

          <div className="form-group">
            <label>Nome</label>
            <input value={user?.name || ''} disabled style={{ background: 'var(--bg)', opacity: 0.7 }} />
            <small style={{ color: 'var(--text-muted)', fontSize: 12 }}>Nome não pode ser alterado</small>
          </div>
          
          <div className="form-group">
            <label>Objetivo de parceria</label>
            <input
              type="text"
              value={localFormData?.headline || ''}
              onChange={(e) => updateFormData({ headline: e.target.value })}
              placeholder="Ex: Escalar meu negócio e criar parcerias estratégicas"
              maxLength={400}
            />
          </div>
          
          <div className="form-group">
            <label>Cidade</label>
            <input
              type="text"
              value={localFormData?.cidade || ''}
              onChange={(e) => updateFormData({ cidade: e.target.value })}
              placeholder="Ex: São Paulo, SP"
            />
          </div>
          <div className="form-group">
            <label>Instagram</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 500 }}>@</span>
              <input
                type="text"
                value={localFormData?.instagram || ''}
                onChange={(e) => updateFormData({ instagram: e.target.value })}
                placeholder="usuario"
                style={{ paddingLeft: 28, width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', fontSize: 14 }}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Nicho</label>
            <input
              type="text"
              value={localFormData?.nicho || ''}
              onChange={(e) => updateFormData({ nicho: e.target.value })}
              placeholder="Ex: Tráfego Pago, E-commerce"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', fontSize: 14 }}
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: 8 }}>Hobbies (pode selecionar vários)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 16px' }}>
              {HOBBIES_OPTIONS.map((h) => {
                const hobbiesList = Array.isArray(localFormData?.hobbies) ? localFormData.hobbies : (localFormData?.hobbies ? String(localFormData.hobbies).split(',').map(s => s.trim()).filter(Boolean) : []);
                const checked = hobbiesList.includes(h);
                return (
                  <label key={h} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const current = Array.isArray(localFormData?.hobbies) ? localFormData.hobbies : (localFormData?.hobbies ? String(localFormData.hobbies).split(',').map(s => s.trim()).filter(Boolean) : []);
                        const next = e.target.checked ? [...current, h] : current.filter((x) => x !== h);
                        updateFormData({ hobbies: next });
                      }}
                      style={{ margin: 0, cursor: 'pointer', width: 18, height: 18, accentColor: 'var(--accent-dark)' }}
                    />
                    <span>{h}</span>
                  </label>
                );
              })}
            </div>
          </div>
          {tipoUsuario === 'mentorado' && (
            <div className="form-group">
              <label>Nível no Fluxo</label>
              <select
                value={getNivelFluxoDisplayLabel((localFormData as any)?.nivel_fluxo_label) || ''}
                onChange={(e) => updateFormData({ nivel_fluxo_label: e.target.value } as Partial<ProfileFormData>)}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', fontSize: 14 }}
              >
                <option value="">Selecione</option>
                {NIVEL_FLUXO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label} – {opt.desc}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <label>WhatsApp</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={phoneCountryCode}
                onChange={(e) => setPhoneCountryCode(e.target.value)}
                style={{ width: '140px' }}
              >
                {countryCodes.map(cc => (
                  <option key={cc.code} value={cc.code}>{cc.flag} {cc.code}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="DDD"
                value={phoneAreaCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                  setPhoneAreaCode(val);
                }}
                style={{ width: '80px' }}
                maxLength={2}
              />
              <input
                type="text"
                placeholder="Número"
                value={formatPhoneNumber(phoneNumber)}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                  setPhoneNumber(val);
                }}
                style={{ flex: 1 }}
                maxLength={10}
              />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>Anos de Experiência</label>
              <input
                type="number"
                min="0"
                max="50"
                value={localFormData?.anos_experiencia || 0}
                onChange={(e) => updateFormData({ anos_experiencia: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
            <div className="form-group">
              <label>Horas Semanais Disponíveis</label>
              <input
                type="number"
                min="0"
                max="168"
                value={localFormData?.horas_semanais || 0}
                onChange={(e) => updateFormData({ horas_semanais: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Idiomas</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {idiomasOptions.map(idioma => (
                <label key={idioma} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={(localFormData?.idiomas || []).includes(idioma)}
                    onChange={(e) => {
                      const currentIdiomas = localFormData?.idiomas || [];
                      if (e.target.checked) {
                        updateFormData({ idiomas: [...currentIdiomas, idioma] });
                      } else {
                        updateFormData({ idiomas: currentIdiomas.filter(i => i !== idioma) });
                      }
                    }}
                  />
                  <span>{idioma}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* SOBRE */}
        <div style={{ marginBottom: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Sobre</h3>
          
          <div className="form-group">
            <label>Bio</label>
            <textarea
              rows={4}
              maxLength={250}
              style={{ minHeight: '120px', width: '100%', resize: 'vertical', boxSizing: 'border-box' }}
              value={localFormData?.bio_busca || ''}
              onChange={(e) => updateFormData({ bio_busca: e.target.value })}
              placeholder="Conte um pouco sobre sua jornada e o que você busca no ecossistema..."
            />
            <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'right', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Máximo 250 caracteres</p>
          </div>
        </div>

        {/* DISPONIBILIDADE */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 600 }}>
            Disponibilidade
          </h3>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'block', marginBottom: 12, fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
              Disponível para: <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              alignItems: 'flex-start'
            }}>
              {[
                { key: 'projetos', label: 'Projetos' },
                { key: 'parcerias', label: 'Parcerias' },
                { key: 'coproducao', label: 'Coprodução' },
                { key: 'sociedade', label: 'Sociedade' },
              ].map((opt) => {
                const current = localFormData.availability_tags || [];
                const checked = current.includes(opt.key);
                return (
                  <label 
                    key={opt.key} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 10, 
                      cursor: 'pointer', 
                      fontSize: 14,
                      width: '100%'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...current, opt.key]
                          : current.filter((v) => v !== opt.key);
                        updateFormData({ availability_tags: next });
                      }}
                      style={{ 
                        margin: 0, 
                        cursor: 'pointer',
                        width: '18px',
                        height: '18px',
                        flexShrink: 0
                      }}
                    />
                    <span style={{ fontWeight: checked ? 500 : 400 }}>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* MENTORADO: Radio buttons Expert/Coprodutor (mutuamente exclusivos) */}
        {tipoUsuario === 'mentorado' && (
          <div style={{ marginBottom: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
              Quero atuar como: <span style={{ color: 'var(--error)' }}>*</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="tipo-mentorado"
                  checked={isExpertChecked}
                  onChange={(e) => {
                    setIsExpertChecked(true);
                    setIsCoprodutorChecked(false);
                    // Limpar coprodutor completamente e garantir que expert existe
                    const currentExpert = localFormData.expert || {
                      products: [],
                      precisa_trafego_pago: false,
                      precisa_copy: false,
                      precisa_automacoes: false,
                      precisa_estrategista: false,
                    };
                    updateFormData({ 
                      coprodutor: undefined,
                      expert: currentExpert,
                      isExpert: true,
                      isCoprodutor: false
                    });
                  }}
                />
                <span>Expert</span>
              </label>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="tipo-mentorado"
                  checked={isCoprodutorChecked}
                  onChange={(e) => {
                    setIsCoprodutorChecked(true);
                    setIsExpertChecked(false);
                    // Limpar expert completamente e garantir que coprodutor existe
                    const currentCoprodutor = localFormData.coprodutor || {
                      faz_perpetuo: false,
                      faz_pico_vendas: false,
                      faz_trafego_pago: false,
                      faz_copy: false,
                      faz_automacoes: false,
                    };
                    updateFormData({ 
                      expert: undefined,
                      coprodutor: currentCoprodutor,
                      isExpert: false,
                      isCoprodutor: true
                    });
                  }}
                />
                <span>Coprodutor</span>
              </label>
            </div>
            {(!isExpertChecked && !isCoprodutorChecked) && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--error)' }}>
                Você deve selecionar uma opção: Expert OU Coprodutor.
              </div>
            )}
          </div>
        )}

        {/* EXPERT SECTION - Só aparece se Expert estiver marcado */}
        {tipoUsuario === 'mentorado' && isExpertChecked && (
          <ExpertSection formData={localFormData} onChange={updateFormData} />
        )}

        {/* COPRODUTOR SECTION - Só aparece se Coprodutor estiver marcado */}
        {tipoUsuario === 'mentorado' && isCoprodutorChecked && (
          <CoprodutorSection formData={localFormData} onChange={updateFormData} />
        )}

        {/* PRESTADOR SECTION (ALUNO) */}
        {tipoUsuario === 'aluno' && localFormData.prestador && localFormData && (
          <PrestadorSection formData={localFormData} onChange={updateFormData} />
        )}

        {/* HABILIDADES */}
        {localFormData && (
          <SkillsSection formData={localFormData} onChange={updateFormData} />
        )}

        {/* PROJETOS */}
        {localFormData && (
          <ProjectsSection formData={localFormData} onChange={updateFormData} />
        )}

        {/* ERROS E SUCESSO */}
        {(localError || error) && (
          <div className="alert alert-error" style={{ marginTop: 16, display: 'block' }}>
            {localError || (error as any)?.message || 'Erro ao salvar perfil'}
          </div>
        )}
        
        {localSuccess && (
          <div style={{
            marginTop: 16,
            padding: 12,
            background: 'var(--green)',
            color: 'white',
            borderRadius: 'var(--radius)',
            fontSize: 14,
            fontWeight: 500
          }}>
            ✓ {localSuccess}
            <div style={{ marginTop: 12 }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  navigate('/tinder-do-fluxo/profile-view', { replace: true });
                  setTimeout(() => {
                    if (window.location.pathname !== '/tinder-do-fluxo/profile-view') {
                      window.location.href = '/tinder-do-fluxo/profile-view';
                    }
                  }, 100);
                }}
                style={{ background: 'white', color: 'var(--green)', border: 'none' }}
              >
                Ver meu perfil →
              </button>
            </div>
          </div>
        )}

        {/* BOTÃO SALVAR */}
        <div style={{ marginTop: 48, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" type="submit" disabled={isSaving} style={{ minWidth: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>save</span>
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
          </div>

          <div style={{ marginTop: 32, padding: 24, background: 'rgba(163, 230, 53, 0.08)', borderRadius: '1rem', border: '1px solid rgba(163, 230, 53, 0.25)', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 28 }}>info</span>
            <div>
              <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Mantenha seu perfil atualizado</h4>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Perfis completos e atualizados têm 3x mais chances de encontrar a conexão ideal no Fluxo.</p>
            </div>
          </div>
        </form>
      </div>
    </TinderDoFluxoPageShell>
  );
}
