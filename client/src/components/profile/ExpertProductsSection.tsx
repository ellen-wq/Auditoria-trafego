import { useState } from 'react';

interface ExpertProduct {
  id?: string;
  tipo_produto: string;
  preco: number;
  modelo: string;
  nicho?: string;
  publico?: string;
}

interface ExpertProductsSectionProps {
  products: ExpertProduct[];
  onChange: (products: ExpertProduct[]) => void;
}

export function ExpertProductsSection({ products, onChange }: ExpertProductsSectionProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());

  const addProduct = () => {
    const newIndex = products.length;
    onChange([...products, { tipo_produto: '', preco: 0, modelo: '', nicho: '', publico: '' }]);
    setEditingIndex(newIndex);
    setExpandedProducts(new Set([...expandedProducts, newIndex]));
  };

  const updateProduct = (index: number, field: string, value: any) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeProduct = (index: number) => {
    onChange(products.filter((_: any, i: number) => i !== index));
    setEditingIndex(null);
    const newExpanded = new Set(expandedProducts);
    newExpanded.delete(index);
    setExpandedProducts(newExpanded);
  };

  const toggleProduct = (index: number) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
      setEditingIndex(null);
    } else {
      newExpanded.add(index);
      setEditingIndex(index);
    }
    setExpandedProducts(newExpanded);
  };

  const isExpanded = (index: number) => expandedProducts.has(index);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: 14 }}>Produtos</label>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={addProduct}
          style={{ padding: '6px 12px', fontSize: 14 }}
        >
          + Adicionar Produto
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {products.map((product: any, index: number) => {
          const expanded = isExpanded(index);
          const hasName = product.tipo_produto && product.tipo_produto.trim() !== '';

          // Sempre mostrar produtos salvos (com nome), mesmo que não estejam expandidos
          if (hasName && !expanded) {
            return (
              <div 
                key={index} 
                style={{ 
                  padding: '12px 16px', 
                  background: 'var(--bg)', 
                  borderRadius: 'var(--radius)', 
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => toggleProduct(index)}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 4 }}>
                    {product.tipo_produto}
                  </span>
                  {(product.nicho || product.publico) && (
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {[product.nicho, product.publico].filter(Boolean).join(' • ')}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleProduct(index);
                    }}
                    style={{ 
                      padding: '4px 8px', 
                      fontSize: 12, 
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xs)',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Tem certeza que deseja excluir este produto?')) {
                        removeProduct(index);
                      }
                    }}
                    style={{ 
                      padding: '4px 8px', 
                      fontSize: 12,
                      background: '#ef4444', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: 'var(--radius-xs)', 
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div 
              key={index}
              style={{ 
                padding: 16, 
                background: 'var(--bg)', 
                borderRadius: 'var(--radius)', 
                border: '1px solid var(--border)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Produto #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeProduct(index)}
                  style={{ 
                    padding: '4px 8px', 
                    fontSize: 12, 
                    background: 'var(--red-light)',
                    color: 'var(--red)',
                    border: 'none',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer'
                  }}
                >
                  Remover
                </button>
              </div>
              
              <div className="form-group">
                <label>Tipo de Produto</label>
                <input
                  type="text"
                  value={product.tipo_produto || ''}
                  onChange={(e) => updateProduct(index, 'tipo_produto', e.target.value)}
                  placeholder="Ex: Curso de Marketing Digital"
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Preço</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={product.preco || 0}
                    onChange={(e) => updateProduct(index, 'preco', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="form-group">
                  <label>Modelo</label>
                  <select
                    value={product.modelo || ''}
                    onChange={(e) => updateProduct(index, 'modelo', e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    <option value="perpétuo">Perpétuo</option>
                    <option value="lançamento">Lançamento</option>
                    <option value="assinatura">Assinatura</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <div className="form-group">
                  <label>Nicho</label>
                  <input
                    type="text"
                    value={product.nicho || ''}
                    onChange={(e) => updateProduct(index, 'nicho', e.target.value)}
                    placeholder="Ex: Marketing Digital, E-commerce"
                  />
                </div>
                
                <div className="form-group">
                  <label>Público</label>
                  <input
                    type="text"
                    value={product.publico || ''}
                    onChange={(e) => updateProduct(index, 'publico', e.target.value)}
                    placeholder="Ex: Iniciantes, Intermediários"
                  />
                </div>
              </div>
              
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (product.tipo_produto && product.tipo_produto.trim()) {
                      toggleProduct(index);
                    }
                  }}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: 14 }}
                  disabled={!product.tipo_produto || !product.tipo_produto.trim()}
                >
                  Salvar Produto
                </button>
              </div>
            </div>
          );
        })}
        
        {products.length === 0 && (
          <div style={{ 
            padding: 24, 
            textAlign: 'center', 
            color: 'var(--text-muted)', 
            fontSize: 14,
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius)'
          }}>
            Nenhum produto adicionado. Clique em "Adicionar Produto" para começar.
          </div>
        )}
      </div>
    </div>
  );
}
