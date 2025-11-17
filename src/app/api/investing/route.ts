import { NextRequest, NextResponse } from 'next/server';
import {
  getEconomicCalendarWithCache,
  getForexPairWithCache,
  scrapeMultipleForexPairs,
  scrapeIndicatorHistory,
  INVESTING_FOREX_PAIRS
} from '@/lib/investingScraper';

/**
 * GET /api/investing
 * Endpoint para buscar dados do Investing.com
 * 
 * Query params:
 * - type: 'calendar' | 'forex' | 'indicator' | 'multiple-forex'
 * - pair: par de moedas (ex: EUR/USD) - para type=forex
 * - pairs: lista de pares separados por vírgula - para type=multiple-forex
 * - indicator: nome do indicador - para type=indicator
 * - months: número de meses históricos (padrão: 12) - para type=indicator
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'calendar';

    switch (type) {
      case 'calendar': {
        console.log('📊 Buscando calendário econômico...');
        const data = await getEconomicCalendarWithCache();
        
        return NextResponse.json({
          success: true,
          data,
          count: data.length,
          timestamp: new Date().toISOString()
        });
      }

      case 'forex': {
        const pair = searchParams.get('pair');
        if (!pair) {
          return NextResponse.json(
            { success: false, error: 'Par de moedas não especificado' },
            { status: 400 }
          );
        }

        console.log(`💱 Buscando dados de ${pair}...`);
        const data = await getForexPairWithCache(pair);
        
        if (!data) {
          return NextResponse.json(
            { success: false, error: `Dados não encontrados para ${pair}` },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data,
          timestamp: new Date().toISOString()
        });
      }

      case 'multiple-forex': {
        const pairsParam = searchParams.get('pairs');
        const pairs = pairsParam 
          ? pairsParam.split(',').map(p => p.trim())
          : Object.keys(INVESTING_FOREX_PAIRS);

        console.log(`💱 Buscando dados de múltiplos pares: ${pairs.join(', ')}`);
        const data = await scrapeMultipleForexPairs(pairs);

        return NextResponse.json({
          success: true,
          data,
          count: data.length,
          timestamp: new Date().toISOString()
        });
      }

      case 'indicator': {
        const indicator = searchParams.get('indicator');
        if (!indicator) {
          return NextResponse.json(
            { success: false, error: 'Indicador não especificado' },
            { status: 400 }
          );
        }

        const months = parseInt(searchParams.get('months') || '12');
        console.log(`📈 Buscando histórico de ${indicator} (${months} meses)...`);
        
        const data = await scrapeIndicatorHistory(indicator, months);

        return NextResponse.json({
          success: true,
          data,
          count: data.length,
          indicator,
          months,
          timestamp: new Date().toISOString()
        });
      }

      default: {
        return NextResponse.json(
          { success: false, error: 'Tipo de requisição inválido' },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error('❌ Erro na API do Investing.com:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar dados do Investing.com',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/investing
 * Endpoint para forçar atualização de cache
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, pair, pairs, indicator } = body;

    switch (type) {
      case 'calendar': {
        const data = await getEconomicCalendarWithCache();
        return NextResponse.json({
          success: true,
          message: 'Cache do calendário atualizado',
          count: data.length
        });
      }

      case 'forex': {
        if (!pair) {
          return NextResponse.json(
            { success: false, error: 'Par não especificado' },
            { status: 400 }
          );
        }

        const data = await getForexPairWithCache(pair);
        return NextResponse.json({
          success: true,
          message: `Cache de ${pair} atualizado`,
          data
        });
      }

      case 'multiple-forex': {
        const pairsList = pairs || Object.keys(INVESTING_FOREX_PAIRS);
        const data = await scrapeMultipleForexPairs(pairsList);
        
        return NextResponse.json({
          success: true,
          message: 'Cache de múltiplos pares atualizado',
          count: data.length
        });
      }

      default: {
        return NextResponse.json(
          { success: false, error: 'Tipo inválido' },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar cache:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao atualizar cache',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
