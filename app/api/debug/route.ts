import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const checks: Record<string, { ok: boolean; detail: string }> = {};

  // Check env vars
  const envVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "GEMINI_API_KEY",
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_CHAT_ID",
    "CRON_SECRET",
  ];
  for (const v of envVars) {
    const val = process.env[v];
    checks[v] = val
      ? { ok: true, detail: `set (${val.slice(0, 8)}...)` }
      : { ok: false, detail: "MISSING" };
  }

  // Check Supabase connection
  try {
    const { error } = await supabaseAdmin
      .from("portfolio_holdings")
      .select("id")
      .limit(1);
    checks["supabase_connection"] = error
      ? { ok: false, detail: error.message }
      : { ok: true, detail: "connected, table exists" };
  } catch (e) {
    checks["supabase_connection"] = { ok: false, detail: String(e) };
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  return NextResponse.json({ allOk, checks }, { status: allOk ? 200 : 500 });
}
