'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Clock, Target, Activity, RefreshCw, Info, Database, TrendingUpDown, ArrowUpCircle, ArrowDownCircle, Star } from 'lucide-react';

interface NewsData {
  indicator: string;
  current: number;
  forecast: number;
  previous: number;
  deviationFromForecast: number;
  deviationFromPrevious: number;
  sentiment: 'Hawkish' | 'Dovish' | 'Expansivo' | 'Recessivo';
  timestamp: string;
  stars: number; // Importância da notícia (1-3 estrelas)
}

interface Signal {
  type: 'COMPRA' | 'VENDA';
  pair: string;
  probability: number;
  entry: number;
  stop: number;
  takeProfit: number;
  timeframe: string;
  classification: 'Conservador' | 'Moderado' | 'Agressivo';
  entryTime: string; // Hora da entrada
  stars: number; // Estrelas da notícia
}

interface ContinuationSignal {
  direction: 'continuar' | 'pullback' | 'reverter';
  probability: number;
  volatility: 'baixa' | 'média' | 'alta';
  entry: number;
}

interface PairAnalysis {
  pair: string;
  probabilityUp: number;
  probabilityDown: number;
  strength: 'fraco' | 'moderado' | 'forte';
  volatility3min: number;
  volatility5min: number;
  volatility10min: number;
  volatility15min: number;
  historicalWinRate: number;
  totalHistoricalEvents: number;
  immediateSignal: Signal;
  continuationSignal: ContinuationSignal;
}

export default function Home() {
  const [selectedIndicator, setSelectedIndicator] = useState('NFP');
  const [newsData, setNewsData] = useState<NewsData | null>(null);
  const [pairAnalyses, setPairAnalyses] = useState<PairAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const indicators = [
    { value: 'NFP', label: 'Payroll (NFP)', description: 'Folha de pagamento não-agrícola', stars: 3 },
    { value: 'UNEMPLOYMENT', label: 'Taxa de Desemprego', description: 'Percentual de desempregados', stars: 2 },
    { value: 'PMI_MANUFACTURING', label: 'PMI Industrial', description: 'Índice de gerentes de compras - indústria', stars: 2 },
    { value: 'PMI_SERVICES', label: 'PMI Serviços', description: 'Índice de gerentes de compras - serviços', stars: 2 },
    { value: 'FOMC', label: 'FOMC', description: 'Comitê Federal de Mercado Aberto', stars: 3 },
    { value: 'HOUSING_STARTS', label: 'Inícios de Construção', description: 'Novas construções residenciais iniciadas', stars: 2 },
    { value: 'BUILDING_PERMITS', label: 'Alvarás de Construção', description: 'Autorizações para novas construções', stars: 2 },
    { value: 'HOUSING_SALES', label: 'Vendas de Imóveis', description: 'Volume de vendas residenciais', stars: 2 },
    { value: 'CPI', label: 'IPC (Índice de Preços ao Consumidor)', description: 'Medida de inflação ao consumidor', stars: 3 },
    { value: 'CRUDE_OIL', label: 'Estoque de Petróleo Bruto', description: 'Inventário de petróleo nos EUA', stars: 2 },
    { value: 'GDP', label: 'PIB Anual', description: 'Produto Interno Bruto', stars: 3 }
  ];

  const pairs = ['EUR/USD', 'USD/JPY', 'USD/CHF', 'USD/CAD', 'EUR/JPY', 'CHF/JPY'];

  useEffect(() => {
    fetchAnalysis();
  }, [selectedIndicator]);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/analysis?indicator=${selectedIndicator}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar dados');
      }
      const data = await response.json();
      
      // Adicionar estrelas aos dados da notícia
      const selectedInd = indicators.find(i => i.value === selectedIndicator);
      const newsDataWithStars = {
        ...data.newsData,
        stars: selectedInd?.stars || 2
      };
      
      // Adicionar hora de entrada e estrelas aos sinais
      const pairAnalysesWithTime = data.pairAnalyses.map((analysis: PairAnalysis) => ({
        ...analysis,
        immediateSignal: {
          ...analysis.immediateSignal,
          entryTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          stars: selectedInd?.stars || 2
        }
      }));
      
      setNewsData(newsDataWithStars);
      setPairAnalyses(pairAnalysesWithTime);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao buscar análise:', error);
      setError('Não foi possível carregar os dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const currentPairAnalysis = pairAnalyses.find(p => p.pair === selectedPair);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Hawkish': return 'text-red-600 bg-red-50 border-red-200';
      case 'Dovish': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Expansivo': return 'text-green-600 bg-green-50 border-green-200';
      case 'Recessivo': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSignalColor = (type: string) => {
    return type === 'COMPRA' ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600';
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'Conservador': return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'Moderado': return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
      case 'Agressivo': return 'bg-gradient-to-r from-red-500 to-red-600';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const getVolatilityColor = (volatility: string) => {
    switch (volatility) {
      case 'baixa': return 'text-green-400';
      case 'média': return 'text-yellow-400';
      case 'alta': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(3)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
          />
        ))}
      </div>
    );
  };

  const selectedIndicatorInfo = indicators.find(i => i.value === selectedIndicator);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">
                📊 Win Notícias
              </h1>
              <h2 className="text-xl md:text-2xl font-semibold text-blue-400 mb-2">
                Analista Financeiro Avançado
              </h2>
              <p className="text-slate-300 text-xs md:text-base flex items-center gap-2">
                <Database className="w-4 h-4" />
                Análise em tempo real baseada em dados históricos do calendário econômico
              </p>
            </div>
            {lastUpdate && (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Clock className="w-4 h-4" />
                <span>Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-6 space-y-4 md:space-y-6">
        {/* Seletor de Indicador */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-slate-700 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-white font-semibold text-sm md:text-base">
              Selecione o Indicador Econômico:
            </label>
            <button
              onClick={fetchAnalysis}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              title="Atualizar dados em tempo real"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Atualizar</span>
            </button>
          </div>
          <select
            value={selectedIndicator}
            onChange={(e) => setSelectedIndicator(e.target.value)}
            className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm md:text-base"
          >
            {indicators.map(ind => (
              <option key={ind.value} value={ind.value}>{ind.label}</option>
            ))}
          </select>
          {selectedIndicatorInfo && (
            <div className="mt-3 flex items-start gap-2 text-slate-400 text-xs md:text-sm bg-slate-700/30 rounded-lg p-3">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p>{selectedIndicatorInfo.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-500">Importância:</span>
                  {renderStars(selectedIndicatorInfo.stars)}
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            <p className="text-slate-400 text-sm">Analisando dados em tempo real do calendário econômico...</p>
          </div>
        ) : newsData && currentPairAnalysis ? (
          <>
            {/* Badge de Dados Históricos */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4 border-2 border-purple-400/50 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <Database className="w-6 h-6 text-white" />
                  <div>
                    <p className="text-white font-bold text-sm md:text-base">Análise em Tempo Real</p>
                    <p className="text-purple-100 text-xs md:text-sm">
                      {currentPairAnalysis.totalHistoricalEvents} eventos analisados nos últimos 12 meses
                    </p>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/30">
                  <p className="text-white text-xs">Taxa de Acerto Histórica</p>
                  <p className="text-white text-2xl font-bold">{currentPairAnalysis.historicalWinRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Seletor de Par - MOVIDO PARA CIMA */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-slate-700 shadow-xl">
              <label className="block text-white font-semibold mb-3 text-sm md:text-base">
                Selecione o Ativo (Par de Moedas):
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {pairs.map(pair => (
                  <button
                    key={pair}
                    onClick={() => setSelectedPair(pair)}
                    className={`px-3 py-2 md:px-4 md:py-3 rounded-xl font-semibold transition-all text-sm md:text-base ${
                      selectedPair === pair
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 scale-105'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:scale-105'
                    }`}
                  >
                    {pair}
                  </button>
                ))}
              </div>
            </div>

            {/* BOTÃO DE SINAL - DESTAQUE PRINCIPAL COM HORA E ESTRELAS */}
            <div className={`${getSignalColor(currentPairAnalysis.immediateSignal.type)} rounded-3xl p-6 md:p-8 border-4 border-white/30 shadow-2xl hover:scale-[1.02] transition-all duration-300`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {currentPairAnalysis.immediateSignal.type === 'COMPRA' ? (
                    <ArrowUpCircle className="w-10 h-10 md:w-12 md:h-12 text-white animate-pulse" />
                  ) : (
                    <ArrowDownCircle className="w-10 h-10 md:w-12 md:h-12 text-white animate-pulse" />
                  )}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl md:text-4xl font-black text-white">
                        SINAL: {currentPairAnalysis.immediateSignal.type}
                      </h2>
                      {renderStars(currentPairAnalysis.immediateSignal.stars)}
                    </div>
                    <p className="text-white/90 text-sm md:text-base font-semibold">
                      {currentPairAnalysis.immediateSignal.pair} • Timeframe: {currentPairAnalysis.immediateSignal.timeframe}
                    </p>
                    <p className="text-white/80 text-xs md:text-sm font-medium flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4" />
                      Hora da Entrada: {currentPairAnalysis.immediateSignal.entryTime}
                    </p>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 border-2 border-white/40 text-center">
                  <p className="text-white/80 text-xs font-semibold">PROBABILIDADE</p>
                  <p className="text-white text-3xl md:text-5xl font-black">{currentPairAnalysis.immediateSignal.probability}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border-2 border-white/30">
                  <p className="text-white/80 text-xs md:text-sm font-semibold mb-1">🎯 ENTRADA (TradingView)</p>
                  <p className="text-white text-xl md:text-2xl font-bold">{currentPairAnalysis.immediateSignal.entry.toFixed(5)}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border-2 border-white/30">
                  <p className="text-white/80 text-xs md:text-sm font-semibold mb-1">🛑 STOP LOSS</p>
                  <p className="text-white text-xl md:text-2xl font-bold">{currentPairAnalysis.immediateSignal.stop.toFixed(5)}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border-2 border-white/30">
                  <p className="text-white/80 text-xs md:text-sm font-semibold mb-1">💰 TAKE PROFIT</p>
                  <p className="text-white text-xl md:text-2xl font-bold">{currentPairAnalysis.immediateSignal.takeProfit.toFixed(5)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div>
                  <p className="text-white/80 text-xs md:text-sm font-semibold">TIMEFRAME MAIS ASSERTIVO (12 meses)</p>
                  <p className="text-white text-xl md:text-2xl font-bold">{currentPairAnalysis.immediateSignal.timeframe}</p>
                </div>
                <div className={`${getClassificationColor(currentPairAnalysis.immediateSignal.classification)} rounded-lg px-4 py-2 border-2 border-white/30`}>
                  <p className="text-white text-sm md:text-lg font-bold">
                    {currentPairAnalysis.immediateSignal.classification === 'Conservador' && '🔵'}
                    {currentPairAnalysis.immediateSignal.classification === 'Moderado' && '🟡'}
                    {currentPairAnalysis.immediateSignal.classification === 'Agressivo' && '🔴'}
                    {' '}{currentPairAnalysis.immediateSignal.classification}
                  </p>
                </div>
              </div>

              <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <p className="text-white/90 text-xs md:text-sm text-center">
                  ⚡ Baseado em análise de {currentPairAnalysis.totalHistoricalEvents} eventos similares • Taxa de acerto: {currentPairAnalysis.historicalWinRate.toFixed(1)}% • Níveis de preço: TradingView/Exness
                </p>
              </div>
            </div>

            {/* Resumo da Notícia */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-slate-700 shadow-xl">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                1. Resumo da Notícia (Tempo Real)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                  <p className="text-slate-400 text-xs md:text-sm mb-1">Indicador</p>
                  <p className="text-white text-lg md:text-xl font-bold">{selectedIndicatorInfo?.label}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-400">Importância:</span>
                    {renderStars(newsData.stars)}
                  </div>
                </div>
                <div className={`rounded-xl p-4 border ${getSentimentColor(newsData.sentiment)}`}>
                  <p className="text-xs md:text-sm mb-1 opacity-80">Sentimento</p>
                  <p className="text-lg md:text-xl font-bold">{newsData.sentiment}</p>
                </div>
              </div>
            </div>

            {/* Comparação de Dados */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-slate-700 shadow-xl">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
                2. Comparação: Atual × Previsto × Anterior
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-500/20 border-2 border-blue-500/50 rounded-xl p-4 hover:bg-blue-500/30 transition-all">
                  <p className="text-blue-300 text-xs md:text-sm mb-1">Resultado Atual</p>
                  <p className="text-white text-2xl md:text-3xl font-bold">{newsData.current.toFixed(2)}</p>
                </div>
                <div className="bg-purple-500/20 border-2 border-purple-500/50 rounded-xl p-4 hover:bg-purple-500/30 transition-all">
                  <p className="text-purple-300 text-xs md:text-sm mb-1">Previsão</p>
                  <p className="text-white text-2xl md:text-3xl font-bold">{newsData.forecast.toFixed(2)}</p>
                </div>
                <div className="bg-orange-500/20 border-2 border-orange-500/50 rounded-xl p-4 hover:bg-orange-500/30 transition-all">
                  <p className="text-orange-300 text-xs md:text-sm mb-1">Anterior</p>
                  <p className="text-white text-2xl md:text-3xl font-bold">{newsData.previous.toFixed(2)}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                  <p className="text-slate-400 text-xs md:text-sm mb-1">Desvio vs. Previsto</p>
                  <div className="flex items-center gap-2">
                    {newsData.deviationFromForecast > 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                    <p className={`text-xl md:text-2xl font-bold ${newsData.deviationFromForecast > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {newsData.deviationFromForecast > 0 ? '+' : ''}{newsData.deviationFromForecast.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                  <p className="text-slate-400 text-xs md:text-sm mb-1">Desvio vs. Anterior</p>
                  <div className="flex items-center gap-2">
                    {newsData.deviationFromPrevious > 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                    <p className={`text-xl md:text-2xl font-bold ${newsData.deviationFromPrevious > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {newsData.deviationFromPrevious > 0 ? '+' : ''}{newsData.deviationFromPrevious.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Impacto Histórico e Volatilidade */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-slate-700 shadow-xl">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <Activity className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
                3. Volatilidade Histórica por Timeframe - {selectedPair}
              </h2>
              <p className="text-slate-400 text-xs md:text-sm mb-4">
                Baseado em {currentPairAnalysis.totalHistoricalEvents} eventos dos últimos 12 meses
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500/50 rounded-xl p-3 md:p-4 hover:scale-105 transition-transform">
                  <p className="text-green-300 text-xs md:text-sm mb-1">0-3 min</p>
                  <p className="text-white text-xl md:text-2xl font-bold">{currentPairAnalysis.volatility3min.toFixed(1)}</p>
                  <p className="text-green-300 text-xs">pips médios</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-2 border-blue-500/50 rounded-xl p-3 md:p-4 hover:scale-105 transition-transform">
                  <p className="text-blue-300 text-xs md:text-sm mb-1">3-5 min</p>
                  <p className="text-white text-xl md:text-2xl font-bold">{currentPairAnalysis.volatility5min.toFixed(1)}</p>
                  <p className="text-blue-300 text-xs">pips médios</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-2 border-purple-500/50 rounded-xl p-3 md:p-4 hover:scale-105 transition-transform">
                  <p className="text-purple-300 text-xs md:text-sm mb-1">5-10 min</p>
                  <p className="text-white text-xl md:text-2xl font-bold">{currentPairAnalysis.volatility10min.toFixed(1)}</p>
                  <p className="text-purple-300 text-xs">pips médios</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-2 border-orange-500/50 rounded-xl p-3 md:p-4 hover:scale-105 transition-transform">
                  <p className="text-orange-300 text-xs md:text-sm mb-1">10-15 min</p>
                  <p className="text-white text-xl md:text-2xl font-bold">{currentPairAnalysis.volatility15min.toFixed(1)}</p>
                  <p className="text-orange-300 text-xs">pips médios</p>
                </div>
              </div>
            </div>

            {/* Probabilidades 4h */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-slate-700 shadow-xl">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
                4. Probabilidade de Alta ou Baixa (Próximas 4h)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-500/20 border-2 border-green-500/50 rounded-xl p-4 md:p-6 hover:bg-green-500/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-300 font-semibold text-sm md:text-base">Probabilidade de ALTA</span>
                    <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
                  </div>
                  <p className="text-white text-3xl md:text-4xl font-bold">{currentPairAnalysis.probabilityUp.toFixed(1)}%</p>
                </div>
                <div className="bg-red-500/20 border-2 border-red-500/50 rounded-xl p-4 md:p-6 hover:bg-red-500/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-red-300 font-semibold text-sm md:text-base">Probabilidade de BAIXA</span>
                    <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
                  </div>
                  <p className="text-white text-3xl md:text-4xl font-bold">{currentPairAnalysis.probabilityDown.toFixed(1)}%</p>
                </div>
              </div>
              <div className="mt-4 bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                <p className="text-slate-400 text-xs md:text-sm mb-1">Força do Movimento</p>
                <p className="text-white text-xl md:text-2xl font-bold uppercase">{currentPairAnalysis.strength}</p>
              </div>
            </div>

            {/* Sinal de Continuação */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-slate-700 shadow-xl">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
                5. Sinal de Continuação (3-15 min)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-cyan-500/20 border-2 border-cyan-500/50 rounded-xl p-4 hover:bg-cyan-500/30 transition-all">
                  <p className="text-cyan-300 text-xs md:text-sm mb-1">Direção Esperada</p>
                  <p className="text-white text-xl md:text-2xl font-bold uppercase">{currentPairAnalysis.continuationSignal.direction}</p>
                </div>
                <div className="bg-cyan-500/20 border-2 border-cyan-500/50 rounded-xl p-4 hover:bg-cyan-500/30 transition-all">
                  <p className="text-cyan-300 text-xs md:text-sm mb-1">Probabilidade</p>
                  <p className="text-white text-xl md:text-2xl font-bold">{currentPairAnalysis.continuationSignal.probability}%</p>
                </div>
                <div className="bg-cyan-500/20 border-2 border-cyan-500/50 rounded-xl p-4 hover:bg-cyan-500/30 transition-all">
                  <p className="text-cyan-300 text-xs md:text-sm mb-1">Volatilidade</p>
                  <p className={`text-xl md:text-2xl font-bold uppercase ${getVolatilityColor(currentPairAnalysis.continuationSignal.volatility)}`}>
                    {currentPairAnalysis.continuationSignal.volatility}
                  </p>
                </div>
                <div className="bg-cyan-500/20 border-2 border-cyan-500/50 rounded-xl p-4 hover:bg-cyan-500/30 transition-all">
                  <p className="text-cyan-300 text-xs md:text-sm mb-1">Entrada Sugerida</p>
                  <p className="text-white text-xl md:text-2xl font-bold">{currentPairAnalysis.continuationSignal.entry.toFixed(5)}</p>
                </div>
              </div>
            </div>

            {/* Conclusão */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-4 md:p-6 border-2 border-white/20 shadow-2xl">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4">6. 📋 Conclusão Objetiva</h2>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-white text-sm md:text-lg leading-relaxed">
                  {selectedIndicatorInfo?.label} {newsData.deviationFromForecast > 0 ? 'acima' : 'abaixo'} da previsão → USD {newsData.deviationFromForecast > 0 ? 'forte' : 'fraco'}.
                  <br /><br />
                  <strong>Análise em tempo real:</strong> Baseado em {currentPairAnalysis.totalHistoricalEvents} eventos similares nos últimos 12 meses, com taxa de acerto de {currentPairAnalysis.historicalWinRate.toFixed(1)}%.
                  <br /><br />
                  <strong>Sinal recomendado:</strong> {currentPairAnalysis.immediateSignal.type} {currentPairAnalysis.immediateSignal.pair} no timeframe de {currentPairAnalysis.immediateSignal.timeframe} — Probabilidade {currentPairAnalysis.immediateSignal.probability}%.
                  <br /><br />
                  <strong>Continuação esperada:</strong> {currentPairAnalysis.continuationSignal.direction === 'continuar' ? 'Continuação do movimento' : currentPairAnalysis.continuationSignal.direction === 'pullback' ? 'Pullback seguido de continuação' : 'Possível reversão'} — Probabilidade {currentPairAnalysis.continuationSignal.probability}%.
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-slate-700">
            <p className="text-slate-400 text-lg">Selecione um indicador para ver a análise em tempo real</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-t border-slate-700 mt-8 md:mt-12">
        <div className="container mx-auto px-4 py-4 md:py-6 text-center">
          <p className="text-slate-400 text-xs md:text-sm">
            ⚠️ Análise em tempo real baseada em dados históricos do calendário econômico. Não constitui recomendação de investimento.
          </p>
          <p className="text-slate-500 text-xs mt-2">
            © 2024 Win Notícias - Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
