import { NextRequest, NextResponse } from "next/server";
import { screenStock } from "@/lib/halal-screener";
import type { Market } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker");
  const market = (searchParams.get("market") ?? "EGX") as Market;

  if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 });

  const result = await screenStock(ticker, market);
  return NextResponse.json(result);
}
