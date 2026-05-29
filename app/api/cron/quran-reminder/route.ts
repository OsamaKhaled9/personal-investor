export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { sendMessage } from "@/lib/telegram";
import { supabaseAdmin } from "@/lib/supabase";

function daysAgoCairo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toLocaleDateString("en-CA", {
    timeZone: "Africa/Cairo",
  });
}

// Runs daily at 17:00 UTC (7pm Cairo).
// If no reading_session for today AND yesterday → send nudge.
export async function GET(req: Request) {
  if (
    req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const today = daysAgoCairo(0);
    const yesterday = daysAgoCairo(1);

    const { data } = await supabaseAdmin
      .from("reading_sessions")
      .select("session_date")
      .in("session_date", [today, yesterday]);

    const nudged = !data || data.length === 0;

    if (nudged) {
      await sendMessage(
        "📖 *ذكرى بالقرآن الكريم*\n\nلم تقرأ القرآن منذ يومين 🌙\n_كلمة الله خير من الدنيا وما فيها_\n\nافتح تطبيق حياتي وسجّل صفحاتك اليوم.",
        "Markdown"
      );
    }

    console.error(
      "[HAYATI:QURAN_REMINDER]",
      JSON.stringify({ nudged, ts: new Date().toISOString() })
    );
    return NextResponse.json({ ok: true, nudged });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[HAYATI:QURAN_REMINDER:ERROR]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
