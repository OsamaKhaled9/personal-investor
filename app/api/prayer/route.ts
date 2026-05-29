export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPrayerTimes } from "@/lib/aladhan";
import { supabaseAdmin } from "@/lib/supabase";

function todayCairo(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
}

function sevenDaysAgoCairo(): string {
  return new Date(Date.now() - 6 * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
}

export async function GET() {
  try {
    const date = todayCairo();
    const weekStart = sevenDaysAgoCairo();

    const [times, { data: logs }, { data: weeklyRaw }] = await Promise.all([
      getPrayerTimes(),
      supabaseAdmin
        .from("prayer_logs")
        .select("prayer_name, prayed")
        .eq("prayer_date", date),
      supabaseAdmin
        .from("prayer_logs")
        .select("prayer_date")
        .gte("prayer_date", weekStart)
        .eq("prayed", true),
    ]);

    // Aggregate prayed count per day
    const counts: Record<string, number> = {};
    for (const r of weeklyRaw ?? []) {
      counts[r.prayer_date] = (counts[r.prayer_date] ?? 0) + 1;
    }

    // Build full 7-day array (oldest → today), filling missing dates with 0
    const recentDays = Array.from({ length: 7 }, (_, i) => {
      const ds = new Date(Date.now() - (6 - i) * 86_400_000)
        .toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
      return { date: ds, count: counts[ds] ?? 0 };
    });

    return NextResponse.json({ times, logs: logs ?? [], date, recentDays });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { prayer_name, prayed, prayer_date } = await req.json();

    if (!prayer_name || typeof prayed !== "boolean") {
      return NextResponse.json({ error: "prayer_name and prayed are required" }, { status: 400 });
    }

    const date = prayer_date ?? todayCairo();

    const { data, error } = await supabaseAdmin
      .from("prayer_logs")
      .upsert(
        { prayer_date: date, prayer_name, prayed },
        { onConflict: "prayer_date,prayer_name" }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
