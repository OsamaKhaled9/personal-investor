export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { supabaseAdmin } from "@/lib/supabase";

type KhatmaRow = {
  id: string;
  started_at: string;
  target_date: string;
  current_page: number;
  completed_at: string | null;
  is_active: boolean;
  created_at: string;
};

function todayCairo(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
}

export async function GET() {
  const [activeRes, historyRes, countRes] = await Promise.all([
    supabaseAdmin
      .from("khatmas")
      .select("*")
      .eq("is_active", true)
      .maybeSingle(),
    supabaseAdmin
      .from("khatmas")
      .select("*")
      .eq("is_active", false)
      .order("completed_at", { ascending: false })
      .limit(10),
    supabaseAdmin
      .from("khatmas")
      .select("id", { count: "exact", head: true })
      .eq("is_active", false),
  ]);

  if (activeRes.error) {
    const e = activeRes.error as { code?: string; message?: string };
    console.error("[HAYATI:QURAN:KHATMA:GET]", JSON.stringify({ code: e.code, message: e.message }));
    if (e.code === "42P01") {
      return Response.json({ active: null, history: [], totalKhatmas: 0 });
    }
    return Response.json({ error: e.message ?? "DB error" }, { status: 500 });
  }

  return Response.json({
    active: (activeRes.data as KhatmaRow | null),
    history: (historyRes.data ?? []) as KhatmaRow[],
    totalKhatmas: countRes.count ?? 0,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { target_date?: unknown };
    const target_date = typeof body.target_date === "string" ? body.target_date : null;
    const today = todayCairo();

    if (!target_date || target_date < today) {
      return Response.json({ error: "target_date must be today or in the future (YYYY-MM-DD)" }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from("khatmas")
      .select("id")
      .eq("is_active", true)
      .maybeSingle();

    if (existing) {
      return Response.json({ error: "An active khatma already exists" }, { status: 409 });
    }

    const { data, error } = await supabaseAdmin
      .from("khatmas")
      .insert({ started_at: today, target_date, current_page: 1, is_active: true })
      .select()
      .single();

    if (error) throw error;

    return Response.json({ data, success: true });
  } catch (err) {
    const e = err as { code?: string; message?: string };
    console.error("[HAYATI:QURAN:KHATMA:POST]", JSON.stringify({ code: e.code, message: e.message }));
    return Response.json({ error: e.message ?? "Failed to create khatma" }, { status: 500 });
  }
}
