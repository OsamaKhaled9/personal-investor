import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendMessage } from "@/lib/telegram";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return new NextResponse("Unauthorized", { status: 401 });

  const { data: rows, error } = await supabaseAdmin
    .from("portfolio_holdings")
    .select("ticker, name, manual_price_updated_at")
    .not("manual_price", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const stale = (rows ?? []).filter((r) => {
    if (!r.manual_price_updated_at) return true;
    const days = (Date.now() - new Date(r.manual_price_updated_at).getTime()) / 86_400_000;
    return days > 3;
  });

  if (stale.length > 0) {
    await sendMessage(
      `⚠️ *Manual Price Reminder*\n` +
      stale.map((r) => `• ${r.ticker} — ${r.name}`).join("\n") +
      `\n\n_Open the app to update fund NAV prices._`
    );
  }

  return NextResponse.json({ checked: rows?.length ?? 0, stale: stale.length });
}
