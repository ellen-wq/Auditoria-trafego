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

const idiomasOptions = ['Português', 'Inglês', 'Espanhol', 'Francês', 'Italiano', 'Alemão'];
const countryCodes = [
  { code: '+55', flag: '🇧🇷', label: 'Brasil (+55)' },
  { code: '+1', flag: '🇺🇸', label: 'EUA/Canadá (+1)' },
  { code: '+351', flag: '🇵🇹', label: 'Portugal (+351)' }
];

export default function ProfileFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const user = api.getUser();
  const { formData, isLoading, save, isSaving, error, tipoUsuario, isExpert, isCoprodutor } = useProfileForm();
  
  // Se abriu via ?edit=true, forçar refetch dos dados
  useEffect(() => {
    if (searchParams.get('edit') === 'true') {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.refetchQueries({ queryKey: ['profile', 'me'] });
    }
  }, [searchParams, queryClient]);
  
  // Valor padrão inicial para evitar null
  const getDefaultFormData = (): ProfileFormData => ({
    headline: '',
    cidade: '',
    whatsapp: '',
    idiomas: [],
    anos_experiencia: 0,
    objetivo: '',
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
        objetivo: formData.objetivo,
        photo_url: formData.photo_url,
        projectsCount: formData.projects?.length || 0,
      });
      
      const currentKey = JSON.stringify({
        headline: localFormData?.headline,
        cidade: localFormData?.cidade,
        bio_busca: localFormData?.bio_busca,
        objetivo: localFormData?.objetivo,
        photo_url: localFormData?.photo_url,
        projectsCount: localFormData?.projects?.length || 0,
      });
      
      // Se já foi inicializado e os dados não mudaram, não atualizar
      if (initializedRef.current && formDataKey === currentKey && currentKey !== JSON.stringify({
        headline: '',
        cidade: '',
        bio_busca: '',
        objetivo: '',
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
      setLocalError('Você deve selecionar pelo menos uma opção: Expert OU Coprodutor (ou ambos).');
      return;
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
      
      // Preparar dados para salvar
      const dataToSave: ProfileFormData = {
        ...localFormData,
        whatsapp,
        isExpert: isExpertChecked,
        isCoprodutor: isCoprodutorChecked,
      };

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
      <form className="card" onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
            <strong>⚠️ Perfil obrigatório:</strong> Você precisa criar seu perfil antes de acessar outras áreas do sistema.
          </p>
        </div>

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
            <label>Headline Profissional</label>
            <input
              type="text"
              value={localFormData?.headline || ''}
              onChange={(e) => updateFormData({ headline: e.target.value })}
              placeholder="Ex: Especialista em Marketing Digital e Automação"
              maxLength={200}
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
            <label>Modelo de Trabalho</label>
            <select
              value={(localFormData as any)?.modelo_trabalho || 'remoto'}
              onChange={(e) => updateFormData({ modelo_trabalho: e.target.value } as any)}
            >
              <option value="remoto">Online</option>
              <option value="presencial">Presencial</option>
              <option value="indiferente">Indiferente</option>
            </select>
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
            <label>Objetivo</label>
            <input
              type="text"
              value={localFormData?.objetivo || ''}
              onChange={(e) => updateFormData({ objetivo: e.target.value })}
              placeholder="Ex: Escalar produto perpétuo"
            />
          </div>
          
          <div className="form-group">
            <label>Bio de Busca</label>
            <textarea
              rows={8}
              style={{ minHeight: '200px', width: '100%', resize: 'vertical', boxSizing: 'border-box' }}
              value={localFormData?.bio_busca || ''}
              onChange={(e) => updateFormData({ bio_busca: e.target.value })}
              placeholder="Descreva o que você busca em parcerias..."
            />
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

        {/* MENTORADO: Checkboxes Expert/Coprodutor dentro do formulário */}
        {tipoUsuario === 'mentorado' && (
          <div style={{ marginBottom: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
              Quero atuar como: <span style={{ color: 'var(--error)' }}>*</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isExpertChecked}
                  onChange={(e) => {
                    setIsExpertChecked(e.target.checked);
                    if (e.target.checked && !localFormData.expert) {
                      updateFormData({
                        expert: {
                          tipo_produto: '',
                          preco: 0,
                          modelo: '',
                          precisa_trafego: false,
                          precisa_coprodutor: false,
                          precisa_copy: false,
                        }
                      });
                    }
                  }}
                />
                <span>Expert</span>
              </label>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isCoprodutorChecked}
                  onChange={(e) => {
                    setIsCoprodutorChecked(e.target.checked);
                    if (e.target.checked && !localFormData.coprodutor) {
                      updateFormData({
                        coprodutor: {
                          faz_trafego: false,
                          faz_lancamento: false,
                          faz_perpetuo: false,
                          ticket_minimo: 0,
                          percentual_minimo: 0,
                          aceita_sociedade: false,
                          aceita_fee_percentual: false,
                        }
                      });
                    }
                  }}
                />
                <span>Coprodutor</span>
              </label>
            </div>
            {(!isExpertChecked && !isCoprodutorChecked) && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--error)' }}>
                Você deve selecionar pelo menos uma opção (Expert OU Coprodutor, ou ambos).
              </div>
            )}
          </div>
        )}

        {/* EXPERT SECTION - Só aparece se Expert estiver marcado */}
        {tipoUsuario === 'mentorado' && isExpertChecked && localFormData.expert && localFormData && (
          <ExpertSection formData={localFormData} onChange={updateFormData} />
        )}

        {/* COPRODUTOR SECTION - Só aparece se Coprodutor estiver marcado */}
        {tipoUsuario === 'mentorado' && isCoprodutorChecked && localFormData.coprodutor && localFormData && (
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
        <button className="btn btn-primary" type="submit" disabled={isSaving} style={{ marginTop: 24, width: '100%' }}>
          {isSaving ? 'Salvando...' : 'Salvar Perfil'}
        </button>
      </form>
    </TinderDoFluxoPageShell>
  );
}
