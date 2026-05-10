export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LogPayload {
  type: string;
  message?: string;
  digest?: string | null;
  stack?: string | null;
  url?: string;
  ua?: string;
  ts?: string;
  [key: string]: unknown;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LogPayload;

    // Structured log — appears in Vercel › Functions › Logs
    console.error("[HAYATI:LOG]", JSON.stringify({
      type: body.type ?? "unknown",
      message: body.message,
      digest: body.digest,
      url: body.url,
      ua: body.ua,
      ts: body.ts ?? new Date().toISOString(),
      stack: body.stack,
    }));

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
}
