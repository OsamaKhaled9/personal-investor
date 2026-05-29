export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPrayerTimes } from "@/lib/aladhan";
import { sendMessage } from "@/lib/telegram";
import { supabaseAdmin } from "@/lib/supabase";

type PrayerName = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

const AR: Record<PrayerName, string> = {
  Fajr: "الفجر", Dhuhr: "الظهر", Asr: "العصر", Maghrib: "المغرب", Isha: "العشاء",
};

// Current time in Cairo as total minutes since midnight.
function nowCairoMinutes(): number {
  const s = new Date().toLocaleTimeString("en-CA", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

function todayCairo(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
}

// Runs every 30 min. Sends a Telegram alert for any prayer that is 25–35 min away.
// Deduplicates via prayer_reminders table so each prayer is only notified once per day.
export async function GET(req: Request) {
  if (req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const times = await getPrayerTimes();
    const nowMin = nowCairoMinutes();
    const today = todayCairo();
    const sent: string[] = [];

    for (const [prayer, timeStr] of Object.entries(times) as [PrayerName, string][]) {
      const [h, m] = timeStr.split(":").map(Number);
      const prayerMin = h * 60 + m;
      const diff = prayerMin - nowMin;

      if (diff >= 25 && diff <= 35) {
        // Check if already sent today
        const { data: existing } = await supabaseAdmin
          .from("prayer_reminders")
          .select("id")
          .eq("reminder_date", today)
          .eq("prayer_name", prayer)
          .maybeSingle();

        if (!existing) {
          const mins = Math.round(diff);
          await sendMessage(
            `🕌 *${AR[prayer]}* خلال ${mins} دقيقة\n_الوقت: ${timeStr} — استعد للصلاة_`,
            "Markdown"
          );
          await supabaseAdmin
            .from("prayer_reminders")
            .insert({ reminder_date: today, prayer_name: prayer });
          sent.push(prayer);
        }
      }
    }

    console.error("[HAYATI:PRAYER_REMINDER]", JSON.stringify({ sent, ts: new Date().toISOString() }));
    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err);
    console.error("[HAYATI:PRAYER_REMINDER:ERROR]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
