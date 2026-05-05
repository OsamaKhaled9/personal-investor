import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getMultipleQuotes } from "@/lib/yahoo-finance";
import { screenStock } from "@/lib/halal-screener";
import { sendMessage, sendHalalAlert } from "@/lib/telegram";
import type { PortfolioHoldingRow, Market } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: rows } = await supabaseAdmin.from("portfolio_holdings").select("*");
  const holdings = (rows ?? []) as PortfolioHoldingRow[];
  if (holdings.length === 0) return NextResponse.json({ ok: true, message: "No holdings" });

  const tickers = holdings.map((h) => ({ ticker: h.ticker, market: h.market as Market }));
  const quotes = await getMultipleQuotes(tickers);
  const priceMap = new Map(quotes.map((q) => [q.ticker, q]));

  // Re-screen all holdings (uses cached results unless expired)
  const halalResults = await Promise.all(
    holdings.map(async (h) => {
      const result = await screenStock(h.ticker, h.market as Market);
      return { ticker: h.ticker, result };
    })
  );

  const concerns = halalResults.filter((r) => r.result.status !== "halal");

  // Build weekly report
  let report = `📊 *Weekly Portfolio Health Check*\n\n`;
  for (const h of holdings) {
    const q = priceMap.get(h.ticker);
    const price = q?.price ?? h.avg_cost_price;
    const gainPercent = ((price - h.avg_cost_price) / h.avg_cost_price) * 100;
    const icon = gainPercent >= 0 ? "📈" : "📉";
    const halalResult = halalResults.find((r) => r.ticker === h.ticker)?.result;
    const halalIcon = halalResult?.status === "halal" ? "✅" : halalResult?.status === "haram" ? "❌" : "⚠️";
    report += `${icon}${halalIcon} *${h.ticker}*: ${price} ${h.currency} (${gainPercent > 0 ? "+" : ""}${gainPercent.toFixed(1)}%)\n`;
  }

  if (concerns.length > 0) {
    report += `\n⚠️ *Halal Concerns:*\n`;
    for (const c of concerns) {
      report += `• ${c.ticker}: ${c.result.status} — ${c.result.reasons[0]}\n`;
      await sendHalalAlert(c.ticker, c.result);
    }
  } else {
    report += `\n✅ All holdings pass halal screening.`;
  }

  await sendMessage(report);
  return NextResponse.json({ ok: true });
}
