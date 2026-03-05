export function formatCurrency(val: number): string {
  return 'R$ ' + (val || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatPercent(val: number): string {
  return ((val || 0) * 100).toFixed(2).replace('.', ',') + '%';
}

export function formatDate(str: string | null | undefined): string {
  if (!str) return '-';
  const d = new Date(str);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function escapeHtml(str: string | null | undefined): string {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** Normaliza valor de nível no fluxo para exibição: "pro-plus" / "pro+" → "Pro +". */
export function getNivelFluxoDisplayLabel(raw: string | null | undefined): string {
  if (raw == null || typeof raw !== 'string') return '';
  const n = raw.trim().toLowerCase();
  if (n === 'pro-plus' || n === 'pro+' || n === 'pro +') return 'Pro +';
  return raw.trim() || '';
}
