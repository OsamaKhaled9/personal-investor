import { NextResponse } from "next/server";
import { getMultipleQuotes } from "@/lib/yahoo-finance";
import { US_HALAL_TICKERS } from "@/lib/us-stocks";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  const tickers = US_HALAL_TICKERS.map((t) => ({ ticker: t.ticker, market: "US" as const }));
  const quotes = await getMultipleQuotes(tickers);
  return NextResponse.json({ quotes });
}
