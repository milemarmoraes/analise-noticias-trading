import axios from 'axios';

const API_KEY = process.env.TRADING_ECONOMICS_API_KEY || 'guest:guest';
const BASE_URL = 'https://api.tradingeconomics.com';

export interface EconomicData {
  date: string;
  value: number;
  previous?: number;
  forecast?: number;
  country?: string;
  category?: string;
}

export interface ForexData {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
}

export interface HistoricalPattern {
  indicator: string;
  avgVolatility3min: number;
  avgVolatility5min: number;
  avgVolatility10min: number;
  avgVolatility15min: number;
  successRateUp: number;
  successRateDown: number;
}

/**
 * Buscar dados econômicos históricos (últimos 12 meses)
 */
export async function getEconomicIndicator(
  indicator: string, 
  country: string = 'united states'
): Promise<EconomicData[]> {
  try {
    const url = `${BASE_URL}/historical/country/${encodeURIComponent(country)}/indicator/${encodeURIComponent(indicator)}`;
    const response = await axios.get(url, {
      params: { 
        c: API_KEY,
        d1: getDateMonthsAgo(12),
        d2: getCurrentDate()
      },
      timeout: 10000
    });
    
    return response.data.slice(0, 12);
  } catch (error) {
    console.error('Erro ao buscar dados econômicos:', error);
    return [];
  }
}

/**
 * Buscar dados de Forex históricos
 */
export async function getForexData(symbol: string): Promise<ForexData[]> {
  try {
    const url = `${BASE_URL}/markets/symbol/${symbol}`;
    const response = await axios.get(url, {
      params: { 
        c: API_KEY,
        d1: getDateMonthsAgo(12),
        d2: getCurrentDate()
      },
      timeout: 10000
    });
    
    return response.data.slice(0, 12);
  } catch (error) {
    console.error('Erro ao buscar dados Forex:', error);
    return [];
  }
}

/**
 * Buscar múltiplos indicadores de uma vez
 */
export async function getMultipleIndicators(
  indicators: string[], 
  country: string = 'united states'
): Promise<Record<string, EconomicData[]>> {
  const results: Record<string, EconomicData[]> = {};
  
  await Promise.all(
    indicators.map(async (indicator) => {
      const data = await getEconomicIndicator(indicator, country);
      results[indicator] = data;
    })
  );
  
  return results;
}

/**
 * Analisar padrões históricos de volatilidade após anúncios
 */
export async function analyzeHistoricalPatterns(
  indicator: string,
  forexPair: string
): Promise<HistoricalPattern | null> {
  try {
    const economicData = await getEconomicIndicator(indicator);
    const forexData = await getForexData(forexPair);
    
    if (economicData.length === 0 || forexData.length === 0) {
      return null;
    }
    
    // Calcular volatilidade média em diferentes timeframes
    // Esta é uma simulação - em produção, você correlacionaria timestamps exatos
    const avgVolatility3min = calculateAverageVolatility(forexData, 3);
    const avgVolatility5min = calculateAverageVolatility(forexData, 5);
    const avgVolatility10min = calculateAverageVolatility(forexData, 10);
    const avgVolatility15min = calculateAverageVolatility(forexData, 15);
    
    // Calcular taxa de sucesso baseada em movimentos históricos
    const { successRateUp, successRateDown } = calculateSuccessRates(economicData, forexData);
    
    return {
      indicator,
      avgVolatility3min,
      avgVolatility5min,
      avgVolatility10min,
      avgVolatility15min,
      successRateUp,
      successRateDown
    };
  } catch (error) {
    console.error('Erro ao analisar padrões históricos:', error);
    return null;
  }
}

/**
 * Calcular volatilidade média
 */
function calculateAverageVolatility(data: ForexData[], minutes: number): number {
  if (data.length === 0) return 0;
  
  const volatilities = data.map(d => {
    if (d.high && d.low) {
      return d.high - d.low;
    }
    return 0;
  });
  
  const sum = volatilities.reduce((acc, val) => acc + val, 0);
  return (sum / volatilities.length) * (minutes / 5); // Ajuste proporcional ao timeframe
}

/**
 * Calcular taxas de sucesso históricas
 */
function calculateSuccessRates(
  economicData: EconomicData[], 
  forexData: ForexData[]
): { successRateUp: number; successRateDown: number } {
  let upMoves = 0;
  let downMoves = 0;
  
  // Análise simplificada - em produção, correlacionar timestamps exatos
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
  return {
    successRateUp: total > 0 ? (upMoves / total) * 100 : 50,
    successRateDown: total > 0 ? (downMoves / total) * 100 : 50
  };
}

/**
 * Utilitários de data
 */
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateMonthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().split('T')[0];
}

/**
 * Mapeamento de indicadores para a API do Trading Economics
 */
export const INDICATORS = {
  NFP: 'Non Farm Payrolls',
  UNEMPLOYMENT: 'Unemployment Rate',
  PMI_MANUFACTURING: 'Manufacturing PMI',
  PMI_SERVICES: 'Services PMI',
  HOUSING_STARTS: 'Housing Starts',
  BUILDING_PERMITS: 'Building Permits',
  HOUSING_SALES: 'Existing Home Sales',
  GDP: 'GDP Annual Growth Rate',
  FOMC: 'Interest Rate'
};

/**
 * Pares de Forex suportados
 */
export const FOREX_PAIRS = {
  'EUR/USD': 'EURUSD:CUR',
  'USD/JPY': 'USDJPY:CUR',
  'USD/CHF': 'USDCHF:CUR',
  'USD/CAD': 'USDCAD:CUR',
  'EUR/JPY': 'EURJPY:CUR',
  'CHF/JPY': 'CHFJPY:CUR'
};

/**
 * Buscar dados em tempo real de um indicador específico
 */
export async function getRealTimeIndicator(indicator: string): Promise<EconomicData | null> {
  try {
    const url = `${BASE_URL}/country/${encodeURIComponent('united states')}/${encodeURIComponent(indicator)}`;
    const response = await axios.get(url, {
      params: { c: API_KEY },
      timeout: 5000
    });
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar dados em tempo real:', error);
    return null;
  }
}
