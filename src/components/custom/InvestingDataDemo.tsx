"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEconomicCalendar, useMultipleForexPairs } from "@/hooks/useInvestingData";
import { RefreshCw, TrendingUp, TrendingDown, Calendar, Clock } from "lucide-react";

export function InvestingDataDemo() {
  const { data: calendarData, loading: calendarLoading, error: calendarError, refetch: refetchCalendar } = useEconomicCalendar({
    autoRefresh: true,
    refreshInterval: 60000 // 1 minuto
  });

  const { data: forexData, loading: forexLoading, error: forexError, refetch: refetchForex } = useMultipleForexPairs(
    ['EUR/USD', 'USD/JPY', 'USD/CHF', 'USD/CAD', 'EUR/JPY', 'CHF/JPY'],
    {
      autoRefresh: true,
      refreshInterval: 30000 // 30 segundos
    }
  );

  return (
    <div className="space-y-6">
      {/* Calendário Econômico */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Calendário Econômico - Investing.com
              </CardTitle>
              <CardDescription>
                Eventos de alto impacto (★★★) em tempo real
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refetchCalendar}
              disabled={calendarLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${calendarLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {calendarLoading && !calendarData ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : calendarError ? (
            <div className="text-center py-8 text-red-500">
              <p>❌ {calendarError}</p>
              <Button variant="outline" size="sm" onClick={refetchCalendar} className="mt-4">
                Tentar novamente
              </Button>
            </div>
          ) : calendarData && calendarData.length > 0 ? (
            <div className="space-y-3">
              {calendarData.slice(0, 10).map((event, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{event.currency}</Badge>
                      <span className="text-yellow-500">★★★</span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.time}
                      </span>
                    </div>
                    <h4 className="font-semibold">{event.event}</h4>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span>
                        <strong>Atual:</strong> {event.actual || '-'}
                      </span>
                      <span>
                        <strong>Previsão:</strong> {event.forecast || '-'}
                      </span>
                      <span>
                        <strong>Anterior:</strong> {event.previous || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum evento de alto impacto encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pares de Moedas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Pares de Moedas - Tempo Real
              </CardTitle>
              <CardDescription>
                Cotações atualizadas a cada 30 segundos
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refetchForex}
              disabled={forexLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${forexLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {forexLoading && !forexData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : forexError ? (
            <div className="text-center py-8 text-red-500">
              <p>❌ {forexError}</p>
              <Button variant="outline" size="sm" onClick={refetchForex} className="mt-4">
                Tentar novamente
              </Button>
            </div>
          ) : forexData && forexData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forexData.map((pair) => (
                <div
                  key={pair.pair}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-lg">{pair.pair}</h4>
                    {pair.change >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{pair.price.toFixed(5)}</p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={pair.change >= 0 ? "default" : "destructive"}
                        className={pair.change >= 0 ? "bg-green-500" : ""}
                      >
                        {pair.change >= 0 ? '+' : ''}{pair.change.toFixed(5)}
                      </Badge>
                      <Badge
                        variant={pair.changePercent >= 0 ? "default" : "destructive"}
                        className={pair.changePercent >= 0 ? "bg-green-500" : ""}
                      >
                        {pair.changePercent >= 0 ? '+' : ''}{pair.changePercent.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum dado de par de moedas disponível</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
