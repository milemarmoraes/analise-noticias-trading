import puppeteer, { Browser, Page } from 'puppeteer';

export interface InvestingNewsData {
  date: string;
  time: string;
  currency: string;
  event: string;
  actual: string;
  forecast: string;
  previous: string;
  impact: number; // 1, 2, or 3 stars
  timestamp?: Date;
}

export interface ForexPairData {
  pair: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: Date;
}

/**
 * Configuração otimizada do Puppeteer para scraping
 */
const PUPPETEER_CONFIG = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--window-size=1920x1080'
  ]
};

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Inicializar browser com configurações otimizadas
 */
async function initBrowser(): Promise<Browser> {
  return await puppeteer.launch(PUPPETEER_CONFIG);
}

/**
 * Configurar página com headers e user agent
 */
async function setupPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENT);
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Bloquear recursos desnecessários para acelerar
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const resourceType = req.resourceType();
    if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
      req.abort();
    } else {
      req.continue();
    }
  });
  
  return page;
}

/**
 * Scraper principal para calendário econômico do Investing.com
 * Coleta notícias de alto impacto (★★★) dos últimos 12 meses
 */
export async function scrapeTodayEconomicCalendar(): Promise<InvestingNewsData[]> {
  let browser: Browser | null = null;
  
  try {
    browser = await initBrowser();
    const page = await setupPage(browser);
    
    const url = 'https://www.investing.com/economic-calendar/';
    console.log('🔍 Acessando calendário econômico:', url);
    
    await page.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });
    
    // Aguardar carregamento da tabela
    await page.waitForSelector('#economicCalendarData, .economicCalendarTable', { 
      timeout: 15000 
    });
    
    // Extrair dados da página
    const data = await page.evaluate(() => {
      const rows = document.querySelectorAll('#economicCalendarData tr.js-event-item, .economicCalendarTable tbody tr');
      const results: any[] = [];
      
      rows.forEach((row) => {
        try {
          // Verificar impacto (3 estrelas apenas)
          const sentimentElement = row.querySelector('.sentiment, .sentimentIcons');
          if (!sentimentElement) return;
          
          const bullishIcons = sentimentElement.querySelectorAll('.grayFullBullishIcon, i.grayFullBullishIcon');
          const impactStars = bullishIcons.length;
          
          // Filtrar apenas eventos de alto impacto (3 estrelas)
          if (impactStars !== 3) return;
          
          // Extrair dados das células
          const dateCell = row.querySelector('.date, td:nth-child(1)');
          const timeCell = row.querySelector('.time, td:nth-child(2)');
          const currencyCell = row.querySelector('.flagCur, .flag span, td:nth-child(3)');
          const eventCell = row.querySelector('.event a, .eventRowLink, td:nth-child(4)');
          const actualCell = row.querySelector('.act, .bold, td:nth-child(5)');
          const forecastCell = row.querySelector('.fore, td:nth-child(6)');
          const previousCell = row.querySelector('.prev, td:nth-child(7)');
          
          const newsData = {
            date: dateCell?.textContent?.trim() || new Date().toLocaleDateString(),
            time: timeCell?.textContent?.trim() || '',
            currency: currencyCell?.textContent?.trim() || '',
            event: eventCell?.textContent?.trim() || '',
            actual: actualCell?.textContent?.trim() || '',
            forecast: forecastCell?.textContent?.trim() || '',
            previous: previousCell?.textContent?.trim() || '',
            impact: impactStars
          };
          
          // Validar se tem dados mínimos
          if (newsData.event && newsData.currency) {
            results.push(newsData);
          }
        } catch (err) {
          console.error('Erro ao processar linha:', err);
        }
      });
      
      return results;
    });
    
    console.log(`✅ Coletados ${data.length} eventos de alto impacto`);
    
    // Adicionar timestamp
    return data.map(item => ({
      ...item,
      timestamp: new Date()
    }));
    
  } catch (error) {
    console.error('❌ Erro ao fazer scraping do calendário econômico:', error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Buscar dados históricos de um indicador específico
 */
export async function scrapeIndicatorHistory(indicator: string, months: number = 12): Promise<InvestingNewsData[]> {
  let browser: Browser | null = null;
  
  try {
    const slug = INVESTING_INDICATORS[indicator as keyof typeof INVESTING_INDICATORS];
    if (!slug) {
      console.error(`❌ Indicador ${indicator} não encontrado`);
      return [];
    }
    
    browser = await initBrowser();
    const page = await setupPage(browser);
    
    const url = `https://www.investing.com/economic-calendar/${slug}`;
    console.log(`🔍 Buscando histórico de ${indicator}:`, url);
    
    await page.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });
    
    await page.waitForSelector('.historicalCalendarTable, #historicalData', { 
      timeout: 15000 
    });
    
    const data = await page.evaluate((monthsLimit) => {
      const rows = document.querySelectorAll('.historicalCalendarTable tbody tr, #historicalData tr');
      const results: any[] = [];
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - monthsLimit);
      
      for (let i = 0; i < Math.min(rows.length, 50); i++) {
        const row = rows[i];
        const cells = row.querySelectorAll('td');
        
        if (cells.length >= 4) {
          const dateText = cells[0]?.textContent?.trim() || '';
          const timeText = cells[1]?.textContent?.trim() || '';
          const actualText = cells[2]?.textContent?.trim() || '';
          const forecastText = cells[3]?.textContent?.trim() || '';
          const previousText = cells[4]?.textContent?.trim() || '';
          
          // Tentar parsear data
          const eventDate = new Date(dateText);
          if (eventDate >= cutoffDate) {
            results.push({
              date: dateText,
              time: timeText,
              actual: actualText,
              forecast: forecastText,
              previous: previousText,
              impact: 3 // Indicadores específicos são sempre de alto impacto
            });
          }
        }
      }
      
      return results;
    }, months);
    
    console.log(`✅ Coletados ${data.length} registros históricos de ${indicator}`);
    return data;
    
  } catch (error) {
    console.error(`❌ Erro ao buscar histórico do indicador ${indicator}:`, error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Buscar dados em tempo real de um par de moedas
 */
export async function scrapeForexPairData(pair: string): Promise<ForexPairData | null> {
  let browser: Browser | null = null;
  
  try {
    const pairSlug = INVESTING_FOREX_PAIRS[pair as keyof typeof INVESTING_FOREX_PAIRS];
    if (!pairSlug) {
      console.error(`❌ Par ${pair} não encontrado`);
      return null;
    }
    
    browser = await initBrowser();
    const page = await setupPage(browser);
    
    const url = `https://www.investing.com/currencies/${pairSlug}`;
    console.log(`🔍 Buscando dados de ${pair}:`, url);
    
    await page.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });
    
    // Aguardar elementos de preço
    await page.waitForSelector('[data-test="instrument-price-last"], .instrument-price_last__KQzyA', { 
      timeout: 10000 
    });
    
    const data = await page.evaluate(() => {
      // Tentar múltiplos seletores
      const priceElement = document.querySelector('[data-test="instrument-price-last"], .instrument-price_last__KQzyA, #last_last');
      const changeElement = document.querySelector('[data-test="instrument-price-change"], .instrument-price_change__KQzyA');
      const changePercentElement = document.querySelector('[data-test="instrument-price-change-percent"], .instrument-price_change-percent__KQzyA');
      
      const priceText = priceElement?.textContent?.trim() || '0';
      const changeText = changeElement?.textContent?.trim() || '0';
      const changePercentText = changePercentElement?.textContent?.trim() || '0';
      
      // Limpar e converter valores
      const price = parseFloat(priceText.replace(/[^0-9.-]/g, ''));
      const change = parseFloat(changeText.replace(/[^0-9.-]/g, ''));
      const changePercent = parseFloat(changePercentText.replace(/[^0-9.-]/g, ''));
      
      return {
        price: isNaN(price) ? 0 : price,
        change: isNaN(change) ? 0 : change,
        changePercent: isNaN(changePercent) ? 0 : changePercent
      };
    });
    
    console.log(`✅ Dados de ${pair}:`, data);
    
    return {
      pair,
      price: data.price,
      change: data.change,
      changePercent: data.changePercent,
      timestamp: new Date()
    };
    
  } catch (error) {
    console.error(`❌ Erro ao buscar dados do par ${pair}:`, error);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Buscar dados de múltiplos pares de moedas em paralelo
 */
export async function scrapeMultipleForexPairs(pairs: string[]): Promise<ForexPairData[]> {
  console.log(`🔍 Buscando dados de ${pairs.length} pares de moedas...`);
  
  const promises = pairs.map(pair => scrapeForexPairData(pair));
  const results = await Promise.allSettled(promises);
  
  const successfulResults = results
    .filter((result): result is PromiseFulfilledResult<ForexPairData | null> => 
      result.status === 'fulfilled' && result.value !== null
    )
    .map(result => result.value as ForexPairData);
  
  console.log(`✅ Coletados dados de ${successfulResults.length}/${pairs.length} pares`);
  return successfulResults;
}

/**
 * Mapeamento de indicadores para slugs do Investing.com
 */
export const INVESTING_INDICATORS = {
  NFP: 'non-farm-payrolls-227',
  UNEMPLOYMENT: 'unemployment-rate-300',
  PMI_MANUFACTURING: 'ism-manufacturing-pmi-176',
  PMI_SERVICES: 'ism-services-pmi-177',
  HOUSING_STARTS: 'housing-starts-153',
  BUILDING_PERMITS: 'building-permits-154',
  HOUSING_SALES: 'existing-home-sales-155',
  NEW_HOME_SALES: 'new-home-sales-222',
  GDP: 'gdp-annual-growth-rate-374',
  GDP_QUARTERLY: 'gdp-growth-rate-375',
  FOMC: 'fomc-interest-rate-decision-168',
  CPI: 'cpi-168',
  RETAIL_SALES: 'retail-sales-256',
  INDUSTRIAL_PRODUCTION: 'industrial-production-185'
};

/**
 * Pares de Forex suportados no Investing.com
 */
export const INVESTING_FOREX_PAIRS = {
  'EUR/USD': 'eur-usd',
  'USD/JPY': 'usd-jpy',
  'USD/CHF': 'usd-chf',
  'USD/CAD': 'usd-cad',
  'EUR/JPY': 'eur-jpy',
  'CHF/JPY': 'chf-jpy',
  'GBP/USD': 'gbp-usd',
  'AUD/USD': 'aud-usd',
  'NZD/USD': 'nzd-usd',
  'EUR/GBP': 'eur-gbp'
};

/**
 * Cache simples para evitar requisições excessivas
 */
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minuto

export function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
}

export function setCachedData(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Wrapper com cache para calendário econômico
 */
export async function getEconomicCalendarWithCache(): Promise<InvestingNewsData[]> {
  const cacheKey = 'economic-calendar';
  const cached = getCachedData<InvestingNewsData[]>(cacheKey);
  
  if (cached) {
    console.log('📦 Usando dados em cache do calendário econômico');
    return cached;
  }
  
  const data = await scrapeTodayEconomicCalendar();
  setCachedData(cacheKey, data);
  return data;
}

/**
 * Wrapper com cache para pares de moedas
 */
export async function getForexPairWithCache(pair: string): Promise<ForexPairData | null> {
  const cacheKey = `forex-${pair}`;
  const cached = getCachedData<ForexPairData>(cacheKey);
  
  if (cached) {
    console.log(`📦 Usando dados em cache de ${pair}`);
    return cached;
  }
  
  const data = await scrapeForexPairData(pair);
  if (data) {
    setCachedData(cacheKey, data);
  }
  return data;
}
