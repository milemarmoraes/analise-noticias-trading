import puppeteer from 'puppeteer';

export interface InvestingNewsData {
  date: string;
  time: string;
  currency: string;
  event: string;
  actual: string;
  forecast: string;
  previous: string;
  impact: number; // 1, 2, or 3 stars
}

/**
 * Scraper para coletar dados do Investing.com
 * Foca em notícias de impacto ★★★ (3 estrelas)
 */
export async function scrapeInvestingData(indicator: string): Promise<InvestingNewsData[]> {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Configurar user agent para evitar bloqueios
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const slug = INVESTING_INDICATORS[indicator as keyof typeof INVESTING_INDICATORS];
    if (!slug) {
      console.error(`Indicador ${indicator} não encontrado`);
      return [];
    }
    
    const url = `https://www.investing.com/economic-calendar/${slug}`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Aguardar tabela carregar
    await page.waitForSelector('.economicCalendarTable, #economicCalendarData', { timeout: 10000 });
    
    // Extrair dados
    const data = await page.evaluate(() => {
      const rows = document.querySelectorAll('.economicCalendarTable tbody tr, #economicCalendarData tr');
      const results: any[] = [];
      
      for (let i = 0; i < Math.min(rows.length, 12); i++) {
        const row = rows[i];
        const cells = row.querySelectorAll('td');
        
        if (cells.length >= 7) {
          // Verificar impacto (3 estrelas)
          const impactCell = row.querySelector('.sentiment, .grayFullBullishIcon');
          const impactStars = impactCell?.querySelectorAll('.grayFullBullishIcon').length || 0;
          
          // Coletar apenas notícias de alto impacto (3 estrelas)
          if (impactStars === 3) {
            results.push({
              date: cells[0]?.textContent?.trim() || '',
              time: cells[1]?.textContent?.trim() || '',
              currency: cells[2]?.textContent?.trim() || '',
              event: cells[3]?.textContent?.trim() || '',
              actual: cells[4]?.textContent?.trim() || '',
              forecast: cells[5]?.textContent?.trim() || '',
              previous: cells[6]?.textContent?.trim() || '',
              impact: impactStars
            });
          }
        }
      }
      
      return results;
    });
    
    return data;
  } catch (error) {
    console.error('Erro ao fazer scraping do Investing.com:', error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Buscar calendário econômico completo do dia
 */
export async function scrapeTodayEconomicCalendar(): Promise<InvestingNewsData[]> {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const url = 'https://www.investing.com/economic-calendar/';
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    await page.waitForSelector('#economicCalendarData', { timeout: 10000 });
    
    const data = await page.evaluate(() => {
      const rows = document.querySelectorAll('#economicCalendarData tr.js-event-item');
      const results: any[] = [];
      
      rows.forEach((row) => {
        const impactElement = row.querySelector('.sentiment');
        const impactClass = impactElement?.className || '';
        
        // Filtrar apenas eventos de alto impacto (3 estrelas)
        if (impactClass.includes('grayFullBullishIcon')) {
          const impactStars = (impactElement?.querySelectorAll('.grayFullBullishIcon').length || 0);
          
          if (impactStars === 3) {
            results.push({
              date: row.querySelector('.date')?.textContent?.trim() || '',
              time: row.querySelector('.time')?.textContent?.trim() || '',
              currency: row.querySelector('.flagCur')?.textContent?.trim() || '',
              event: row.querySelector('.event a')?.textContent?.trim() || '',
              actual: row.querySelector('.act')?.textContent?.trim() || '',
              forecast: row.querySelector('.fore')?.textContent?.trim() || '',
              previous: row.querySelector('.prev')?.textContent?.trim() || '',
              impact: impactStars
            });
          }
        }
      });
      
      return results;
    });
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar calendário econômico:', error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Analisar variação percentual de um par de moedas
 */
export async function scrapeForexPairData(pair: string): Promise<any> {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const pairSlug = pair.replace('/', '-').toLowerCase();
    const url = `https://www.investing.com/currencies/${pairSlug}`;
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    const data = await page.evaluate(() => {
      const priceElement = document.querySelector('[data-test="instrument-price-last"]');
      const changeElement = document.querySelector('[data-test="instrument-price-change"]');
      const changePercentElement = document.querySelector('[data-test="instrument-price-change-percent"]');
      
      return {
        price: priceElement?.textContent?.trim() || '',
        change: changeElement?.textContent?.trim() || '',
        changePercent: changePercentElement?.textContent?.trim() || ''
      };
    });
    
    return data;
  } catch (error) {
    console.error(`Erro ao buscar dados do par ${pair}:`, error);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
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
  GDP: 'gdp-annual-growth-rate-374',
  FOMC: 'fomc-interest-rate-decision-168'
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
  'CHF/JPY': 'chf-jpy'
};
