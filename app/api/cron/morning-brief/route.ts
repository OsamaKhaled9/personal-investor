import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getMultipleQuotes } from "@/lib/yahoo-finance";
import { getCachedNews, fetchAndCacheNews } from "@/lib/news-aggregator";
import { generateMorningBrief } from "@/lib/ai";
import { sendMessage } from "@/lib/telegram";
import type { PortfolioHoldingRow, Market, Holding } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: rows } = await supabaseAdmin.from("portfolio_holdings").select("*");
  const holdings = (rows ?? []) as PortfolioHoldingRow[];
  const tickers = holdings.map((h) => ({ ticker: h.ticker, market: h.market as Market }));

  const quotes = tickers.length > 0 ? await getMultipleQuotes(tickers) : [];
  const priceMap = new Map(quotes.map((q) => [q.ticker, q]));

  // USD/EGP rate
  let usdToEgp = 50;
  try {
    const fx = await getMultipleQuotes([{ ticker: "USDEGP=X", market: "US" }]);
    if (fx[0]) usdToEgp = fx[0].price;
  } catch {}

  const enrichedHoldings: Holding[] = holdings.map((h) => {
    const q = priceMap.get(h.ticker);
    const currentPrice = q?.price ?? h.avg_cost_price;
    const currentValue = h.shares * currentPrice;
    const costBasis = h.shares * h.avg_cost_price;
    const unrealizedGain = currentValue - costBasis;
    const unrealizedGainPercent = costBasis > 0 ? (unrealizedGain / costBasis) * 100 : 0;
    return {
      id: h.id, ticker: h.ticker, name: q?.name ?? h.name, market: h.market as Market,
      currency: h.currency, shares: h.shares, avgCostPrice: h.avg_cost_price,
      currentPrice, currentValue, costBasis, unrealizedGain, unrealizedGainPercent,
    };
  });

  const totalCostEGP = enrichedHoldings.reduce((s, h) => s + (h.currency === "USD" ? h.costBasis * usdToEgp : h.costBasis), 0);
  const totalValueEGP = enrichedHoldings.reduce((s, h) => s + (h.currency === "USD" ? h.currentValue * usdToEgp : h.currentValue), 0);
  const totalUnrealizedGainEGP = totalValueEGP - totalCostEGP;
  const totalUnrealizedGainPercent = totalCostEGP > 0 ? (totalUnrealizedGainEGP / totalCostEGP) * 100 : 0;

  const portfolio = { holdings: enrichedHoldings, totalValueEGP, totalCostEGP, totalUnrealizedGainEGP, totalUnrealizedGainPercent, lastUpdated: new Date().toISOString() };

  // Refresh news
  const tickerSymbols = holdings.map((h) => h.ticker);
  await fetchAndCacheNews(tickerSymbols);
  const news = await getCachedNews(5);

  // EGX movers (use cached portfolio quotes as proxy)
  const egxMovers = quotes.filter((q) => q.market === "EGX").map((q) => ({ ticker: q.ticker, changePercent: q.changePercent }));

  const brief = await generateMorningBrief({ portfolio, egxMovers, news: news.map((n) => ({ title: n.title, sentiment: n.sentiment })), usdToEgp });
  await sendMessage(brief);

  return NextResponse.json({ ok: true });
}
