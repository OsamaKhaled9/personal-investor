import * as cheerio from "cheerio";
import type { NewsArticle } from "./types";
import { supabaseAdmin } from "./supabase";

const NEWS_API_KEY = () => process.env.NEWS_API_KEY ?? "";

// Fetch English financial news via NewsAPI
async function fetchNewsAPI(query: string): Promise<NewsArticle[]> {
  if (!NEWS_API_KEY()) return [];
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${NEWS_API_KEY()}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles ?? []).map((a: Record<string, string | Record<string, string>>) => ({
      id: crypto.randomUUID(),
      title: (a.title as string) ?? "",
      summary: (a.description as string) ?? "",
      url: (a.url as string) ?? "",
      source: (a.source as Record<string, string>)?.name ?? "NewsAPI",
      language: "en" as const,
      publishedAt: a.publishedAt ?? new Date().toISOString(),
      relatedTickers: [],
      sentiment: "neutral" as const,
      urgency: "low" as const,
    }));
  } catch {
    return [];
  }
}

// Scrape Mubasher Misr for Arabic financial news
async function scrapeArabicNews(): Promise<NewsArticle[]> {
  const sources = [
    { url: "https://www.mubasher.info/countries/eg/news", name: "Mubasher" },
    { url: "https://argaam.com/ar/article/articleType/latest?countryId=6", name: "Argaam" },
  ];

  const articles: NewsArticle[] = [];
  for (const source of sources) {
    try {
      const res = await fetch(source.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PersonalInvestorBot/1.0)" },
        next: { revalidate: 1800 },
      });
      if (!res.ok) continue;
      const html = await res.text();
      const $ = cheerio.load(html);

      $("article, .news-item, [class*='article'], [class*='news']").each((_, el) => {
        const title = $(el).find("h2, h3, .title, [class*='title']").first().text().trim();
        const summary = $(el).find("p, .summary, [class*='summary']").first().text().trim();
        const href = $(el).find("a").first().attr("href") ?? "";
        const url = href.startsWith("http") ? href : `${new URL(source.url).origin}${href}`;
        const dateText = $(el).find("time, [class*='date'], [class*='time']").first().text().trim();

        if (title && url) {
          articles.push({
            id: crypto.randomUUID(),
            title,
            summary,
            url,
            source: source.name,
            language: "ar",
            publishedAt: dateText ? new Date(dateText).toISOString() : new Date().toISOString(),
            relatedTickers: [],
            sentiment: "neutral",
            urgency: "low",
          });
        }
      });
    } catch {
      // scraping is best-effort
    }
  }
  return articles;
}

export async function fetchAndCacheNews(portfolioTickers: string[]): Promise<NewsArticle[]> {
  const egxQuery = `Egypt stock market EGX ${portfolioTickers.slice(0, 5).join(" ")}`;
  const [englishNews, arabicNews] = await Promise.allSettled([
    fetchNewsAPI(egxQuery),
    scrapeArabicNews(),
  ]);

  const all: NewsArticle[] = [
    ...(englishNews.status === "fulfilled" ? englishNews.value : []),
    ...(arabicNews.status === "fulfilled" ? arabicNews.value : []),
  ];

  // Deduplicate by URL, filter empty titles
  const seen = new Set<string>();
  const unique = all.filter((a) => {
    if (!a.title || seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  // Upsert to cache (ignore conflicts on URL)
  if (unique.length > 0) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin.from("news_cache").upsert(
      unique.map((a) => ({
        ...a,
        related_tickers: a.relatedTickers,
        published_at: a.publishedAt,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      })),
      { onConflict: "url", ignoreDuplicates: true }
    );
  }

  return unique.slice(0, 30);
}

export async function getCachedNews(limit = 20): Promise<NewsArticle[]> {
  const { data } = await supabaseAdmin
    .from("news_cache")
    .select("*")
    .gt("expires_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    summary: row.summary ?? "",
    url: row.url,
    source: row.source,
    language: row.language,
    publishedAt: row.published_at,
    relatedTickers: row.related_tickers ?? [],
    sentiment: row.sentiment ?? "neutral",
    urgency: row.urgency ?? "low",
  }));
}
