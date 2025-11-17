import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const indicator = searchParams.get('indicator') || 'NFP';

  // Simulação de dados do calendário econômico (Investing.com)
  const economicData = generateEconomicData(indicator);
  
  // Análise de pares baseada nos dados econômicos
  const pairAnalyses = generatePairAnalyses(economicData);

  return NextResponse.json({
    newsData: economicData,
    pairAnalyses: pairAnalyses
  });
}

function generateEconomicData(indicator: string) {
  const baseValues: Record<string, { current: number; forecast: number; previous: number }> = {
    'NFP': { current: 256000, forecast: 180000, previous: 165000 },
    'UNEMPLOYMENT': { current: 3.7, forecast: 3.8, previous: 3.9 },
    'PMI_MANUFACTURING': { current: 52.3, forecast: 50.5, previous: 49.8 },
    'PMI_SERVICES': { current: 54.1, forecast: 52.0, previous: 51.5 },
    'FOMC': { current: 5.50, forecast: 5.50, previous: 5.25 },
    'HOUSING_STARTS': { current: 1.42, forecast: 1.35, previous: 1.33 },
    'BUILDING_PERMITS': { current: 1.48, forecast: 1.40, previous: 1.38 },
    'HOUSING_SALES': { current: 4.38, forecast: 4.20, previous: 4.15 },
    'CPI': { current: 3.2, forecast: 3.0, previous: 3.1 },
    'CRUDE_OIL': { current: -2.5, forecast: -1.0, previous: 1.2 },
    'GDP': { current: 2.8, forecast: 2.5, previous: 2.4 }
  };

  const data = baseValues[indicator] || baseValues['NFP'];
  
  // Adicionar variação aleatória para simular dados em tempo real
  const variation = (Math.random() - 0.5) * 0.1;
  const current = data.current + (data.current * variation);
  
  const deviationFromForecast = current - data.forecast;
  const deviationFromPrevious = current - data.previous;

  // Determinar sentimento baseado nos desvios
  let sentiment: 'Hawkish' | 'Dovish' | 'Expansivo' | 'Recessivo';
  
  if (['FOMC', 'CPI'].includes(indicator)) {
    sentiment = deviationFromForecast > 0 ? 'Hawkish' : 'Dovish';
  } else {
    sentiment = deviationFromForecast > 0 ? 'Expansivo' : 'Recessivo';
  }

  return {
    indicator,
    current,
    forecast: data.forecast,
    previous: data.previous,
    deviationFromForecast,
    deviationFromPrevious,
    sentiment,
    timestamp: new Date().toISOString()
  };
}

function generatePairAnalyses(economicData: any) {
  const pairs = ['EUR/USD', 'USD/JPY', 'USD/CHF', 'USD/CAD', 'EUR/JPY', 'CHF/JPY'];
  
  return pairs.map(pair => {
    const isUSDStrong = economicData.deviationFromForecast > 0;
    const impactStrength = Math.abs(economicData.deviationFromForecast / economicData.forecast);
    
    // Determinar direção baseada no par e força do USD
    let signalType: 'COMPRA' | 'VENDA';
    let probabilityUp: number;
    let probabilityDown: number;
    
    if (pair.startsWith('USD/')) {
      // USD é a base
      signalType = isUSDStrong ? 'COMPRA' : 'VENDA';
      probabilityUp = isUSDStrong ? 65 + (impactStrength * 20) : 35 - (impactStrength * 10);
      probabilityDown = 100 - probabilityUp;
    } else if (pair.endsWith('/USD')) {
      // USD é a cotação
      signalType = isUSDStrong ? 'VENDA' : 'COMPRA';
      probabilityUp = isUSDStrong ? 35 - (impactStrength * 10) : 65 + (impactStrength * 20);
      probabilityDown = 100 - probabilityUp;
    } else {
      // Pares cruzados
      signalType = Math.random() > 0.5 ? 'COMPRA' : 'VENDA';
      probabilityUp = 50 + (Math.random() * 20 - 10);
      probabilityDown = 100 - probabilityUp;
    }

    // Calcular volatilidades históricas simuladas
    const baseVolatility = 15 + (impactStrength * 30);
    const volatility3min = baseVolatility * (0.8 + Math.random() * 0.4);
    const volatility5min = baseVolatility * (1.0 + Math.random() * 0.3);
    const volatility10min = baseVolatility * (1.2 + Math.random() * 0.4);
    const volatility15min = baseVolatility * (1.4 + Math.random() * 0.5);

    // Determinar melhor timeframe baseado na volatilidade
    const volatilities = [
      { time: '0-3 min', value: volatility3min },
      { time: '3-5 min', value: volatility5min },
      { time: '5-10 min', value: volatility10min },
      { time: '10-15 min', value: volatility15min }
    ];
    const bestTimeframe = volatilities.reduce((max, curr) => 
      curr.value > max.value ? curr : max
    ).time;

    // Calcular preço base para o par
    const basePrices: Record<string, number> = {
      'EUR/USD': 1.08500,
      'USD/JPY': 149.500,
      'USD/CHF': 0.87500,
      'USD/CAD': 1.36500,
      'EUR/JPY': 162.250,
      'CHF/JPY': 170.850
    };

    const basePrice = basePrices[pair] || 1.0000;
    const priceVariation = (Math.random() - 0.5) * 0.002;
    const currentPrice = basePrice + (basePrice * priceVariation);

    // Calcular níveis de Forex (Pivot Points)
    const high = currentPrice * 1.002;
    const low = currentPrice * 0.998;
    const close = currentPrice;
    
    const pivot = (high + low + close) / 3;
    const resistance1 = (2 * pivot) - low;
    const support1 = (2 * pivot) - high;
    const resistance2 = pivot + (high - low);
    const support2 = pivot - (high - low);
    const resistance3 = high + 2 * (pivot - low);
    const support3 = low - 2 * (high - pivot);

    // Sinal imediato
    const probability = Math.min(95, Math.max(60, 70 + (impactStrength * 25)));
    const entry = currentPrice;
    const pipSize = pair.includes('JPY') ? 0.01 : 0.0001;
    const stop = signalType === 'COMPRA' ? entry - (20 * pipSize) : entry + (20 * pipSize);
    const takeProfit = signalType === 'COMPRA' ? entry + (40 * pipSize) : entry - (40 * pipSize);

    // Classificação de risco
    let classification: 'Conservador' | 'Moderado' | 'Agressivo';
    if (probability >= 80) {
      classification = 'Conservador';
    } else if (probability >= 70) {
      classification = 'Moderado';
    } else {
      classification = 'Agressivo';
    }

    // Sinal de continuação
    const continuationProbability = Math.min(85, probability - 5);
    let direction: 'continuar' | 'pullback' | 'reverter';
    if (continuationProbability >= 70) {
      direction = 'continuar';
    } else if (continuationProbability >= 55) {
      direction = 'pullback';
    } else {
      direction = 'reverter';
    }

    const volatilityLevel: 'baixa' | 'média' | 'alta' = 
      baseVolatility < 20 ? 'baixa' : baseVolatility < 35 ? 'média' : 'alta';

    // Taxa de acerto histórica simulada
    const historicalWinRate = Math.min(92, Math.max(65, 75 + (impactStrength * 15)));
    const totalHistoricalEvents = Math.floor(150 + Math.random() * 100);

    return {
      pair,
      probabilityUp: Math.round(probabilityUp * 10) / 10,
      probabilityDown: Math.round(probabilityDown * 10) / 10,
      strength: impactStrength > 0.15 ? 'forte' : impactStrength > 0.08 ? 'moderado' : 'fraco',
      volatility3min: Math.round(volatility3min * 10) / 10,
      volatility5min: Math.round(volatility5min * 10) / 10,
      volatility10min: Math.round(volatility10min * 10) / 10,
      volatility15min: Math.round(volatility15min * 10) / 10,
      historicalWinRate: Math.round(historicalWinRate * 10) / 10,
      totalHistoricalEvents,
      immediateSignal: {
        type: signalType,
        pair,
        probability: Math.round(probability),
        entry: Math.round(entry * 100000) / 100000,
        stop: Math.round(stop * 100000) / 100000,
        takeProfit: Math.round(takeProfit * 100000) / 100000,
        timeframe: bestTimeframe,
        classification,
        entryTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        stars: 0,
        releaseTime: ''
      },
      continuationSignal: {
        direction,
        probability: Math.round(continuationProbability),
        volatility: volatilityLevel,
        entry: Math.round(currentPrice * 100000) / 100000
      },
      forexLevels: {
        support1: Math.round(support1 * 100000) / 100000,
        support2: Math.round(support2 * 100000) / 100000,
        support3: Math.round(support3 * 100000) / 100000,
        resistance1: Math.round(resistance1 * 100000) / 100000,
        resistance2: Math.round(resistance2 * 100000) / 100000,
        resistance3: Math.round(resistance3 * 100000) / 100000,
        pivot: Math.round(pivot * 100000) / 100000
      }
    };
  });
}
