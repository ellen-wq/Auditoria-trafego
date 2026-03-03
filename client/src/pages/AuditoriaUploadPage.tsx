import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

export default function AuditoriaUploadPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialMode = searchParams.get('modo') === 'planilha' ? 'spreadsheet' : null;
  const [selectedInputMode, setSelectedInputMode] = useState<'spreadsheet' | null>(initialMode);

  const [productPrice, setProductPrice] = useState('');
  const [productType, setProductType] = useState('low_ticket');
  const [hasFunnelStep, setHasFunnelStep] = useState(false);
  const [hasMoreThan50Sales28d, setHasMoreThan50Sales28d] = useState(false);
  const [hasAnyAdvantagePlus, setHasAnyAdvantagePlus] = useState(false);
  const [previewCampaigns, setPreviewCampaigns] = useState<string[]>([]);
  const [selectedAdvantageCampaigns, setSelectedAdvantageCampaigns] = useState<string[]>([]);
  const [selectionStepReady, setSelectionStepReady] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrateMessage, setMigrateMessage] = useState('');

  const handleFile = useCallback((f: File | null) => {
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'csv') {
      setError('Formato inválido. Envie um arquivo .xlsx ou .csv');
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo permitido: 4 MB');
      return;
    }
    setError('');
    setFile(f);
    setSelectionStepReady(false);
    setPreviewCampaigns([]);
    setSelectedAdvantageCampaigns([]);
  }, []);

  useEffect(() => {
    if (productType !== 'low_ticket') {
      setHasAnyAdvantagePlus(false);
      setSelectionStepReady(false);
      setPreviewCampaigns([]);
      setSelectedAdvantageCampaigns([]);
    }
  }, [productType]);

  const toggleAdvantageCampaign = useCallback((campaignName: string, checked: boolean) => {
    setSelectedAdvantageCampaigns((prev) => {
      if (checked) return Array.from(new Set([...prev, campaignName]));
      return prev.filter((name) => name !== campaignName);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0] ?? null);
  }, [handleFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!productPrice || parseFloat(productPrice) <= 0) {
      setError('Informe o valor do produto');
      return;
    }
    if (!file) {
      setError('Selecione um arquivo para enviar');
      return;
    }

    setLoading(true);
    try {
      if (productType === 'low_ticket' && !selectionStepReady) {
        if (hasAnyAdvantagePlus) {
          const previewFormData = new FormData();
          previewFormData.append('file', file);
          const preview = await api.post<{ campaigns: string[] }>('/api/audits/preview-campaigns', previewFormData);
          setPreviewCampaigns(preview.campaigns || []);
          setSelectionStepReady(true);
          return;
        }
      }

      if (productType === 'low_ticket' && hasAnyAdvantagePlus && selectionStepReady && selectedAdvantageCampaigns.length === 0) {
        setError('Selecione pelo menos uma campanha Advantage+ para continuar.');
        return;
      }

      if (productType === 'low_ticket' && !hasAnyAdvantagePlus) {
        setSelectedAdvantageCampaigns([]);
        setSelectionStepReady(false);
        setPreviewCampaigns([]);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('product_price', productPrice);
      formData.append('product_type', productType);
      formData.append('has_funnel_step', String(hasFunnelStep));
      formData.append('has_pre_checkout', String(hasFunnelStep));
      formData.append('has_more_than_50_sales_28d', String(hasMoreThan50Sales28d));
      formData.append('has_any_advantage_plus', String(hasAnyAdvantagePlus));
      formData.append('advantage_plus_campaigns', JSON.stringify(selectedAdvantageCampaigns));

      const result = await api.post<{ id: number }>('/api/audits', formData);
      navigate(`/app/resultado/${result.id}`);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar auditoria');
    } finally {
      setLoading(false);
    }
  };

  const handleRunMigration = useCallback(async () => {
    setMigrateMessage('');
    setMigrating(true);
    try {
      const result = await api.post<{ ok?: boolean; message?: string }>('/api/audits/migrate-to-uuid');
      setMigrateMessage(result?.message || 'Migração concluída. Tente criar a auditoria novamente.');
      setError('');
    } catch (err: any) {
      setMigrateMessage(err.message || 'Falha na migração.');
    } finally {
      setMigrating(false);
    }
  }, []);

  const handleAnyAdvantagePlus = useCallback((checked: boolean) => {
    setHasAnyAdvantagePlus(checked);
    if (!checked) {
      setSelectionStepReady(false);
      setPreviewCampaigns([]);
      setSelectedAdvantageCampaigns([]);
    }
  }, []);

  const handleConnectMetaAds = useCallback(() => {
    navigate('/app/metaads/connect');
  }, [navigate]);

  const handleChooseSpreadsheet = useCallback(() => {
    setSelectedInputMode('spreadsheet');
    setSearchParams({ modo: 'planilha' });
  }, [setSearchParams]);

  const handleBackToModeSelect = useCallback(() => {
    setSelectedInputMode(null);
    setSearchParams({});
  }, [setSearchParams]);

  if (!selectedInputMode) {
    return (
      <AppLayout breadcrumbs={[
        { label: 'Análises', href: '/app/upload' },
        { label: 'Auditoria de Tráfego' },
      ]}>
        <div
          style={{
            minHeight: 'calc(100vh - 220px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: '100%', maxWidth: 980 }}>
            <h1 className="page-title" style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>
              Nova Auditoria de Tráfego
            </h1>
            <p className="page-subtitle" style={{ textAlign: 'center', fontSize: 20, marginBottom: 28 }}>
              Escolha como deseja iniciar a auditoria
            </p>

            <div className="card" style={{ maxWidth: 980, margin: '0 auto', padding: '26px 22px' }}>
              <div className="card-header">
                <span className="card-title" style={{ fontSize: 22 }}>Fonte de dados</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleChooseSpreadsheet}
                  style={{ height: 56, fontSize: 18 }}
                >
                  Usar Planilha
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleConnectMetaAds}
                  style={{ height: 56, fontSize: 18 }}
                >
                  Conectar MetaAds
                </button>
              </div>
              <p style={{ marginTop: 14, fontSize: 15, color: 'var(--text-muted)', textAlign: 'center' }}>
                Em “Usar Planilha”, você envia o arquivo exportado. Em “Conectar MetaAds”, você segue para a tela de conexão com OAuth e visualização do token.
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={[
      { label: 'Análises', href: '/app/upload' },
      { label: 'Auditoria de Tráfego' },
    ]}>
      <h1 className="page-title">Nova Auditoria de Tráfego</h1>
      <p className="page-subtitle">
        Envie a planilha exportada do Gerenciador de Anúncios do Facebook
      </p>

      <div style={{ marginBottom: 14 }}>
        <button type="button" className="btn btn-outline" onClick={handleBackToModeSelect}>
          Voltar
        </button>
      </div>

      <div className={`alert alert-error${error ? ' visible' : ''}`}>{error}</div>
      {error && (
        <div style={{ marginBottom: 12 }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleRunMigration}
            disabled={migrating}
          >
            {migrating ? 'Executando migração...' : 'Corrigir banco de dados (executar migração)'}
          </button>
          {migrateMessage && (
            <p style={{ marginTop: 8, color: 'var(--green)', fontSize: 14 }}>{migrateMessage}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">Configurações</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label htmlFor="productPrice">Valor do Produto (R$)</label>
              <input
                id="productPrice"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="Ex: 97.00"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="productType">Tipo de Produto</label>
              <select
                id="productType"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
              >
                <option value="low_ticket">Low Ticket</option>
                <option value="mid_ticket">Middle Ticket</option>
              </select>
            </div>
          </div>

          {productType === 'low_ticket' ? (
            <div style={{ display: 'grid', gap: 12, marginTop: 8 }}>
              <div className="switch-group">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={hasMoreThan50Sales28d}
                    onChange={(e) => setHasMoreThan50Sales28d(e.target.checked)}
                  />
                  <span className="switch-slider" />
                </label>
                <span style={{ fontSize: 13 }}>
                  Teve mais de 50 vendas nos ultimos 28 dias no Gerenciador de Anúncios
                </span>
              </div>

              <div className="switch-group">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={hasAnyAdvantagePlus}
                    onChange={(e) => handleAnyAdvantagePlus(e.target.checked)}
                  />
                  <span className="switch-slider" />
                </label>
                <span style={{ fontSize: 13 }}>
                  Você já possui alguma campanha Advantage+ ativa?
                </span>
              </div>

              {hasAnyAdvantagePlus && selectionStepReady && (
                <div className="card" style={{ marginTop: 6, padding: 16 }}>
                  <div className="card-header" style={{ marginBottom: 10 }}>
                    <span className="card-title">Selecione as campanhas Advantage+</span>
                  </div>
                  {previewCampaigns.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      Nenhuma campanha encontrada na planilha.
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
                      {previewCampaigns.map((campaignName) => (
                        <label key={campaignName} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                          <input
                            type="checkbox"
                            checked={selectedAdvantageCampaigns.includes(campaignName)}
                            onChange={(e) => toggleAdvantageCampaign(campaignName, e.target.checked)}
                          />
                          <span>{campaignName}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="switch-group" style={{ marginTop: 8 }}>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={hasFunnelStep}
                  onChange={(e) => setHasFunnelStep(e.target.checked)}
                />
                <span className="switch-slider" />
              </label>
              <span style={{ fontSize: 13 }}>
                Sim, meu funil tem uma etapa antes do checkout
              </span>
            </div>
          )}
        </div>

        <div
          className={`upload-area${dragOver ? ' dragover' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 16V4m0 0L8 8m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="upload-text">Arraste o arquivo ou clique para selecionar</p>
          <p className="upload-hint">Formatos aceitos: .xlsx, .csv (máx. 4 MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {file && (
          <div className="file-selected">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            {file.name}
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {productType === 'low_ticket' && hasAnyAdvantagePlus && !selectionStepReady
            ? 'Continuar para selecionar Advantage+'
            : 'Processar Auditoria'}
        </button>
      </form>

      <div className={`loading-overlay${loading ? ' active' : ''}`}>
        <div className="loading-spinner" />
        <p>Processando auditoria, aguarde...</p>
      </div>
    </AppLayout>
  );
}
