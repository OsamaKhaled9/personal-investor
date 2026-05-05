import { NextRequest, NextResponse } from "next/server";
import { getMultipleQuotes } from "@/lib/yahoo-finance";
import { scrapeEGXTopMovers, EGX_KNOWN_TICKERS } from "@/lib/egx-scraper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // caching handled per-fetch inside fetchEGXQuoteRaw()

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "known"; // "known" | "movers"

  if (mode === "movers") {
    const movers = await scrapeEGXTopMovers();
    return NextResponse.json({ movers });
  }

  const tickers = EGX_KNOWN_TICKERS.map((t) => ({ ticker: t.ticker, market: "EGX" as const }));
  const quotes = await getMultipleQuotes(tickers);
  return NextResponse.json({ quotes });
}
