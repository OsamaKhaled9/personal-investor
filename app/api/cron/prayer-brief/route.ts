export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPrayerTimes } from "@/lib/aladhan";
import { sendMessage } from "@/lib/telegram";

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const times = await getPrayerTimes();

    const message = [
      "🕌 *أوقات الصلاة اليوم — القاهرة*",
      "",
      `الفجر · ${times.Fajr}`,
      `الظهر · ${times.Dhuhr}`,
      `العصر · ${times.Asr}`,
      `المغرب · ${times.Maghrib}`,
      `العشاء · ${times.Isha}`,
    ].join("\n");

    await sendMessage(message, "Markdown");

    return NextResponse.json({ ok: true, times });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
