import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getMultipleQuotes } from "@/lib/yahoo-finance";
import type { WatchlistRow } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const { data: rows, error } = await supabaseAdmin
    .from("watchlist")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!rows || rows.length === 0) return NextResponse.json({ items: [] });

  const quoteRequests = (rows as WatchlistRow[]).map((r) => ({ ticker: r.ticker, market: r.market }));
  const quotes = await getMultipleQuotes(quoteRequests);
  const quoteMap = new Map(quotes.map((q) => [q.ticker, q]));

  const items = (rows as WatchlistRow[]).map((row) => ({
    id: row.id,
    ticker: row.ticker,
    name: row.name,
    market: row.market,
    currency: row.currency,
    addedAt: row.created_at,
    notes: row.notes ?? undefined,
    quote: quoteMap.get(row.ticker) ?? null,
  }));

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ticker, name, market } = body;

  if (!ticker || !market) {
    return NextResponse.json({ error: "ticker and market required" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("watchlist")
    .select("id")
    .eq("ticker", ticker.toUpperCase())
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: `${ticker} is already in your watchlist` }, { status: 409 });
  }

  const currency = market === "EGX" ? "EGP" : "USD";
  const { data, error } = await supabaseAdmin
    .from("watchlist")
    .insert({ ticker: ticker.toUpperCase(), name: name ?? ticker.toUpperCase(), market, currency })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("watchlist").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
