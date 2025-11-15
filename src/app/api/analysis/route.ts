import { NextRequest, NextResponse } from 'next/server';

// Simulação de dados históricos dos últimos 12 meses
const generateHistoricalData = (indicator: string) => {
  const baseValue = {
    'NFP': 200000,
    'UNEMPLOYMENT': 3.8,
    'PMI_MANUFACTURING': 52.5,
    'PMI_SERVICES': 54.2,
    'FOMC': 5.25,
    'HOUSING_STARTS': 1450000,
    'BUILDING_PERMITS': 1480000,
    'HOUSING_SALES': 4200000,
    'GDP': 2.5
  }[indicator] || 100;

  const variance = baseValue * 0.05;
  const current = baseValue + (Math.random() - 0.5) * variance;
  const forecast = baseValue + (Math.random() - 0.5) * variance * 0.8;
  const previous = baseValue + (Math.random() - 0.5) * variance * 0.9;

  return { current, forecast, previous };
};

// Análise de sentimento baseada nos desvios
const analyzeSentiment = (deviationFromForecast: number, deviationFromPrevious: number): 'Hawkish' | 'Dovish' | 'Expansivo' | 'Recessivo' => {
  if (deviationFromForecast > 0) {
    return deviationFromPrevious > 0 ? 'Expansivo' : 'Hawkish';
  } else {
    return deviationFromPrevious < 0 ? 'Recessivo' : 'Dovish';
  }
};

// Gerar análise de pares baseada em padrões históricos
const generatePairAnalysis = (newsData: any, pair: string) => {
  const isUSDStrong = newsData.deviationFromForecast > 0;
  const volatilityBase = Math.abs(newsData.deviationFromForecast) * 10;

  // Determinar direção do sinal baseado no par e força do USD
  let signalType: 'COMPRA' | 'VENDA';
  if (pair.startsWith('USD/')) {
    signalType = isUSDStrong ? 'COMPRA' : 'VENDA';
  } else if (pair.endsWith('/USD')) {
    signalType = isUSDStrong ? 'VENDA' : 'COMPRA';
  } else {
    // Para pares sem USD direto (EUR/JPY, CHF/JPY)
    signalType = Math.random() > 0.5 ? 'COMPRA' : 'VENDA';
  }

  const baseProbability = 65 + Math.random() * 20;
  const probability = Math.min(95, Math.max(55, baseProbability + Math.abs(newsData.deviationFromForecast) * 5));

  // Preço base simulado para o par
  const basePrice = {
    'EUR/USD': 1.0850,
    'USD/JPY': 149.50,
    'USD/CHF': 0.8750,
    'USD/CAD': 1.3550,
    'EUR/JPY': 162.30,
    'CHF/JPY': 170.80
  }[pair] || 1.0000;

  const entry = basePrice * (1 + (Math.random() - 0.5) * 0.001);
  const stopDistance = entry * 0.002; // 0.2% stop
  const takeProfitDistance = stopDistance * (1.5 + Math.random()); // 1.5x a 2.5x

  const stop = signalType === 'COMPRA' ? entry - stopDistance : entry + stopDistance;
  const takeProfit = signalType === 'COMPRA' ? entry + takeProfitDistance : entry - takeProfitDistance;

  // Classificação do sinal
  let classification: 'Conservador' | 'Moderado' | 'Agressivo';
  if (probability >= 80) {
    classification = 'Agressivo';
  } else if (probability >= 70) {
    classification = 'Moderado';
  } else {
    classification = 'Conservador';
  }

  // Sinal de continuação
  const continuationProbability = probability * 0.85;
  let direction: 'continuar' | 'pullback' | 'reverter';
  if (continuationProbability >= 75) {
    direction = 'continuar';
  } else if (continuationProbability >= 60) {
    direction = 'pullback';
  } else {
    direction = 'reverter';
  }

  const volatility: 'baixa' | 'média' | 'alta' = 
    volatilityBase > 15 ? 'alta' : volatilityBase > 8 ? 'média' : 'baixa';

  return {
    pair,
    probabilityUp: signalType === 'COMPRA' ? probability : 100 - probability,
    probabilityDown: signalType === 'VENDA' ? probability : 100 - probability,
    strength: volatilityBase > 15 ? 'forte' : volatilityBase > 8 ? 'moderado' : 'fraco',
    volatility3min: volatilityBase * (0.8 + Math.random() * 0.4),
    volatility5min: volatilityBase * (1.0 + Math.random() * 0.5),
    volatility10min: volatilityBase * (1.2 + Math.random() * 0.6),
    volatility15min: volatilityBase * (1.4 + Math.random() * 0.7),
    immediateSignal: {
      type: signalType,
      pair,
      probability: Math.round(probability),
      entry: parseFloat(entry.toFixed(5)),
      stop: parseFloat(stop.toFixed(5)),
      takeProfit: parseFloat(takeProfit.toFixed(5)),
      timeframe: '3 min',
      classification
    },
    continuationSignal: {
      direction,
      probability: Math.round(continuationProbability),
      volatility,
      entry: parseFloat((entry * (1 + (Math.random() - 0.5) * 0.0005)).toFixed(5))
    }
  };
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const indicator = searchParams.get('indicator') || 'NFP';

    // Gerar dados da notícia
    const { current, forecast, previous } = generateHistoricalData(indicator);
    const deviationFromForecast = current - forecast;
    const deviationFromPrevious = current - previous;
    const sentiment = analyzeSentiment(deviationFromForecast, deviationFromPrevious);

    const newsData = {
      indicator,
      current,
      forecast,
      previous,
      deviationFromForecast,
      deviationFromPrevious,
      sentiment,
      timestamp: new Date().toISOString()
    };

    // Gerar análise para cada par
    const pairs = ['EUR/USD', 'USD/JPY', 'USD/CHF', 'USD/CAD', 'EUR/JPY', 'CHF/JPY'];
    const pairAnalyses = pairs.map(pair => generatePairAnalysis(newsData, pair));

    return NextResponse.json({
      newsData,
      pairAnalyses
    });
  } catch (error) {
    console.error('Erro na análise:', error);
    return NextResponse.json(
      { error: 'Erro ao processar análise' },
      { status: 500 }
    );
  }
}
