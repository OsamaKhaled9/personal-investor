import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getMultipleQuotes } from "@/lib/yahoo-finance";
import type { Holding, Portfolio, PortfolioHoldingRow } from "@/lib/types";

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

  const quoteRequests = (rows as PortfolioHoldingRow[]).map((r) => ({
    ticker: r.ticker,
    market: r.market,
  }));
  const quotes = await getMultipleQuotes(quoteRequests);
  const quoteMap = new Map(quotes.map((q) => [q.ticker, q]));

  // Fetch USD/EGP rate
  let usdToEgp = 50; // fallback
  try {
    const fx = await getMultipleQuotes([{ ticker: "USDEGP=X", market: "US" }]);
    if (fx[0]) usdToEgp = fx[0].price;
  } catch {}

  const holdings: Holding[] = (rows as PortfolioHoldingRow[]).map((row) => {
    const q = quoteMap.get(row.ticker);
    const currentPrice = q?.price ?? row.avg_cost_price;
    const currency = row.currency;
    const currentValue = row.shares * currentPrice;
    const costBasis = row.shares * row.avg_cost_price;
    const unrealizedGain = currentValue - costBasis;
    const unrealizedGainPercent = costBasis > 0 ? (unrealizedGain / costBasis) * 100 : 0;

    return {
      id: row.id,
      ticker: row.ticker,
      name: q?.name ?? row.name,
      market: row.market,
      currency,
      shares: row.shares,
      avgCostPrice: row.avg_cost_price,
      currentPrice,
      currentValue,
      costBasis,
      unrealizedGain,
      unrealizedGainPercent,
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
  const { id, shares, avgCostPrice } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (shares !== undefined) updates.shares = shares;
  if (avgCostPrice !== undefined) updates.avg_cost_price = avgCostPrice;

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
