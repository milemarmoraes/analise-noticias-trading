"use client";

import { useState, useEffect, useCallback } from 'react';
import type { InvestingNewsData, ForexPairData } from '@/lib/investingScraper';

interface UseInvestingDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // em milissegundos
}

interface InvestingDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

/**
 * Hook para buscar calendário econômico do Investing.com
 */
export function useEconomicCalendar(options: UseInvestingDataOptions = {}) {
  const { autoRefresh = false, refreshInterval = 60000 } = options;
  
  const [state, setState] = useState<InvestingDataState<InvestingNewsData[]>>({
    data: null,
    loading: true,
    error: null,
    lastUpdate: null
  });

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/investing?type=calendar');
      const result = await response.json();

      if (result.success) {
        setState({
          data: result.data,
          loading: false,
          error: null,
          lastUpdate: new Date()
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Erro ao buscar dados'
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  }, []);

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh, refreshInterval]);

  return { ...state, refetch: fetchData };
}

/**
 * Hook para buscar dados de um par de moedas específico
 */
export function useForexPair(pair: string, options: UseInvestingDataOptions = {}) {
  const { autoRefresh = false, refreshInterval = 30000 } = options;
  
  const [state, setState] = useState<InvestingDataState<ForexPairData>>({
    data: null,
    loading: true,
    error: null,
    lastUpdate: null
  });

  const fetchData = useCallback(async () => {
    if (!pair) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(`/api/investing?type=forex&pair=${encodeURIComponent(pair)}`);
      const result = await response.json();

      if (result.success) {
        setState({
          data: result.data,
          loading: false,
          error: null,
          lastUpdate: new Date()
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Erro ao buscar dados'
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  }, [pair]);

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh, refreshInterval]);

  return { ...state, refetch: fetchData };
}

/**
 * Hook para buscar dados de múltiplos pares de moedas
 */
export function useMultipleForexPairs(pairs?: string[], options: UseInvestingDataOptions = {}) {
  const { autoRefresh = false, refreshInterval = 30000 } = options;
  
  const [state, setState] = useState<InvestingDataState<ForexPairData[]>>({
    data: null,
    loading: true,
    error: null,
    lastUpdate: null
  });

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const pairsParam = pairs ? `&pairs=${pairs.join(',')}` : '';
      const response = await fetch(`/api/investing?type=multiple-forex${pairsParam}`);
      const result = await response.json();

      if (result.success) {
        setState({
          data: result.data,
          loading: false,
          error: null,
          lastUpdate: new Date()
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Erro ao buscar dados'
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  }, [pairs]);

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh, refreshInterval]);

  return { ...state, refetch: fetchData };
}

/**
 * Hook para buscar histórico de um indicador específico
 */
export function useIndicatorHistory(indicator: string, months: number = 12, options: UseInvestingDataOptions = {}) {
  const { autoRefresh = false, refreshInterval = 300000 } = options; // 5 minutos padrão
  
  const [state, setState] = useState<InvestingDataState<InvestingNewsData[]>>({
    data: null,
    loading: true,
    error: null,
    lastUpdate: null
  });

  const fetchData = useCallback(async () => {
    if (!indicator) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(
        `/api/investing?type=indicator&indicator=${encodeURIComponent(indicator)}&months=${months}`
      );
      const result = await response.json();

      if (result.success) {
        setState({
          data: result.data,
          loading: false,
          error: null,
          lastUpdate: new Date()
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Erro ao buscar dados'
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  }, [indicator, months]);

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh, refreshInterval]);

  return { ...state, refetch: fetchData };
}
