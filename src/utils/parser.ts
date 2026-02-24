import XLSX from 'xlsx';
import Papa from 'papaparse';
import path from 'path';
import type { ParsedCampaign, ParseResult } from '../types';

const COLUMN_MAP: Record<string, string> = {
  'Início dos relatórios': 'report_start',
  'Término dos relatórios': 'report_end',
  'Nome da campanha': 'campaign_name',
  'Veiculação da campanha': 'delivery',
  'Orçamento do conjunto de anúncios': 'adset_budget',
  'Tipo de orçamento do conjunto de anúncios': 'budget_type',
  'Valor usado (BRL)': 'spend',
  'Resultados': 'results',
  'Indicador de resultados': 'result_indicator',
  'Custo por resultados': 'cost_per_result',
  'Alcance': 'reach',
  'Impressões': 'impressions',
  'CTR (taxa de cliques no link)': 'ctr_link',
  'Cliques no link': 'link_clicks',
  'CPC (custo por clique no link) (BRL)': 'cpc',
  'Visualizações da página de destino': 'lp_views',
  'Taxa de visualizações da página de destino por cliques no link': 'lp_rate',
  'Finalizações de compra iniciadas': 'checkouts',
  'Custo por finalização de compra iniciada (BRL)': 'cost_per_checkout',
  'HOOK RATE': 'hook_rate',
  'Compras': 'purchases',
  'Purchases': 'purchases',
  'Compras no site': 'purchases',
  'Website purchases': 'purchases',
};

const EN_ALIASES: Record<string, string> = {
  'Reporting starts': 'report_start',
  'Reporting ends': 'report_end',
  'Campaign name': 'campaign_name',
  'Campaign delivery': 'delivery',
  'Ad set budget': 'adset_budget',
  'Ad set budget type': 'budget_type',
  'Amount spent (BRL)': 'spend',
  'Results': 'results',
  'Result indicator': 'result_indicator',
  'Cost per result': 'cost_per_result',
  'Reach': 'reach',
  'Impressions': 'impressions',
  'CTR (link click-through rate)': 'ctr_link',
  'Link clicks': 'link_clicks',
  'CPC (cost per link click) (BRL)': 'cpc',
  'Landing page views': 'lp_views',
  'Landing page views to link clicks ratio': 'lp_rate',
  'Checkouts initiated': 'checkouts',
  'Cost per checkout initiated (BRL)': 'cost_per_checkout',
  'Hook rate': 'hook_rate',
  'Purchases': 'purchases',
};

const FULL_MAP: Record<string, string> = { ...COLUMN_MAP, ...EN_ALIASES };

function parseNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  let s = String(val).trim();
  s = s.replace(/[R$\s%]/g, '');
  s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function parseSpreadsheetBuffer(fileBuffer: Buffer, originalName: string): ParseResult {
  const ext = path.extname(originalName).toLowerCase();
  let rawRows: Record<string, unknown>[];

  if (ext === '.xlsx') {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  } else {
    const content = fileBuffer.toString('utf-8');
    const result = Papa.parse<Record<string, unknown>>(content, { header: true, skipEmptyLines: true });
    rawRows = result.data;
  }

  if (!rawRows || rawRows.length === 0) {
    return { error: 'Planilha vazia ou sem dados.' };
  }

  const originalHeaders = Object.keys(rawRows[0]);

  const hasCtrTodos = originalHeaders.some(h => h.includes('CTR (Todos)') || h.includes('CTR (All)'));
  const hasCtrLink = originalHeaders.some(h =>
    h.includes('CTR (taxa de cliques no link)') || h.includes('CTR (link click-through rate)')
  );
  if (hasCtrTodos && !hasCtrLink) {
    return {
      error: 'A planilha contém "CTR (Todos)" mas não contém "CTR (taxa de cliques no link)". Por favor, reexporte a planilha incluindo a coluna correta de CTR de cliques no link.'
    };
  }

  const mapped = rawRows.map(row => {
    const obj: Record<string, unknown> = {};
    for (const [origCol, value] of Object.entries(row)) {
      const trimmed = origCol.trim();
      const key = FULL_MAP[trimmed];
      if (key) {
        obj[key] = value;
      }
    }
    return obj;
  });

  const requiredFields = ['campaign_name', 'spend'];
  for (const field of requiredFields) {
    const hasField = mapped.some(r => r[field] !== undefined && r[field] !== '');
    if (!hasField) {
      return { error: `Coluna obrigatória não encontrada: "${field}". Verifique se a planilha está no formato correto do Gerenciador de Anúncios.` };
    }
  }

  const hasPurchases = mapped.some(r => r.purchases !== undefined);

  const campaigns: Record<string, ParsedCampaign & { _ctr_sum: number; _cpc_sum: number; _lp_rate_sum: number; _hook_sum: number; _count: number }> = {};
  for (const row of mapped) {
    const name = (row.campaign_name as string) || 'Sem nome';
    if (!campaigns[name]) {
      campaigns[name] = {
        campaign_name: name,
        spend: 0,
        ctr_link: 0,
        link_clicks: 0,
        lp_views: 0,
        lp_rate: 0,
        checkouts: 0,
        purchases: 0,
        cpc: 0,
        impressions: 0,
        reach: 0,
        hook_rate: 0,
        _ctr_sum: 0,
        _cpc_sum: 0,
        _lp_rate_sum: 0,
        _hook_sum: 0,
        _count: 0
      };
    }
    const c = campaigns[name];
    c.spend += parseNumber(row.spend);
    c.link_clicks += parseNumber(row.link_clicks);
    c.lp_views += parseNumber(row.lp_views);
    c.checkouts += parseNumber(row.checkouts);
    c.purchases += parseNumber(row.purchases);
    c.impressions += parseNumber(row.impressions);
    c.reach += parseNumber(row.reach);
    c._ctr_sum += parseNumber(row.ctr_link);
    c._cpc_sum += parseNumber(row.cpc);
    c._lp_rate_sum += parseNumber(row.lp_rate);
    c._hook_sum += parseNumber(row.hook_rate);
    c._count++;
  }

  const result: ParsedCampaign[] = Object.values(campaigns).map(c => {
    const ctr_raw = c._ctr_sum / c._count;
    c.ctr_link = ctr_raw > 1 ? ctr_raw / 100 : ctr_raw;

    c.cpc = c._cpc_sum / c._count;
    c.hook_rate = c._hook_sum / c._count;

    if (c._lp_rate_sum > 0) {
      const lpRaw = c._lp_rate_sum / c._count;
      c.lp_rate = lpRaw > 1 ? lpRaw / 100 : lpRaw;
    } else if (c.link_clicks > 0) {
      c.lp_rate = c.lp_views / c.link_clicks;
    }

    if (c.purchases > 0 && c.spend > 0) {
      c.cpa = c.spend / c.purchases;
    } else {
      c.cpa = 0;
    }

    const { _ctr_sum, _cpc_sum, _lp_rate_sum, _hook_sum, _count, ...clean } = c;
    return clean;
  });

  return { campaigns: result, hasPurchases };
}

export { parseSpreadsheetBuffer };
