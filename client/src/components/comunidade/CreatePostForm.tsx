import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemas, useCreatePost } from '../../hooks/useComunidade';
import TinderDoFluxoPageShell from '../tinder-do-fluxo/TinderDoFluxoPageShell';

export default function CreatePostForm() {
  const navigate = useNavigate();
  const { data: temas, isLoading: temasLoading } = useTemas();
  const createPostMutation = useCreatePost();
  
  const [form, setForm] = useState({
    tema_id: '',
    titulo: '',
    conteudo: '',
    media: [] as File[],
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validação mais detalhada
    if (!form.tema_id || form.tema_id.trim() === '') {
      setError('Por favor, selecione um tema.');
      return;
    }

    if (!form.titulo || form.titulo.trim().length === 0) {
      setError('Por favor, preencha o título.');
      return;
    }

    if (!form.conteudo || form.conteudo.trim().length === 0) {
      setError('Por favor, preencha o conteúdo.');
      return;
    }

    // Verificar se tema permite postagem
    const tema = temas?.find((t) => t.id === form.tema_id);
    if (tema && !tema.permite_postagem) {
      setError('Este tema não permite postagens.');
      return;
    }

    try {
      await createPostMutation.mutateAsync({
        tema_id: form.tema_id.trim(),
        titulo: form.titulo.trim(),
        conteudo: form.conteudo.trim(),
        media: form.media.length > 0 ? form.media : undefined,
      });
      
      // Redirecionar para feed
      navigate('/tinder-do-fluxo/comunidade', { replace: true });
    } catch (err: any) {
      console.error('[CreatePostForm] Erro ao criar post:', err);
      setError(err.message || 'Erro ao criar publicação. Tente novamente.');
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setForm({ ...form, media: files });
    }
  };

  const removeMedia = (index: number) => {
    setForm({ ...form, media: form.media.filter((_, i) => i !== index) });
  };

  return (
    <TinderDoFluxoPageShell title="Nova Publicação">
      <form className="card" onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-error visible" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label>Tema <span style={{ color: 'var(--error)' }}>*</span></label>
          {temasLoading ? (
            <div style={{ padding: 12, color: 'var(--text-muted)' }}>Carregando temas...</div>
          ) : (
            <select
              value={form.tema_id}
              onChange={(e) => setForm({ ...form, tema_id: e.target.value })}
              required
              style={{ width: '100%' }}
            >
              <option value="">Selecione um tema...</option>
              {temas?.map((tema) => (
                <option key={tema.id} value={tema.id} disabled={!tema.permite_postagem}>
                  {tema.nome} {!tema.permite_postagem && '(indisponível)'}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-group">
          <label>Título <span style={{ color: 'var(--error)' }}>*</span></label>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Título da publicação"
            required
            maxLength={200}
          />
        </div>

        <div className="form-group">
          <label>Conteúdo <span style={{ color: 'var(--error)' }}>*</span></label>
          <textarea
            value={form.conteudo}
            onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
            placeholder="Escreva sua publicação..."
            required
            rows={15}
            maxLength={5000}
            style={{ 
              width: '100%', 
              minHeight: '300px',
              resize: 'vertical',
              fontFamily: 'inherit',
              fontSize: 'inherit'
            }}
          />
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {form.conteudo.length}/5000 caracteres
          </div>
        </div>

        <div className="form-group">
          <label>Mídia (imagens ou vídeos)</label>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleMediaChange}
            style={{ marginBottom: 8 }}
          />
          {form.media.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {form.media.map((file, index) => (
                <div
                  key={index}
                  style={{
                    padding: 8,
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 12 }}>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    style={{
                      background: 'var(--error)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Você pode adicionar até 10 arquivos (imagens ou vídeos)
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/tinder-do-fluxo/comunidade')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={createPostMutation.isPending}
          >
            {createPostMutation.isPending ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </form>
    </TinderDoFluxoPageShell>
  );
}
