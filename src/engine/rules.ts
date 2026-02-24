import type { AnalysisResult, ParsedCampaign } from '../types';

interface AnalyzedResult extends ParsedCampaign {
  scenario: number;
  recommendation: AnalysisResult;
}

interface AnalyzeOptions {
  productType: string;
  hasPreCheckout: boolean;
  hasMoreThan50Sales28d: boolean;
  hasAnyAdvantagePlus: boolean;
  advantagePlusCampaigns: string[];
}

function normalizeName(value: string): string {
  return (value || '').trim().toLowerCase();
}

function detectBudgetStructure(campaignName: string): 'CBO' | 'ABO' {
  const upper = (campaignName || '').toUpperCase();
  return upper.includes('ABO') ? 'ABO' : 'CBO';
}

function isAdvantagePlusCampaign(campaignName: string, selectedCampaigns: string[]): boolean {
  const normalized = normalizeName(campaignName);
  return selectedCampaigns.some((name) => normalizeName(name) === normalized);
}

function analyzeMidTicketCampaign(campaign: ParsedCampaign, productPrice: number, hasPreCheckout: boolean): AnalysisResult {
  const { campaign_name, spend, purchases, cpa, ctr_link, lp_rate, checkouts, lp_views } = campaign;
  const desiredCpa = productPrice * 0.5;

  if (!productPrice || productPrice <= 0) {
    return {
      scenario: 0,
      title: 'Valor do produto necessário',
      message: 'Informe o valor do produto antes de analisar.',
      steps: []
    };
  }

  const requiredMetrics: (keyof ParsedCampaign)[] = ['spend', 'ctr_link', 'link_clicks', 'lp_views', 'checkouts'];
  for (const m of requiredMetrics) {
    if (campaign[m] === undefined || campaign[m] === null) {
      return {
        scenario: 0,
        title: 'Dados insuficientes',
        message: `A métrica "${m}" está ausente para a campanha ${campaign_name}. Reenvie a planilha com todos os dados.`,
        steps: []
      };
    }
  }

  if (purchases > 0 && (cpa ?? 0) <= desiredCpa) {
    return {
      scenario: 1,
      title: 'Campanha vendendo bem — Escalar!',
      message: `Sua campanha ${campaign_name} está funcionando bem! Vamos começar a escalar seguindo os passos abaixo.`,
      steps: [
        'Aumente o investimento diário em 20%.',
        'Crie uma nova campanha usando o mesmo público, mas com novos anúncios (criativos). Defina investimento mínimo de R$15 por conjunto/dia.',
        'Identifique quais públicos trazem melhores resultados.',
        'Analise quais anúncios têm melhor performance e crie novas variações mantendo a mesma mensagem principal.'
      ]
    };
  }

  if (purchases > 0 && (cpa ?? 0) > desiredCpa) {
    return {
      scenario: 2,
      title: 'Vendendo, mas CPA alto — Otimizar',
      message: `Sua campanha ${campaign_name} está gerando vendas, mas o custo por venda está alto. Vamos seguir os passos abaixo para ajustar o desempenho.`,
      steps: [
        'Reduza o orçamento diário em 20%.',
        'Crie nova campanha com o mesmo público e teste novos criativos. Use mínimo R$15 por conjunto/dia.',
        'Identifique públicos e criativos vencedores para otimizações futuras.'
      ]
    };
  }

  if (purchases === 0 && spend > 0) {
    if (ctr_link < 0.01) {
      return {
        scenario: 3,
        title: 'Sem vendas — CTR baixo',
        message: `Desative a campanha ${campaign_name} e crie uma nova campanha com novos anúncios para aumentar o interesse.`,
        steps: [
          'Crie novos criativos (vídeos ou imagens) com ganchos mais fortes.',
          'Teste públicos diferentes.',
          'Use mínimo R$15 por conjunto/dia na nova campanha.'
        ]
      };
    }

    if (lp_rate < 0.60) {
      return {
        scenario: 3,
        title: 'Sem vendas — Página carregando mal',
        message: `A taxa de carregamento da página está baixa para a campanha ${campaign_name}. Tente otimizar a página para que carregue mais rapidamente, pois isso pode estar impactando o desempenho.`,
        steps: [
          'Verifique a velocidade de carregamento da sua página de vendas.',
          'Reduza o tamanho das imagens e vídeos na página.',
          'Teste a página em conexões móveis lentas.',
          'Considere usar uma página mais leve.'
        ]
      };
    }

    const checkoutRate = lp_views > 0 ? checkouts / lp_views : 0;
    const threshold = hasPreCheckout ? 0.10 : 0.15;

    if (checkoutRate < threshold) {
      return {
        scenario: 3,
        title: 'Sem vendas — Taxa de checkout baixa',
        message: `A taxa de finalização de compra está abaixo do esperado para a campanha ${campaign_name}. Recomendo que você compartilhe a página na comunidade do Facebook para receber feedback e otimize a página para torná-la mais atraente e convincente para os visitantes.`,
        steps: [
          'Revise a copy da página de vendas.',
          'Adicione mais provas sociais (depoimentos, resultados).',
          'Simplifique o processo de compra.',
          'Peça feedback na comunidade.'
        ]
      };
    }

    return {
      scenario: 3,
      title: 'Sem vendas — Análise detalhada necessária',
      message: `A campanha ${campaign_name} não gerou vendas. As métricas de tráfego estão dentro do esperado, mas não há conversões. Revise a oferta e a página de vendas.`,
      steps: [
        'Revise sua oferta (preço, bônus, garantia).',
        'Teste uma nova abordagem na página de vendas.',
        'Considere criar uma nova campanha com públicos diferentes.'
      ]
    };
  }

  return {
    scenario: 0,
    title: 'Sem dados suficientes',
    message: `A campanha ${campaign_name} não possui dados suficientes para análise.`,
    steps: []
  };
}

function analyzeLowTicketCampaign(campaign: ParsedCampaign, productPrice: number, options: AnalyzeOptions): AnalysisResult {
  const { campaign_name, spend, purchases, cpa } = campaign;
  const cpaTarget = productPrice * 0.6;
  const cpaValue = cpa || 0;
  const budgetStructure = detectBudgetStructure(campaign_name);
  const hasAdvantagePlus = isAdvantagePlusCampaign(campaign_name, options.advantagePlusCampaigns);

  if (!productPrice || productPrice <= 0) {
    return {
      scenario: 0,
      title: 'Valor do produto necessário',
      message: 'Informe o valor do produto antes de analisar.',
      steps: []
    };
  }

  const diagnostics = [
    'Diagnóstico Geral',
    `Valor do Produto: R$ ${productPrice.toFixed(2).replace('.', ',')}`,
    `CPA Alvo (60%): R$ ${cpaTarget.toFixed(2).replace('.', ',')}`,
    `Compras últimos 28 dias: ${options.hasMoreThan50Sales28d ? 'Mais de 50' : '50 ou menos'}`,
    `Estrutura atual (CBO ou ABO): ${budgetStructure}`,
    `Possui Advantage+ ativa?: ${options.hasAnyAdvantagePlus ? 'Sim' : 'Não'}`,
    'Período analisado: Últimos 7 dias'
  ];

  const nonNegotiables = [
    'Regras Inegociáveis',
    'Sempre considerar últimos 7 dias.',
    'Sempre validar compras dos últimos 28 dias.',
    'Sempre validar se é CBO ou ABO.',
    'Sempre validar se já existe Advantage+.',
    'Nunca misturar estratégias.',
    'Nunca inventar métricas.',
    'Apenas ações executáveis.'
  ];

  if (purchases > 0 && cpaValue <= cpaTarget) {
    const scaleSteps: string[] = [];
    scaleSteps.push('Escalar');
    if (budgetStructure === 'CBO') {
      scaleSteps.push(
        'CBO: aumentar 20% do orçamento da campanha.',
        'CBO: desativar anúncios que não gastaram ou não performaram.',
        'CBO: subir novos anúncios como teste A/B no nível de anúncio.'
      );
    } else {
      scaleSteps.push(
        'ABO: aumentar 20% do orçamento.',
        'ABO: manter apenas conjunto(s) com melhor performance.',
        'ABO: subir novos anúncios como teste A/B no nível de anúncio.'
      );
    }

    scaleSteps.push(
      'Nova Campanha Teste: criar 1 campanha com 1 conjunto e pelo menos 3 criativos com ângulos diferentes.'
    );

    if (options.hasMoreThan50Sales28d && !options.hasAnyAdvantagePlus) {
      scaleSteps.push(
        'Advantage+ (condição 50+): criar 1 campanha CBO do tipo Advantage+.',
        'Advantage+ (condição 50+): usar público comprador + público de engajamento.',
        `Advantage+ (condição 50+): orçamento diário de 50% do valor do produto (R$ ${(productPrice * 0.5).toFixed(2).replace('.', ',')}).`
      );
    }

    if (options.hasAnyAdvantagePlus && hasAdvantagePlus) {
      scaleSteps.push(
        'Como já existe Advantage+ ativa: não criar nova Advantage+.',
        budgetStructure === 'CBO'
          ? 'Aplicar otimização atual (Advantage+ CBO): aumentar 20%, pausar anúncios sem performance e subir novos testes A/B.'
          : 'Aplicar otimização atual (Advantage+ ABO): aumentar 20%, manter conjuntos vencedores e subir novos testes A/B.'
      );
    }

    return {
      scenario: 1,
      title: 'Campanha vendendo bem — Escalar!',
      message: `A campanha ${campaign_name} está dentro do CPA alvo de low ticket.`,
      steps: [
        ...diagnostics,
        ...scaleSteps,
        'Ajustar: sem conjuntos acima do CPA nesta campanha.',
        'Desativar: sem conjuntos para pausar nesta campanha.',
        'Plano de Ação (Passo a Passo): executar escala, criar campanha teste e monitorar por 7 dias.',
        ...nonNegotiables
      ]
    };
  }

  const mustPause = (spend > productPrice && purchases === 0) || (purchases > 0 && cpaValue > productPrice);
  const adjustSteps = [
    'Escalar: não aplicável enquanto estiver acima do CPA alvo.',
    'Ajustar',
    'Reduzir 20% do orçamento.',
    mustPause
      ? 'Desativar: pausar este conjunto (gastou mais que o valor do produto sem venda ou com CPA acima do valor do produto).'
      : 'Desativar: pausar somente conjuntos que gastaram mais que o valor do produto sem venda ou com CPA acima do valor do produto.',
    'Plano de Ação (Passo a Passo): reduzir orçamento, pausar conjuntos fora da regra e reavaliar nos próximos 7 dias.'
  ];

  return {
    scenario: mustPause ? 3 : 2,
    title: mustPause ? 'Conjunto acima do CPA — Desativar' : 'Conjunto acima do CPA — Ajustar',
    message: `A campanha ${campaign_name} está acima do CPA alvo para low ticket e precisa de ajuste.`,
    steps: [...diagnostics, ...adjustSteps, ...nonNegotiables]
  };
}

function analyzeCampaign(campaign: ParsedCampaign, productPrice: number, options: AnalyzeOptions): AnalysisResult {
  if (options.productType === 'low_ticket') {
    return analyzeLowTicketCampaign(campaign, productPrice, options);
  }
  return analyzeMidTicketCampaign(campaign, productPrice, options.hasPreCheckout);
}

function analyzeAllCampaigns(campaigns: ParsedCampaign[], productPrice: number, options: AnalyzeOptions): AnalyzedResult[] {
  return campaigns.map(c => {
    const rec = analyzeCampaign(c, productPrice, options);
    return {
      ...c,
      scenario: rec.scenario,
      recommendation: rec
    };
  });
}

export { analyzeCampaign, analyzeAllCampaigns };
