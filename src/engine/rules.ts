import type { AnalysisResult, ParsedCampaign } from '../types.js';

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

function detectBudgetStructure(_campaignName: string, parsedBudgetStructure?: 'CBO' | 'ABO'): 'CBO' | 'ABO' {
  // Regra low ticket: se não vier "orçamento do conjunto" na planilha, trata como CBO.
  return parsedBudgetStructure ?? 'CBO';
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
  const budgetStructure = detectBudgetStructure(campaign_name, campaign.budget_structure);
  const hasAdvantagePlus = isAdvantagePlusCampaign(campaign_name, options.advantagePlusCampaigns);

  if (!productPrice || productPrice <= 0) {
    return {
      scenario: 0,
      title: 'Valor do produto necessário',
      message: 'Informe o valor do produto antes de analisar.',
      steps: []
    };
  }

  const noSales = purchases <= 0;
  const spentAboveProductWithoutSales = spend > productPrice && purchases <= 0;
  const cpaAboveProduct = purchases > 0 && cpaValue > productPrice;
  const isSemPerformance = noSales || spentAboveProductWithoutSales || cpaAboveProduct;

  if (purchases > 0 && cpaValue <= cpaTarget) {
    const scaleSteps: string[] = budgetStructure === 'CBO'
      ? [
          'Aumentar orçamento da campanha em 20%.',
          'Desativar anúncios que não venderam.',
          'Desativar anúncios com CPA acima do valor do produto.',
          'Subir novos anúncios como Teste A/B a nível de anúncio.'
        ]
      : [
          'Aumentar orçamento do conjunto em 20%.',
          'Manter apenas conjuntos com CPA abaixo de 60% do valor do produto.',
          'Desativar conjuntos que não venderam.',
          'Desativar conjuntos com CPA acima do valor do produto.',
          'Subir novos anúncios como Teste A/B a nível de anúncio.'
        ];

    if (!hasAdvantagePlus) {
      scaleSteps.push(
        'Passo 5: criar nova campanha teste (1 campanha, estrutura CBO, 1 conjunto, mínimo 3 criativos com ângulos diferentes, evitar similaridade).'
      );
    }

    if (!options.hasAnyAdvantagePlus && options.hasMoreThan50Sales28d) {
      scaleSteps.push(
        `Passo 6: subir campaign Advantage+ (estrutura CBO, 1 conjunto, público comprador + engajamento, mínimo 3 criativos diferentes, orçamento diário de 50% do valor do produto: R$ ${(productPrice * 0.5).toFixed(2).replace('.', ',')}).`
      );
    }

    if (hasAdvantagePlus) {
      scaleSteps.push(
        'Campanha já é Advantage+: não criar nova campanha.',
        'Aumentar orçamento em 20% se CPA <= 60% do valor do produto.',
        'Desativar anúncios sem venda.',
        'Desativar anúncios com CPA acima do valor do produto.',
        'Desativar anúncios sem gasto e com CTR abaixo de 1% nos últimos 7 dias.',
        'Se não vendeu e CTR >= 1%, manter ativo.',
        'Subir novos anúncios como Teste A/B.'
      );
    }

    scaleSteps.push(
      'Regra final (últimos 7 dias): desativar qualquer conjunto que gastou mais que o valor do produto sem vender ou com CPA acima do valor do produto.'
    );

    return {
      scenario: 1,
      title: 'Escalar — Campanha vendendo bem — Escalar!',
      message: 'Executar ações abaixo.',
      steps: scaleSteps
    };
  }

  if (isSemPerformance) {
    const conditionParts: string[] = [];
    if (noSales) conditionParts.push('não gerou vendas');
    if (spentAboveProductWithoutSales) conditionParts.push('gastou mais que o valor do produto sem vender');
    if (cpaAboveProduct) conditionParts.push('CPA acima do valor do produto');

    const attentionSteps: string[] = [
      `Baixa performance identificada: ${conditionParts.join('; ')}.`,
      'Desativar conjuntos que gastaram mais que o valor do produto sem vender.',
      'Desativar anúncios que não venderam.',
      'Criar novos criativos com abordagem diferente.',
      'Regra final (últimos 7 dias): desativar qualquer conjunto que gastou mais que o valor do produto sem vender ou com CPA acima do valor do produto.'
    ];

    return {
      scenario: 3,
      title: 'Sem performance — ação imediata',
      message: 'Executar ações abaixo.',
      steps: attentionSteps
    };
  }

  if (purchases > 0 && cpaValue > cpaTarget) {
    const optimizeSteps: string[] = [
      'Reduzir orçamento em 20%.',
      'Desativar anúncios que não venderam.',
      'Desativar anúncios com CPA acima do valor do produto.',
      'Subir novos anúncios como Teste A/B.',
      'Regra final (últimos 7 dias): desativar qualquer conjunto que gastou mais que o valor do produto sem vender ou com CPA acima do valor do produto.'
    ];

    return {
      scenario: 2,
      title: 'Otimizar — Vendendo, mas CPA alto — Otimizar',
      message: 'Executar ações abaixo.',
      steps: optimizeSteps
    };
  }

  return {
    scenario: 0,
    title: 'Sem dados suficientes',
    message: `A campanha ${campaign_name} não possui dados suficientes para análise.`,
    steps: []
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
