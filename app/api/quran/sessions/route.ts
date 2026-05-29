export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { supabaseAdmin } from "@/lib/supabase";

type SessionRow = {
  id: string;
  session_date: string;
  from_page: number;
  to_page: number;
  pages_read: number;
  notes: string | null;
  created_at: string;
};

function todayCairo(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
}

function computeStreak(rows: { session_date: string }[]): number {
  const sorted = [...rows].sort((a, b) => b.session_date.localeCompare(a.session_date));
  const today = todayCairo();
  const yesterday = new Date(Date.now() - 86_400_000).toLocaleDateString("en-CA", {
    timeZone: "Africa/Cairo",
  });
  let streak = 0;
  let expected = sorted[0]?.session_date === today ? today : yesterday;
  for (const row of sorted) {
    if (row.session_date === expected) {
      streak++;
      const d = new Date(expected);
      d.setDate(d.getDate() - 1);
      expected = d.toLocaleDateString("en-CA");
    } else break;
  }
  return streak;
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("reading_sessions")
    .select("id, session_date, from_page, to_page, pages_read, notes, created_at")
    .order("session_date", { ascending: false })
    .limit(30);

  if (error) {
    const e = error as { code?: string; message?: string };
    console.error("[HAYATI:QURAN:SESSIONS:GET]", JSON.stringify({ code: e.code, message: e.message }));
    if (e.code === "42P01") {
      return Response.json({
        today: null, streak: 0, recentDays: [], totalPages: 0,
        bestDay: null, avgPerDay: 0, currentPosition: null,
      });
    }
    return Response.json({ error: e.message ?? "DB error" }, { status: 500 });
  }

  const rows = (data ?? []) as SessionRow[];
  const today = todayCairo();
  const todaySession = rows.find((r) => r.session_date === today) ?? null;

  const totalPages = rows.reduce((sum, r) => sum + r.pages_read, 0);
  const streak = computeStreak(rows);

  const recentDays = [...rows]
    .sort((a, b) => a.session_date.localeCompare(b.session_date))
    .slice(-30)
    .map((r) => ({ date: r.session_date, pages: r.pages_read }));

  let bestDay: { date: string; pages: number } | null = null;
  for (const r of rows) {
    if (!bestDay || r.pages_read > bestDay.pages) {
      bestDay = { date: r.session_date, pages: r.pages_read };
    }
  }

  const avgPerDay =
    rows.length > 0 ? Math.round((totalPages / rows.length) * 10) / 10 : 0;

  const currentPosition =
    rows.length > 0
      ? rows.sort((a, b) => b.session_date.localeCompare(a.session_date))[0].to_page
      : null;

  return Response.json({
    today: todaySession,
    streak,
    recentDays,
    totalPages,
    bestDay,
    avgPerDay,
    currentPosition,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { from_page?: unknown; to_page?: unknown; notes?: unknown };
    const from_page = Number(body.from_page);
    const to_page = Number(body.to_page);

    if (
      !Number.isInteger(from_page) || from_page < 1 || from_page > 604 ||
      !Number.isInteger(to_page) || to_page < 1 || to_page > 604
    ) {
      return Response.json({ error: "from_page and to_page must be integers 1–604" }, { status: 400 });
    }
    if (from_page > to_page) {
      return Response.json({ error: "from_page must be <= to_page" }, { status: 400 });
    }

    const session_date = todayCairo();
    const notes = typeof body.notes === "string" ? body.notes : null;

    const { data, error } = await supabaseAdmin
      .from("reading_sessions")
      .upsert(
        { session_date, from_page, to_page, notes },
        { onConflict: "session_date" }
      )
      .select()
      .single();

    if (error) throw error;

    return Response.json({ data, success: true });
  } catch (err) {
    const e = err as { code?: string; message?: string };
    console.error("[HAYATI:QURAN:SESSIONS:POST]", JSON.stringify({ code: e.code, message: e.message }));
    return Response.json({ error: e.message ?? "Failed to save session" }, { status: 500 });
  }
}
