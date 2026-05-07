import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getMultipleQuotes } from "@/lib/yahoo-finance";
import type { Market } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return new NextResponse("Unauthorized", { status: 401 });

  const { data: holdings } = await supabaseAdmin
    .from("portfolio_holdings")
    .select("ticker, market, currency, manual_price");

  if (!holdings?.length) return NextResponse.json({ snapshotted: 0 });

  const today = new Date().toISOString().split("T")[0];
  const rows: object[] = [];

  const unique = Array.from(
    new Map(holdings.map((h) => [`${h.ticker}:${h.market}`, h])).values()
  );

  const quotes = await getMultipleQuotes(
    unique.map((h) => ({ ticker: h.ticker, market: h.market as Market }))
  );

  for (const q of quotes) {
    if (q.price > 0) {
      rows.push({
        ticker: q.ticker,
        market: q.market,
        trading_date: today,
        price: q.price,
        change_percent: q.changePercent,
        currency: q.currency,
        source: "yahoo",
      });
    }
  }

  for (const h of holdings) {
    const alreadySnapshotted = rows.some((r) => (r as { ticker: string }).ticker === h.ticker);
    if (h.manual_price && h.manual_price > 0 && !alreadySnapshotted) {
      rows.push({
        ticker: h.ticker,
        market: h.market,
        trading_date: today,
        price: h.manual_price,
        change_percent: 0,
        currency: h.currency,
        source: "manual",
      });
    }
  }

  if (rows.length > 0) {
    await supabaseAdmin
      .from("price_snapshots")
      .upsert(rows, { onConflict: "ticker,market,trading_date" });
  }

  return NextResponse.json({ snapshotted: rows.length, date: today });
}
