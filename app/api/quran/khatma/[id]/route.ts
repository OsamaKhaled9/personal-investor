export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { supabaseAdmin } from "@/lib/supabase";

function todayCairo(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
}

type PatchBody =
  | { action: "update_page"; current_page: number }
  | { action: "complete" };

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json() as PatchBody;

    if (body.action === "update_page") {
      const page = Number(body.current_page);
      if (!Number.isInteger(page) || page < 1 || page > 604) {
        return Response.json({ error: "current_page must be 1–604" }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from("khatmas")
        .update({ current_page: page })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return Response.json({ data, success: true });
    }

    if (body.action === "complete") {
      const { data: khatma, error: fetchErr } = await supabaseAdmin
        .from("khatmas")
        .select("current_page")
        .eq("id", id)
        .single();

      if (fetchErr) throw fetchErr;

      if (khatma.current_page !== 604) {
        return Response.json(
          { error: "Cannot complete khatma: current_page must be 604" },
          { status: 400 }
        );
      }

      const { data, error } = await supabaseAdmin
        .from("khatmas")
        .update({ completed_at: todayCairo(), is_active: false })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return Response.json({ data, success: true });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const e = err as { code?: string; message?: string };
    console.error("[HAYATI:QURAN:KHATMA:PATCH]", JSON.stringify({ code: e.code, message: e.message }));
    return Response.json({ error: e.message ?? "Failed to update khatma" }, { status: 500 });
  }
}
