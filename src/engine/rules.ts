import type { AnalysisResult, ParsedCampaign } from '../types';

interface AnalyzedResult extends ParsedCampaign {
  scenario: number;
  recommendation: AnalysisResult;
}

function analyzeCampaign(campaign: ParsedCampaign, productPrice: number, hasPreCheckout: boolean): AnalysisResult {
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

function analyzeAllCampaigns(campaigns: ParsedCampaign[], productPrice: number, hasPreCheckout: boolean): AnalyzedResult[] {
  return campaigns.map(c => {
    const rec = analyzeCampaign(c, productPrice, hasPreCheckout);
    return {
      ...c,
      scenario: rec.scenario,
      recommendation: rec
    };
  });
}

export { analyzeCampaign, analyzeAllCampaigns };
