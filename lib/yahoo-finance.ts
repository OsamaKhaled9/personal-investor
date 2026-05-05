import yahooFinance from "yahoo-finance2";
import type { StockQuote, Market, Currency, TechnicalSignals } from "./types";
import { scrapeEGXQuote, EGX_KNOWN_TICKERS } from "./egx-scraper";

// Direct Yahoo Finance v8 chart API — bypasses yahoo-finance2 library quirks for EGX .CA tickers.
// yahoo-finance2 v3.x silently returns empty quotes for EGX even though the raw endpoint works fine.
const YF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json",
};

async function fetchEGXQuoteRaw(ticker: string): Promise<StockQuote | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}.CA?interval=1d&range=5d`;
    const res = await fetch(url, {
      headers: YF_HEADERS,
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const timestamps: number[] = result.timestamp ?? [];
    const q = result.indicators?.quote?.[0] ?? {};
    const closes: (number | null)[] = q.close ?? [];
    const volumes: (number | null)[] = q.volume ?? [];

    // Walk back from the end to find the last valid (non-null) close — skips weekends/holidays
    let idx = closes.length - 1;
    while (idx >= 0 && (closes[idx] == null || closes[idx]! <= 0)) idx--;

    const knownName = EGX_KNOWN_TICKERS.find((t) => t.ticker === ticker)?.name;
    const stockName =
      (result.meta?.shortName as string) ??
      (result.meta?.longName as string) ??
      knownName ??
      ticker;

    // Edge case: some EGX tickers exist on Yahoo but have no chart data (e.g. ESRS).
    // Fall back to meta.chartPreviousClose — better than returning null → price: 0.
    if (idx < 0) {
      const metaClose: number =
        (result.meta?.chartPreviousClose as number) ??
        (result.meta?.regularMarketPrice as number) ??
        0;
      if (metaClose <= 0) return null;
      return {
        ticker,
        name: stockName,
        price: metaClose,
        currency: "EGP",
        change: 0,
        changePercent: 0,
        volume: 0,
        market: "EGX",
        lastUpdated: new Date().toISOString(),
      };
    }

    const close = closes[idx]!;
    const prevClose: number =
      (idx > 0 ? (closes[idx - 1] ?? null) : null) ?? result.meta?.chartPreviousClose ?? 0;
    const change = prevClose > 0 ? close - prevClose : 0;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      ticker,
      name: stockName,
      price: close,
      currency: "EGP",
      change,
      changePercent,
      volume: (volumes[idx] as number) ?? 0,
      market: "EGX",
      lastUpdated: timestamps[idx]
        ? new Date(timestamps[idx] * 1000).toISOString()
        : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function fetchEGXHistoryRaw(
  ticker: string,
  period: "1d" | "1w" | "1m" | "3m" | "1y"
): Promise<{ date: string; open: number; high: number; low: number; close: number; volume: number }[]> {
  try {
    const rangeMap: Record<string, string> = {
      "1d": "5d", "1w": "5d", "1m": "1mo", "3m": "3mo", "1y": "1y",
    };
    const intervalMap: Record<string, string> = {
      "1d": "1d", "1w": "1d", "1m": "1d", "3m": "1d", "1y": "1wk",
    };
    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}.CA` +
      `?interval=${intervalMap[period]}&range=${rangeMap[period]}`;

    const res = await fetch(url, {
      headers: YF_HEADERS,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp ?? [];
    const q = result.indicators?.quote?.[0] ?? {};
    const opens: (number | null)[] = q.open ?? [];
    const highs: (number | null)[] = q.high ?? [];
    const lows: (number | null)[] = q.low ?? [];
    const closes: (number | null)[] = q.close ?? [];
    const volumes: (number | null)[] = q.volume ?? [];

    return timestamps
      .map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().split("T")[0],
        open: opens[i] ?? 0,
        high: highs[i] ?? 0,
        low: lows[i] ?? 0,
        close: closes[i] ?? 0,
        volume: volumes[i] ?? 0,
      }))
      .filter((row) => row.close > 0);
  } catch {
    return [];
  }
}

export async function getQuote(ticker: string, market: Market): Promise<StockQuote | null> {
  const currency: Currency = market === "EGX" ? "EGP" : "USD";

  if (market === "EGX") {
    const cleanTicker = ticker.replace(/\.(CA|EG)$/i, "");

    // Primary: direct Yahoo Finance v8 fetch with .CA suffix — library chart API broken for EGX
    const yahooChart = await fetchEGXQuoteRaw(cleanTicker);
    if (yahooChart) return yahooChart;

    // Fallback: EGX website scraper
    const scraped = await scrapeEGXQuote(cleanTicker);
    if (scraped) return scraped;

    // Last resort: named stub so the UI doesn't break
    const known = EGX_KNOWN_TICKERS.find((t) => t.ticker === cleanTicker);
    if (known) {
      return {
        ticker: cleanTicker,
        name: known.name,
        price: 0,
        currency,
        change: 0,
        changePercent: 0,
        volume: 0,
        market,
        lastUpdated: new Date().toISOString(),
      };
    }
    return null;
  }

  // US stocks — straightforward
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await yahooFinance.quote(ticker, {}, { validateResult: false });
    if (!result?.regularMarketPrice) return null;
    return {
      ticker,
      name: result.longName ?? result.shortName ?? ticker,
      price: result.regularMarketPrice ?? 0,
      currency,
      change: result.regularMarketChange ?? 0,
      changePercent: result.regularMarketChangePercent ?? 0,
      volume: result.regularMarketVolume ?? 0,
      marketCap: result.marketCap,
      peRatio: result.trailingPE,
      high52w: result.fiftyTwoWeekHigh,
      low52w: result.fiftyTwoWeekLow,
      market,
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function getMultipleQuotes(
  tickers: Array<{ ticker: string; market: Market }>
): Promise<StockQuote[]> {
  const results = await Promise.allSettled(
    tickers.map(({ ticker, market }) => getQuote(ticker, market))
  );
  return results
    .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value);
}

function bestYahooTicker(ticker: string, market: Market): string {
  if (market !== "EGX") return ticker;
  const clean = ticker.replace(/\.(CA|EG)$/i, "");
  return `${clean}.CA`; // default to .CA for historical; getQuote tries all variants
}

export async function getHistoricalPrices(
  ticker: string,
  market: Market,
  period: "1d" | "1w" | "1m" | "3m" | "1y"
): Promise<{ date: string; open: number; high: number; low: number; close: number; volume: number }[]> {
  // EGX: use direct v8 fetch (yahoo-finance2 chart broken for .CA tickers)
  if (market === "EGX") {
    return fetchEGXHistoryRaw(ticker.replace(/\.(CA|EG)$/i, ""), period);
  }

  const yt = bestYahooTicker(ticker, market);
  const periodMap: Record<string, { period1: Date; interval: "1d" | "1wk" | "1mo" }> = {
    "1d": { period1: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), interval: "1d" },
    "1w": { period1: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), interval: "1d" },
    "1m": { period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), interval: "1d" },
    "3m": { period1: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), interval: "1d" },
    "1y": { period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), interval: "1wk" },
  };

  try {
    const { period1, interval } = periodMap[period];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await yahooFinance.chart(yt, {
      period1: period1.toISOString().split("T")[0],
      interval,
    }, { validateResult: false });

    return (result.quotes ?? []).map((q: Record<string, number | string>) => ({
      date: new Date(q.date as string).toISOString().split("T")[0],
      open: (q.open as number) ?? 0,
      high: (q.high as number) ?? 0,
      low: (q.low as number) ?? 0,
      close: (q.close as number) ?? 0,
      volume: (q.volume as number) ?? 0,
    }));
  } catch {
    return [];
  }
}

export async function getFundamentals(ticker: string, market: Market) {
  const yt = bestYahooTicker(ticker, market);
  try {
    const [summary, financials] = await Promise.allSettled([
      yahooFinance.quoteSummary(yt, { modules: ["defaultKeyStatistics", "summaryDetail", "financialData"] }, { validateResult: false }),
      yahooFinance.quoteSummary(yt, { modules: ["incomeStatementHistory", "balanceSheetHistory"] }, { validateResult: false }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s: any = summary.status === "fulfilled" ? summary.value : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f: any = financials.status === "fulfilled" ? financials.value : null;

    return {
      totalDebt: s?.financialData?.totalDebt ?? null,
      marketCap: s?.summaryDetail?.marketCap ?? null,
      totalRevenue: s?.financialData?.totalRevenue ?? null,
      totalCash: s?.financialData?.totalCash ?? null,
      debtToEquity: s?.financialData?.debtToEquity ?? null,
      sector: s?.defaultKeyStatistics?.sector ?? null,
      industry: s?.defaultKeyStatistics?.industry ?? null,
      businessSummary: null,
      interestExpense: f?.incomeStatementHistory?.incomeStatementHistory?.[0]?.interestExpense ?? null,
      totalAssets: f?.balanceSheetHistory?.balanceSheetStatements?.[0]?.totalAssets ?? null,
      netReceivables: f?.balanceSheetHistory?.balanceSheetStatements?.[0]?.netReceivables ?? null,
    };
  } catch {
    return null;
  }
}

export async function computeTechnicals(ticker: string, market: Market): Promise<TechnicalSignals | null> {
  const prices = await getHistoricalPrices(ticker, market, "1y");
  if (prices.length < 26) return null;

  const closes = prices.map((p) => p.close);

  // RSI (14-period)
  const rsi = computeRSI(closes, 14);

  // MACD (12/26/9)
  const macd = computeMACD(closes);

  // 50/200 MA
  const ma50 = average(closes.slice(-50));
  const ma200 = average(closes.slice(-200));

  // Score 0-100
  let score = 50;
  if (rsi < 30) score += 20;
  else if (rsi > 70) score -= 20;
  if (macd.histogram > 0) score += 15;
  else score -= 15;
  if (ma50 > ma200) score += 15;
  else score -= 15;
  score = Math.max(0, Math.min(100, score));

  return {
    rsi: Math.round(rsi * 100) / 100,
    rsiSignal: rsi > 70 ? "overbought" : rsi < 30 ? "oversold" : "neutral",
    macdSignal: macd.histogram > 0 ? "bullish" : macd.histogram < 0 ? "bearish" : "neutral",
    ma50Above200: ma50 > ma200,
    score,
  };
}

function average(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function computeRSI(prices: number[], period: number): number {
  if (prices.length < period + 1) return 50;
  const changes = prices.slice(1).map((p, i) => p - prices[i]);
  const gains = changes.map((c) => (c > 0 ? c : 0));
  const losses = changes.map((c) => (c < 0 ? Math.abs(c) : 0));
  const avgGain = average(gains.slice(-period));
  const avgLoss = average(losses.slice(-period));
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function computeMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = computeEMA(prices, 12);
  const ema26 = computeEMA(prices, 26);
  const macdLine = ema12 - ema26;
  // Signal is approximated as a simple 9-period trailing average of the last MACD values
  const macdValues = prices.slice(26).map((_, i) => {
    const subset = prices.slice(0, 26 + i + 1);
    return computeEMA(subset, 12) - computeEMA(subset, 26);
  });
  const signal = macdValues.length >= 9 ? average(macdValues.slice(-9)) : macdLine;
  return { macd: macdLine, signal, histogram: macdLine - signal };
}

function computeEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const k = 2 / (period + 1);
  let ema = average(prices.slice(0, period));
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}
