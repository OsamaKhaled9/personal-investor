export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPrayerTimes } from "@/lib/aladhan";
import { supabaseAdmin } from "@/lib/supabase";

function todayCairo(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
}

export async function GET() {
  try {
    const date = todayCairo();

    // Fetch prayer times — if this fails the whole request fails (no times = nothing to show)
    const times = await getPrayerTimes();

    // DB logs are optional — degrade gracefully if table doesn't exist yet
    const { data: logs } = await supabaseAdmin
      .from("prayer_logs")
      .select("prayer_name, prayed")
      .eq("prayer_date", date);

    return NextResponse.json({ times, logs: logs ?? [], date });
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
