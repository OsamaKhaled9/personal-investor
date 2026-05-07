import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker");
  const market = searchParams.get("market");

  if (!ticker || !market)
    return NextResponse.json({ error: "ticker and market required" }, { status: 400 });

  const { data } = await supabaseAdmin
    .from("price_snapshots")
    .select("trading_date, price, change_percent, source")
    .eq("ticker", ticker)
    .eq("market", market)
    .order("trading_date", { ascending: true })
    .limit(365);

  return NextResponse.json({ history: data ?? [] });
}
