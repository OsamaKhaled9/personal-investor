import { NextRequest, NextResponse } from "next/server";
import { getQuote, computeTechnicals } from "@/lib/yahoo-finance";
import { EGX_KNOWN_TICKERS } from "@/lib/egx-scraper";
import { screenStock } from "@/lib/halal-screener";
import { analyzeStock } from "@/lib/ai";
import type { Market, StockQuote, Currency } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker");
  const market = (searchParams.get("market") ?? "EGX") as Market;

  if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 });

  const [quote, halal, technicals] = await Promise.all([
    getQuote(ticker, market),
    screenStock(ticker, market),
    computeTechnicals(ticker, market),
  ]);

  // If no live price, build a minimal stub so AI analysis still runs
  const effectiveQuote: StockQuote = quote ?? {
    ticker,
    name: EGX_KNOWN_TICKERS.find((t) => t.ticker === ticker)?.name ?? ticker,
    price: 0,
    currency: (market === "EGX" ? "EGP" : "USD") as Currency,
    change: 0,
    changePercent: 0,
    volume: 0,
    market,
    lastUpdated: new Date().toISOString(),
  };

  const analysis = await analyzeStock({ quote: effectiveQuote, halal, technicals });

  return NextResponse.json({
    quote: effectiveQuote,
    livePrice: !!quote,
    halal,
    technical: technicals,
    aiSummary: analysis.summary,
    recommendation: analysis.recommendation,
    risks: analysis.risks,
    targetPrice: analysis.targetPrice,
  });
}
