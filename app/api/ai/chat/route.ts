import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/ai";
import type { Portfolio } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages, portfolio }: { messages: { role: "user" | "model"; parts: { text: string }[] }[]; portfolio?: Portfolio } = body;

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const response = await chat(messages, portfolio);
  return NextResponse.json({ response });
}
