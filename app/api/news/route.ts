import { NextRequest, NextResponse } from "next/server";
import { fetchAndCacheNews, getCachedNews } from "@/lib/news-aggregator";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const refresh = searchParams.get("refresh") === "true";
  const tickers = searchParams.get("tickers")?.split(",") ?? [];

  if (refresh) {
    const articles = await fetchAndCacheNews(tickers);
    return NextResponse.json({ articles });
  }

  const articles = await getCachedNews(20);
  return NextResponse.json({ articles });
}
