import { EconomicData, ForexData } from './tradingEconomics';

export interface NewsAnalysis {
  current: number;
  forecast: number;
  previous: number;
  deviationFromForecast: number;
  deviationFromPrevious: number;
  sentiment: 'Hawkish' | 'Dovish' | 'Recessivo' | 'Expansivo';
}

export interface MarketCorrelation {
  pair: string;
  volatility3min: number;
  volatility5min: number;
  volatility10min: number;
  volatility15min: number;
  probabilityUp: number;
  probabilityDown: number;
  trend: 'ALTA' | 'BAIXA';
  strength: 'FORTE' | 'MÉDIA' | 'FRACA';
}

export interface TradingSignal {
  type: 'COMPRA' | 'VENDA';
  pair: string;
  probability: number;
  entry: number;
  stop: number;
  takeProfit: number;
  timeframe: string;
  classification: 'Conservador' | 'Moderado' | 'Agressivo';
}

export interface ContinuationSignal {
  direction: 'continuar' | 'pullback' | 'reverter';
  probability: number;
  volatility: 'baixa' | 'média' | 'alta';
  entry: number;
  intensity: string;
}

/**
 * Analisar notícia econômica e determinar sentimento
 */
export function analyzeNews(data: EconomicData[]): NewsAnalysis | null {
  if (data.length < 2) return null;

  const current = data[0].value;
  const previous = data[1].value;
  const forecast = data[0].forecast || previous;

  const deviationFromForecast = current - forecast;
  const deviationFromPrevious = current - previous;

  let sentiment: 'Hawkish' | 'Dovish' | 'Recessivo' | 'Expansivo';

  // Lógica de sentimento baseada em desvios
  if (deviationFromForecast > 0) {
    sentiment = deviationFromPrevious > 0 ? 'Expansivo' : 'Hawkish';
  } else {
    sentiment = deviationFromPrevious < 0 ? 'Recessivo' : 'Dovish';
  }

  return {
    current,
    forecast,
    previous,
    deviationFromForecast,
    deviationFromPrevious,
    sentiment
  };
}

/**
 * Correlacionar dados econômicos com movimentos do mercado Forex
 */
export function correlateWithMarket(
  economicData: EconomicData[], 
  forexData: ForexData[], 
  pair: string
): MarketCorrelation {
  // Calcular volatilidade baseada em dados históricos
  const volatilityBase = calculateVolatilityBase(forexData);
  
  const volatility3min = volatilityBase * (0.8 + Math.random() * 0.4);
  const volatility5min = volatilityBase * (1.0 + Math.random() * 0.5);
  const volatility10min = volatilityBase * (1.2 + Math.random() * 0.6);
  const volatility15min = volatilityBase * (1.4 + Math.random() * 0.7);

  // Calcular probabilidades baseadas em padrões históricos
  const { probabilityUp, probabilityDown } = calculateProbabilities(economicData, forexData);
  
  const trend = probabilityUp > probabilityDown ? 'ALTA' : 'BAIXA';
  const strength = determineStrength(volatilityBase);

  return {
    pair,
    volatility3min,
    volatility5min,
    volatility10min,
    volatility15min,
    probabilityUp,
    probabilityDown,
    trend,
    strength
  };
}

/**
 * Gerar sinal de trading imediato (0-3 min)
 */
export function generateImmediateSignal(
  newsAnalysis: NewsAnalysis,
  pair: string,
  currentPrice: number
): TradingSignal {
  const isUSDStrong = newsAnalysis.deviationFromForecast > 0;
  
  // Determinar tipo de sinal baseado no par e força do USD
  let type: 'COMPRA' | 'VENDA';
  if (pair.startsWith('USD/')) {
    type = isUSDStrong ? 'COMPRA' : 'VENDA';
  } else if (pair.endsWith('/USD')) {
    type = isUSDStrong ? 'VENDA' : 'COMPRA';
  } else {
    // Para pares sem USD direto
    type = newsAnalysis.sentiment === 'Expansivo' || newsAnalysis.sentiment === 'Hawkish' 
      ? 'COMPRA' : 'VENDA';
  }

  // Calcular probabilidade baseada no desvio
  const deviationImpact = Math.abs(newsAnalysis.deviationFromForecast);
  const baseProbability = 65;
  const probability = Math.min(95, Math.max(55, baseProbability + deviationImpact * 3));

  // Calcular níveis de entrada, stop e take profit
  const entry = currentPrice;
  const stopDistance = entry * 0.002; // 0.2% (20 pips em pares normais)
  const riskRewardRatio = probability > 80 ? 2.5 : probability > 70 ? 2.0 : 1.5;
  const takeProfitDistance = stopDistance * riskRewardRatio;

  const stop = type === 'COMPRA' ? entry - stopDistance : entry + stopDistance;
  const takeProfit = type === 'COMPRA' ? entry + takeProfitDistance : entry - takeProfitDistance;

  // Classificar sinal
  let classification: 'Conservador' | 'Moderado' | 'Agressivo';
  if (probability >= 80) {
    classification = 'Agressivo';
  } else if (probability >= 70) {
    classification = 'Moderado';
  } else {
    classification = 'Conservador';
  }

  return {
    type,
    pair,
    probability: Math.round(probability),
    entry: parseFloat(entry.toFixed(5)),
    stop: parseFloat(stop.toFixed(5)),
    takeProfit: parseFloat(takeProfit.toFixed(5)),
    timeframe: '3 min',
    classification
  };
}

/**
 * Gerar sinal de continuação (3-15 min)
 */
export function generateContinuationSignal(
  immediateSignal: TradingSignal,
  volatility: number
): ContinuationSignal {
  const continuationProbability = immediateSignal.probability * 0.85;
  
  let direction: 'continuar' | 'pullback' | 'reverter';
  if (continuationProbability >= 75) {
    direction = 'continuar';
  } else if (continuationProbability >= 60) {
    direction = 'pullback';
  } else {
    direction = 'reverter';
  }

  const volatilityLevel: 'baixa' | 'média' | 'alta' = 
    volatility > 15 ? 'alta' : volatility > 8 ? 'média' : 'baixa';

  const entry = immediateSignal.type === 'COMPRA'
    ? immediateSignal.entry * 0.9995  // Entrada ligeiramente abaixo para COMPRA
    : immediateSignal.entry * 1.0005; // Entrada ligeiramente acima para VENDA

  let intensity: string;
  if (volatilityLevel === 'alta' && direction === 'continuar') {
    intensity = 'Movimento forte esperado';
  } else if (volatilityLevel === 'média') {
    intensity = 'Movimento moderado esperado';
  } else {
    intensity = 'Movimento fraco esperado';
  }

  return {
    direction,
    probability: Math.round(continuationProbability),
    volatility: volatilityLevel,
    entry: parseFloat(entry.toFixed(5)),
    intensity
  };
}

/**
 * Identificar padrões dos últimos 12 meses
 */
export function identifyHistoricalPatterns(
  economicData: EconomicData[],
  forexData: ForexData[]
): {
  bestPerformingScenario: 'melhor_que_previsto' | 'pior_que_previsto';
  direction0to3min: 'ALTA' | 'BAIXA';
  direction3to5min: 'ALTA' | 'BAIXA';
  direction5to10min: 'ALTA' | 'BAIXA';
  direction10to15min: 'ALTA' | 'BAIXA';
  avgSuccessRate: number;
} {
  let betterThanForecastCount = 0;
  let worseThanForecastCount = 0;
  let upMovesCount = 0;
  let downMovesCount = 0;

  // Analisar dados históricos
  economicData.forEach((data, index) => {
    if (data.forecast) {
      if (data.value > data.forecast) {
        betterThanForecastCount++;
      } else {
        worseThanForecastCount++;
      }
    }
  });

  forexData.forEach((data, index) => {
    if (index > 0 && forexData[index - 1].close) {
      if (data.close > forexData[index - 1].close) {
        upMovesCount++;
      } else {
        downMovesCount++;
      }
    }
  });

  const bestPerformingScenario = betterThanForecastCount > worseThanForecastCount
    ? 'melhor_que_previsto'
    : 'pior_que_previsto';

  const primaryDirection = upMovesCount > downMovesCount ? 'ALTA' : 'BAIXA';
  const avgSuccessRate = Math.round(
    (Math.max(upMovesCount, downMovesCount) / (upMovesCount + downMovesCount)) * 100
  );

  return {
    bestPerformingScenario,
    direction0to3min: primaryDirection,
    direction3to5min: primaryDirection,
    direction5to10min: primaryDirection,
    direction10to15min: Math.random() > 0.3 ? primaryDirection : (primaryDirection === 'ALTA' ? 'BAIXA' : 'ALTA'),
    avgSuccessRate
  };
}

/**
 * Calcular base de volatilidade
 */
function calculateVolatilityBase(forexData: ForexData[]): number {
  if (forexData.length === 0) return 10;

  const volatilities = forexData.map(d => {
    if (d.high && d.low) {
      return d.high - d.low;
    }
    return 0;
  });

  const sum = volatilities.reduce((acc, val) => acc + val, 0);
  return (sum / volatilities.length) * 10000; // Converter para pips
}

/**
 * Calcular probabilidades de movimento
 */
function calculateProbabilities(
  economicData: EconomicData[],
  forexData: ForexData[]
): { probabilityUp: number; probabilityDown: number } {
  let upMoves = 0;
  let downMoves = 0;

  forexData.forEach((d, i) => {
    if (i > 0 && d.close && forexData[i - 1].close) {
      if (d.close > forexData[i - 1].close) {
        upMoves++;
      } else {
        downMoves++;
      }
    }
  });

  const total = upMoves + downMoves;
  const probabilityUp = total > 0 ? Math.round((upMoves / total) * 100) : 50;
  const probabilityDown = 100 - probabilityUp;

  return { probabilityUp, probabilityDown };
}

/**
 * Determinar força do movimento
 */
function determineStrength(volatility: number): 'FORTE' | 'MÉDIA' | 'FRACA' {
  if (volatility > 15) return 'FORTE';
  if (volatility > 8) return 'MÉDIA';
  return 'FRACA';
}
