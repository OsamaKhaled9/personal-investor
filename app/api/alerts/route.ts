import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getMultipleQuotes } from "@/lib/yahoo-finance";
import { sendPriceAlert } from "@/lib/telegram";
import type { AlertRuleRow, Market } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("alert_rules")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alerts: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ticker, market, type, threshold } = body;

  if (!ticker || !market || !type || threshold === undefined) {
    return NextResponse.json({ error: "ticker, market, type, threshold required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("alert_rules")
    .insert({ ticker, market, type, threshold, active: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("alert_rules").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Called by the cron job to evaluate all active alerts
export async function PUT() {
  const { data: alerts } = await supabaseAdmin
    .from("alert_rules")
    .select("*")
    .eq("active", true);

  if (!alerts || alerts.length === 0) return NextResponse.json({ triggered: 0 });

  const uniqueTickers = [...new Set((alerts as AlertRuleRow[]).map((a) => ({ ticker: a.ticker, market: a.market as Market })))];
  const quotes = await getMultipleQuotes(uniqueTickers);
  const priceMap = new Map(quotes.map((q) => [q.ticker, q.price]));

  let triggered = 0;
  for (const alert of alerts as AlertRuleRow[]) {
    const price = priceMap.get(alert.ticker);
    if (price === undefined) continue;

    let shouldTrigger = false;
    if (alert.type === "price_above" && price >= alert.threshold) shouldTrigger = true;
    if (alert.type === "price_below" && price <= alert.threshold) shouldTrigger = true;

    if (shouldTrigger) {
      await sendPriceAlert({
        ticker: alert.ticker,
        currentPrice: price,
        currency: alert.market === "EGX" ? "EGP" : "USD",
        alertType: alert.type,
        threshold: alert.threshold,
      });
      await supabaseAdmin
        .from("alert_rules")
        .update({ active: false, triggered_at: new Date().toISOString() })
        .eq("id", alert.id);
      triggered++;
    }
  }

  return NextResponse.json({ triggered });
}
