import yahooFinance from "yahoo-finance2";
import type { StockQuote, Market, Currency, TechnicalSignals } from "./types";
import { scrapeEGXQuote, EGX_KNOWN_TICKERS } from "./egx-scraper";
import { fetchUSFundamentalsAV } from "./alpha-vantage";

// Direct Yahoo Finance v8 chart API — bypasses yahoo-finance2 library quirks for EGX .CA tickers.
// yahoo-finance2 v3.x silently returns empty quotes for EGX even though the raw endpoint works fine.
const YF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json",
};

// Uses the same v8/chart endpoint as EGX — no crumb required, confirmed working server-side.
// The v7/quote endpoint requires a crumb token that must be fetched first; v8/chart does not.
async function fetchUSQuoteRaw(ticker: string): Promise<StockQuote | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
    const res = await fetch(url, { headers: YF_HEADERS, next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const timestamps: number[] = result.timestamp ?? [];
    const q = result.indicators?.quote?.[0] ?? {};
    const closes: (number | null)[] = q.close ?? [];
    const volumes: (number | null)[] = q.volume ?? [];

    let idx = closes.length - 1;
    while (idx >= 0 && (closes[idx] == null || closes[idx]! <= 0)) idx--;
    if (idx < 0) return null;

    const price = closes[idx]!;
    const prevClose: number =
      (idx > 0 ? (closes[idx - 1] ?? null) : null) ?? result.meta?.chartPreviousClose ?? 0;
    const change = prevClose > 0 ? price - prevClose : 0;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      ticker,
      name: (result.meta?.shortName as string) ?? (result.meta?.longName as string) ?? ticker,
      price,
      currency: "USD",
      change,
      changePercent,
      volume: (volumes[idx] as number) ?? 0,
      marketCap: result.meta?.marketCap as number | undefined,
      high52w: result.meta?.fiftyTwoWeekHigh as number | undefined,
      low52w: result.meta?.fiftyTwoWeekLow as number | undefined,
      market: "US",
      lastUpdated: timestamps[idx]
        ? new Date(timestamps[idx] * 1000).toISOString()
        : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

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

    const price = closes[idx]!;
    const prevClose: number =
      (idx > 0 ? (closes[idx - 1] ?? null) : null) ?? result.meta?.chartPreviousClose ?? 0;
    const change = prevClose > 0 ? price - prevClose : 0;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      ticker,
      name: stockName,
      price,
      currency: "EGP",
      change,
      changePercent,
      volume: (volumes[idx] as number) ?? 0,
      marketCap: result.meta?.marketCap as number | undefined,
      high52w: result.meta?.fiftyTwoWeekHigh as number | undefined,
      low52w: result.meta?.fiftyTwoWeekLow as number | undefined,
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

  // US stocks — use raw v7 fetch (yahooFinance.quote() has same init bug as EGX chart)
  return fetchUSQuoteRaw(ticker);
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
  // Both EGX and US now use raw v8/chart — yahoo-finance2 library chart is broken for all markets
  if (market === "EGX") {
    return fetchEGXHistoryRaw(ticker.replace(/\.(CA|EG)$/i, ""), period);
  }

  // US: same v8/chart endpoint, no suffix needed
  const rangeMap: Record<string, string> = {
    "1d": "5d", "1w": "5d", "1m": "1mo", "3m": "3mo", "1y": "1y",
  };
  const intervalMap: Record<string, string> = {
    "1d": "1d", "1w": "1d", "1m": "1d", "3m": "1d", "1y": "1wk",
  };
  try {
    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
      `?interval=${intervalMap[period]}&range=${rangeMap[period]}`;
    const res = await fetch(url, { headers: YF_HEADERS, next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return [];
    const timestamps: number[] = result.timestamp ?? [];
    const q = result.indicators?.quote?.[0] ?? {};
    return timestamps
      .map((ts: number, i: number) => ({
        date: new Date(ts * 1000).toISOString().split("T")[0],
        open: (q.open?.[i] as number) ?? 0,
        high: (q.high?.[i] as number) ?? 0,
        low: (q.low?.[i] as number) ?? 0,
        close: (q.close?.[i] as number) ?? 0,
        volume: (q.volume?.[i] as number) ?? 0,
      }))
      .filter((row) => row.close > 0);
  } catch {
    return [];
  }
}

// Yahoo Finance v10 quoteSummary — bypasses yahoo-finance2 library (same init bug as chart/quote).
// Values are returned as {raw: number, fmt: string} objects; extract .raw for numeric fields.
function rawNum(x: unknown): number | null {
  if (x == null) return null;
  if (typeof x === "number") return x;
  if (typeof x === "object" && "raw" in (x as object)) return (x as { raw: number }).raw;
  return null;
}

export async function getFundamentals(ticker: string, market: Market) {
  if (market === "US") {
    const av = await fetchUSFundamentalsAV(ticker);
    if (av) return av;
  }

  const yt = bestYahooTicker(ticker, market);
  try {
    const modules = "defaultKeyStatistics,summaryDetail,financialData,incomeStatementHistory,balanceSheetHistory";
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(yt)}?modules=${encodeURIComponent(modules)}`;
    const res = await fetch(url, { headers: YF_HEADERS, next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r: any = data?.quoteSummary?.result?.[0];
    if (!r) return null;

    return {
      totalDebt: rawNum(r.financialData?.totalDebt),
      marketCap: rawNum(r.summaryDetail?.marketCap),
      totalRevenue: rawNum(r.financialData?.totalRevenue),
      totalCash: rawNum(r.financialData?.totalCash),
      debtToEquity: rawNum(r.financialData?.debtToEquity),
      sector: (r.defaultKeyStatistics?.sector as string) ?? null,
      industry: (r.defaultKeyStatistics?.industry as string) ?? null,
      businessSummary: null,
      interestExpense: rawNum(r.incomeStatementHistory?.incomeStatementHistory?.[0]?.interestExpense),
      totalAssets: rawNum(r.balanceSheetHistory?.balanceSheetStatements?.[0]?.totalAssets),
      netReceivables: rawNum(r.balanceSheetHistory?.balanceSheetStatements?.[0]?.netReceivables),
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
