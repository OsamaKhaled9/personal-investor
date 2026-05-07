import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getMultipleQuotes } from "@/lib/yahoo-finance";
import type { Holding, Portfolio, PortfolioHoldingRow, Currency } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  let rows, error;
  try {
    ({ data: rows, error } = await supabaseAdmin
      .from("portfolio_holdings")
      .select("*")
      .order("created_at", { ascending: true }));
  } catch (e) {
    console.error("[portfolio GET]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  if (error) {
    console.error("[portfolio GET] supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!rows || rows.length === 0) {
    return NextResponse.json({ holdings: [], totalValueEGP: 0, totalCostEGP: 0, totalUnrealizedGainEGP: 0, totalUnrealizedGainPercent: 0, lastUpdated: new Date().toISOString() } satisfies Portfolio);
  }

  const today = new Date().toISOString().split("T")[0];
  const tickers = (rows as PortfolioHoldingRow[]).map((r) => r.ticker);

  // Phase 1: check Supabase snapshot cache for today
  const { data: snapshots } = await supabaseAdmin
    .from("price_snapshots")
    .select("ticker, market, price, change_percent, currency")
    .in("ticker", tickers)
    .eq("trading_date", today);

  const snapshotMap = new Map(
    (snapshots ?? []).map((s) => [s.ticker, s])
  );

  // Phase 2: live Yahoo fetch only for tickers without today's snapshot
  const needsLive = (rows as PortfolioHoldingRow[])
    .filter((r) => !snapshotMap.has(r.ticker))
    .map((r) => ({ ticker: r.ticker, market: r.market }));

  const liveQuotes = needsLive.length > 0
    ? await getMultipleQuotes(needsLive)
    : [];

  // Merge snapshots + live quotes into one unified quoteMap
  const quoteMap = new Map<string, { price: number; changePercent: number; name?: string; currency: Currency }>();
  for (const s of (snapshots ?? [])) {
    quoteMap.set(s.ticker, { price: s.price, changePercent: s.change_percent, currency: s.currency as Currency });
  }
  for (const q of liveQuotes) {
    quoteMap.set(q.ticker, { price: q.price, changePercent: q.changePercent, name: q.name, currency: q.currency });
    // Fire-and-forget: write live quote as today's snapshot so next request hits cache
    supabaseAdmin.from("price_snapshots").upsert({
      ticker: q.ticker, market: q.market, trading_date: today,
      price: q.price, change_percent: q.changePercent, currency: q.currency, source: "yahoo",
    }, { onConflict: "ticker,market,trading_date" }).then(() => {});
  }

  // Fetch USD/EGP rate
  let usdToEgp = 50; // fallback
  try {
    const fx = await getMultipleQuotes([{ ticker: "USDEGP=X", market: "US" }]);
    if (fx[0]) usdToEgp = fx[0].price;
  } catch {}

  const holdings: Holding[] = (rows as PortfolioHoldingRow[]).map((row) => {
    const q = quoteMap.get(row.ticker);
    // Treat price=0 from stub as "no live data" — nullish coalescing alone won't catch 0
    const livePrice = q && q.price > 0 ? q.price : undefined;
    const hasManual = row.manual_price != null && row.manual_price > 0;
    const currentPrice = livePrice ?? (hasManual ? row.manual_price! : row.avg_cost_price);
    const priceSource: "live" | "manual" | undefined =
      livePrice ? "live" : hasManual ? "manual" : undefined;
    const currency = row.currency;
    const currentValue = row.shares * currentPrice;
    const costBasis = row.shares * row.avg_cost_price;
    const unrealizedGain = currentValue - costBasis;
    const unrealizedGainPercent = costBasis > 0 ? (unrealizedGain / costBasis) * 100 : 0;

    return {
      id: row.id,
      ticker: row.ticker,
      name: q?.name ?? row.name ?? row.ticker,
      market: row.market,
      currency,
      shares: row.shares,
      avgCostPrice: row.avg_cost_price,
      currentPrice,
      currentValue,
      costBasis,
      unrealizedGain,
      unrealizedGainPercent,
      priceSource,
      manualPriceUpdatedAt: row.manual_price_updated_at ?? undefined,
      isPriceStale: priceSource === "manual" && (
        !row.manual_price_updated_at ||
        (Date.now() - new Date(row.manual_price_updated_at).getTime()) / 86_400_000 > 3
      ),
    };
  });

  const toEgp = (value: number, currency: string) =>
    currency === "USD" ? value * usdToEgp : value;

  const totalValueEGP = holdings.reduce((s, h) => s + toEgp(h.currentValue, h.currency), 0);
  const totalCostEGP = holdings.reduce((s, h) => s + toEgp(h.costBasis, h.currency), 0);
  const totalUnrealizedGainEGP = totalValueEGP - totalCostEGP;
  const totalUnrealizedGainPercent = totalCostEGP > 0 ? (totalUnrealizedGainEGP / totalCostEGP) * 100 : 0;

  const portfolio: Portfolio = {
    holdings,
    totalValueEGP,
    totalCostEGP,
    totalUnrealizedGainEGP,
    totalUnrealizedGainPercent,
    lastUpdated: new Date().toISOString(),
  };

  return NextResponse.json(portfolio);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ticker, name, market, currency, shares, avgCostPrice } = body;

  if (!ticker || !market || !shares || !avgCostPrice) {
    return NextResponse.json({ error: "ticker, market, shares, avgCostPrice required" }, { status: 400 });
  }

  let data, insertError;
  try {
    ({ data, error: insertError } = await supabaseAdmin
      .from("portfolio_holdings")
      .insert({ ticker, name: name ?? ticker, market, currency: currency ?? (market === "EGX" ? "EGP" : "USD"), shares, avg_cost_price: avgCostPrice })
      .select()
      .single());
  } catch (e) {
    console.error("[portfolio POST]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  if (insertError) {
    console.error("[portfolio POST] supabase error:", insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, shares, avgCostPrice, manualPrice } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (shares !== undefined) updates.shares = shares;
  if (avgCostPrice !== undefined) updates.avg_cost_price = avgCostPrice;
  if (manualPrice !== undefined) {
    updates.manual_price = manualPrice;
    updates.manual_price_updated_at = new Date().toISOString();
  }

  const { error } = await supabaseAdmin.from("portfolio_holdings").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("portfolio_holdings").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
