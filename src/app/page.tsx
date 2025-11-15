'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Clock, Target, Activity } from 'lucide-react';

interface NewsData {
  indicator: string;
  current: number;
  forecast: number;
  previous: number;
  deviationFromForecast: number;
  deviationFromPrevious: number;
  sentiment: 'Hawkish' | 'Dovish' | 'Expansivo' | 'Recessivo';
  timestamp: string;
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
  immediateSignal: Signal;
  continuationSignal: ContinuationSignal;
}

export default function Home() {
  const [selectedIndicator, setSelectedIndicator] = useState('NFP');
  const [newsData, setNewsData] = useState<NewsData | null>(null);
  const [pairAnalyses, setPairAnalyses] = useState<PairAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPair, setSelectedPair] = useState('EUR/USD');

  const indicators = [
    { value: 'NFP', label: 'Payroll (NFP)' },
    { value: 'UNEMPLOYMENT', label: 'Taxa de Desemprego' },
    { value: 'PMI_MANUFACTURING', label: 'PMI Industrial' },
    { value: 'PMI_SERVICES', label: 'PMI Serviços' },
    { value: 'FOMC', label: 'FOMC' },
    { value: 'HOUSING_STARTS', label: 'Housing Starts' },
    { value: 'BUILDING_PERMITS', label: 'Building Permits' },
    { value: 'HOUSING_SALES', label: 'Housing Sales' },
    { value: 'GDP', label: 'PIB Anual' }
  ];

  const pairs = ['EUR/USD', 'USD/JPY', 'USD/CHF', 'USD/CAD', 'EUR/JPY', 'CHF/JPY'];

  useEffect(() => {
    fetchAnalysis();
  }, [selectedIndicator]);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analysis?indicator=${selectedIndicator}`);
      const data = await response.json();
      setNewsData(data.newsData);
      setPairAnalyses(data.pairAnalyses);
    } catch (error) {
      console.error('Erro ao buscar análise:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentPairAnalysis = pairAnalyses.find(p => p.pair === selectedPair);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Hawkish': return 'text-red-600 bg-red-50';
      case 'Dovish': return 'text-blue-600 bg-blue-50';
      case 'Expansivo': return 'text-green-600 bg-green-50';
      case 'Recessivo': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSignalColor = (type: string) => {
    return type === 'COMPRA' ? 'bg-green-500' : 'bg-red-500';
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'Conservador': return 'bg-blue-500';
      case 'Moderado': return 'bg-yellow-500';
      case 'Agressivo': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            📊 Analista Financeiro Avançado
          </h1>
          <p className="text-slate-300 text-sm md:text-base">
            Análise em tempo real de notícias macroeconômicas ★★★ para Forex e Opções Binárias
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Seletor de Indicador */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-slate-700">
          <label className="block text-white font-semibold mb-3">
            Selecione o Indicador Econômico:
          </label>
          <select
            value={selectedIndicator}
            onChange={(e) => setSelectedIndicator(e.target.value)}
            className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            {indicators.map(ind => (
              <option key={ind.value} value={ind.value}>{ind.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
        ) : newsData && currentPairAnalysis ? (
          <>
            {/* Resumo da Notícia */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-blue-400" />
                1. Resumo da Notícia
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">Indicador</p>
                  <p className="text-white text-xl font-bold">{indicators.find(i => i.value === selectedIndicator)?.label}</p>
                </div>
                <div className={`rounded-xl p-4 ${getSentimentColor(newsData.sentiment)}`}>
                  <p className="text-sm mb-1 opacity-80">Sentimento</p>
                  <p className="text-xl font-bold">{newsData.sentiment}</p>
                </div>
              </div>
            </div>

            {/* Comparação de Dados */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4">
                2. Comparação: Atual × Previsto × Anterior
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4">
                  <p className="text-blue-300 text-sm mb-1">Resultado Atual</p>
                  <p className="text-white text-3xl font-bold">{newsData.current.toFixed(2)}</p>
                </div>
                <div className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-4">
                  <p className="text-purple-300 text-sm mb-1">Previsão</p>
                  <p className="text-white text-3xl font-bold">{newsData.forecast.toFixed(2)}</p>
                </div>
                <div className="bg-orange-500/20 border border-orange-500/50 rounded-xl p-4">
                  <p className="text-orange-300 text-sm mb-1">Anterior</p>
                  <p className="text-white text-3xl font-bold">{newsData.previous.toFixed(2)}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">Desvio vs. Previsto</p>
                  <p className={`text-2xl font-bold ${newsData.deviationFromForecast > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {newsData.deviationFromForecast > 0 ? '+' : ''}{newsData.deviationFromForecast.toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">Desvio vs. Anterior</p>
                  <p className={`text-2xl font-bold ${newsData.deviationFromPrevious > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {newsData.deviationFromPrevious > 0 ? '+' : ''}{newsData.deviationFromPrevious.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Seletor de Par */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-slate-700">
              <label className="block text-white font-semibold mb-3">
                Selecione o Par de Moedas:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {pairs.map(pair => (
                  <button
                    key={pair}
                    onClick={() => setSelectedPair(pair)}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                      selectedPair === pair
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {pair}
                  </button>
                ))}
              </div>
            </div>

            {/* Impacto Histórico e Volatilidade */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-6 h-6 text-green-400" />
                3. Impacto Histórico e Volatilidade - {selectedPair}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/50 rounded-xl p-4">
                  <p className="text-green-300 text-sm mb-1">0-3 min</p>
                  <p className="text-white text-2xl font-bold">{currentPairAnalysis.volatility3min.toFixed(1)} pips</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/50 rounded-xl p-4">
                  <p className="text-blue-300 text-sm mb-1">3-5 min</p>
                  <p className="text-white text-2xl font-bold">{currentPairAnalysis.volatility5min.toFixed(1)} pips</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/50 rounded-xl p-4">
                  <p className="text-purple-300 text-sm mb-1">5-10 min</p>
                  <p className="text-white text-2xl font-bold">{currentPairAnalysis.volatility10min.toFixed(1)} pips</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/50 rounded-xl p-4">
                  <p className="text-orange-300 text-sm mb-1">10-15 min</p>
                  <p className="text-white text-2xl font-bold">{currentPairAnalysis.volatility15min.toFixed(1)} pips</p>
                </div>
              </div>
            </div>

            {/* Probabilidades 4h */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-6 h-6 text-yellow-400" />
                4. Probabilidade de Alta ou Baixa (4h)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-300 font-semibold">Probabilidade de ALTA</span>
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <p className="text-white text-4xl font-bold">{currentPairAnalysis.probabilityUp}%</p>
                </div>
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-red-300 font-semibold">Probabilidade de BAIXA</span>
                    <TrendingDown className="w-6 h-6 text-red-400" />
                  </div>
                  <p className="text-white text-4xl font-bold">{currentPairAnalysis.probabilityDown}%</p>
                </div>
              </div>
              <div className="mt-4 bg-slate-700/50 rounded-xl p-4">
                <p className="text-slate-400 text-sm mb-1">Força do Movimento</p>
                <p className="text-white text-2xl font-bold uppercase">{currentPairAnalysis.strength}</p>
              </div>
            </div>

            {/* Sinal Imediato */}
            <div className={`${getSignalColor(currentPairAnalysis.immediateSignal.type)} rounded-2xl p-6 border-4 border-white/20 shadow-2xl`}>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-7 h-7" />
                5. 🚨 SINAL IMEDIATO (0-3 min)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/80 text-sm mb-1">Tipo de Operação</p>
                  <p className="text-white text-3xl font-bold">{currentPairAnalysis.immediateSignal.type}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/80 text-sm mb-1">Par</p>
                  <p className="text-white text-3xl font-bold">{currentPairAnalysis.immediateSignal.pair}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/80 text-sm mb-1">Probabilidade</p>
                  <p className="text-white text-3xl font-bold">{currentPairAnalysis.immediateSignal.probability}%</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/80 text-sm mb-1">Timeframe</p>
                  <p className="text-white text-3xl font-bold">{currentPairAnalysis.immediateSignal.timeframe}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/80 text-sm mb-1">Entrada</p>
                  <p className="text-white text-xl font-bold">{currentPairAnalysis.immediateSignal.entry.toFixed(5)}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/80 text-sm mb-1">Stop Loss</p>
                  <p className="text-white text-xl font-bold">{currentPairAnalysis.immediateSignal.stop.toFixed(5)}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/80 text-sm mb-1">Take Profit</p>
                  <p className="text-white text-xl font-bold">{currentPairAnalysis.immediateSignal.takeProfit.toFixed(5)}</p>
                </div>
              </div>
              <div className={`mt-4 ${getClassificationColor(currentPairAnalysis.immediateSignal.classification)} rounded-xl p-4 text-center`}>
                <p className="text-white text-xl font-bold">
                  {currentPairAnalysis.immediateSignal.classification === 'Conservador' && '🔵'}
                  {currentPairAnalysis.immediateSignal.classification === 'Moderado' && '🟡'}
                  {currentPairAnalysis.immediateSignal.classification === 'Agressivo' && '🔴'}
                  {' '}Sinal {currentPairAnalysis.immediateSignal.classification}
                </p>
              </div>
            </div>

            {/* Sinal de Continuação */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-6 h-6 text-cyan-400" />
                6. Sinal de Continuação (3-15 min)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-cyan-500/20 border border-cyan-500/50 rounded-xl p-4">
                  <p className="text-cyan-300 text-sm mb-1">Direção Esperada</p>
                  <p className="text-white text-2xl font-bold uppercase">{currentPairAnalysis.continuationSignal.direction}</p>
                </div>
                <div className="bg-cyan-500/20 border border-cyan-500/50 rounded-xl p-4">
                  <p className="text-cyan-300 text-sm mb-1">Probabilidade</p>
                  <p className="text-white text-2xl font-bold">{currentPairAnalysis.continuationSignal.probability}%</p>
                </div>
                <div className="bg-cyan-500/20 border border-cyan-500/50 rounded-xl p-4">
                  <p className="text-cyan-300 text-sm mb-1">Volatilidade</p>
                  <p className="text-white text-2xl font-bold uppercase">{currentPairAnalysis.continuationSignal.volatility}</p>
                </div>
                <div className="bg-cyan-500/20 border border-cyan-500/50 rounded-xl p-4">
                  <p className="text-cyan-300 text-sm mb-1">Entrada Sugerida</p>
                  <p className="text-white text-2xl font-bold">{currentPairAnalysis.continuationSignal.entry.toFixed(5)}</p>
                </div>
              </div>
            </div>

            {/* Conclusão */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 border border-white/20 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-4">7. 📋 Conclusão Objetiva</h2>
              <p className="text-white text-lg leading-relaxed">
                {indicators.find(i => i.value === selectedIndicator)?.label} {newsData.deviationFromForecast > 0 ? 'acima' : 'abaixo'} da previsão → USD {newsData.deviationFromForecast > 0 ? 'forte' : 'fraco'}.
                <br /><br />
                <strong>Sinal imediato (0-3 min):</strong> {currentPairAnalysis.immediateSignal.type} {currentPairAnalysis.immediateSignal.pair} — Probabilidade {currentPairAnalysis.immediateSignal.probability}%.
                <br /><br />
                <strong>Sinal 3-15 min:</strong> {currentPairAnalysis.continuationSignal.direction === 'continuar' ? 'Continuação' : currentPairAnalysis.continuationSignal.direction === 'pullback' ? 'Pullback e continuação' : 'Reversão'} — Probabilidade {currentPairAnalysis.continuationSignal.probability}%.
              </p>
            </div>

            {/* Botão de Entrada */}
            <div className={`${getSignalColor(currentPairAnalysis.immediateSignal.type)} rounded-2xl p-8 text-center border-4 border-white shadow-2xl transform hover:scale-105 transition-transform`}>
              <h2 className="text-3xl font-bold text-white mb-4">🟩 BOTÃO DE ENTRADA</h2>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 space-y-3">
                <p className="text-white text-2xl font-bold">
                  {currentPairAnalysis.immediateSignal.type} {currentPairAnalysis.immediateSignal.pair}
                </p>
                <p className="text-white text-xl">
                  Entrada: {new Date().toLocaleTimeString('pt-BR')}
                </p>
                <p className="text-white text-xl">
                  Expiração: {currentPairAnalysis.immediateSignal.timeframe}
                </p>
                <p className="text-white text-xl">
                  Probabilidade: {currentPairAnalysis.immediateSignal.probability}%
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-slate-700">
            <p className="text-slate-400 text-lg">Selecione um indicador para ver a análise</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-t border-slate-700 mt-12">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-slate-400 text-sm">
            ⚠️ Análise baseada em dados históricos. Não constitui recomendação de investimento.
          </p>
        </div>
      </div>
    </div>
  );
}
