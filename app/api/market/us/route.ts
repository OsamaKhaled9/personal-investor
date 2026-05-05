import { NextRequest, NextResponse } from "next/server";
import { getQuote, getHistoricalPrices } from "@/lib/yahoo-finance";
import type { Market } from "@/lib/types";

export const runtime = "nodejs";

// Unified quote endpoint — handles both EGX and US stocks
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker");
  const market = (searchParams.get("market") ?? "US") as Market;
  const period = (searchParams.get("period") ?? "1m") as "1d" | "1w" | "1m" | "3m" | "1y";

  if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 });

  const [quote, history] = await Promise.all([
    getQuote(ticker, market),
    getHistoricalPrices(ticker, market, period),
  ]);

  if (!quote) return NextResponse.json({ error: "Stock not found" }, { status: 404 });
  return NextResponse.json({ quote, history });
}
