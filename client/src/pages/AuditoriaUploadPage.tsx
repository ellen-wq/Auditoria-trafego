import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

export default function AuditoriaUploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [productPrice, setProductPrice] = useState('');
  const [productType, setProductType] = useState('low_ticket');
  const [hasFunnelStep, setHasFunnelStep] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback((f: File | null) => {
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'csv') {
      setError('Formato inválido. Envie um arquivo .xlsx ou .csv');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo permitido: 10MB');
      return;
    }
    setError('');
    setFile(f);
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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('product_price', productPrice);
      formData.append('product_type', productType);
      formData.append('has_funnel_step', String(hasFunnelStep));

      const result = await api.post<{ id: number }>('/api/audits', formData);
      navigate(`/app/resultado?id=${result.id}`);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar auditoria');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout breadcrumbs={[
      { label: 'Análises', href: '/app/upload' },
      { label: 'Auditoria de Tráfego' },
    ]}>
      <h1 className="page-title">Nova Auditoria de Tráfego</h1>
      <p className="page-subtitle">
        Envie a planilha exportada do Gerenciador de Anúncios do Facebook
      </p>

      <div className={`alert alert-error${error ? ' visible' : ''}`}>{error}</div>

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
          <p className="upload-hint">Formatos aceitos: .xlsx, .csv (máx. 10MB)</p>
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
          Processar Auditoria
        </button>
      </form>

      <div className={`loading-overlay${loading ? ' active' : ''}`}>
        <div className="loading-spinner" />
        <p>Processando auditoria, aguarde...</p>
      </div>
    </AppLayout>
  );
}
