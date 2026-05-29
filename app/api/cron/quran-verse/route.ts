export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getRandomVerse } from "@/lib/alquran";
import { sendMessage } from "@/lib/telegram";

// Runs daily at 12:00 UTC (2pm Cairo). Sends a random Quran verse via Telegram.
export async function GET(req: Request) {
  if (req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const verse = await getRandomVerse();
    const msg = [
      "🌙 *آية اليوم*",
      "",
      verse.ar,
      "",
      `_${verse.en}_`,
      "",
      `— ${verse.surahName} ${verse.surahNum}:${verse.ayahNum}`,
    ].join("\n");

    await sendMessage(msg, "Markdown");

    console.error("[HAYATI:QURAN_VERSE]", JSON.stringify({
      surah: verse.surahName, ayah: verse.ayahNum, ts: new Date().toISOString(),
    }));
    return NextResponse.json({ ok: true, surah: verse.surahName, ayah: verse.ayahNum });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[HAYATI:QURAN_VERSE:ERROR]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
