import * as cheerio from "cheerio";
import type { StockQuote } from "./types";

// EGX official site fallback — primary data comes from Yahoo Finance .CA via chart API
const EGX_BASE = "https://www.egx.com.eg";

export async function scrapeEGXQuote(ticker: string): Promise<StockQuote | null> {
  try {
    const url = `${EGX_BASE}/egx/main.aspx/stockDetails?sym=${encodeURIComponent(ticker)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PersonalInvestorBot/1.0)" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    const priceText = $(".stockPrice, .price, [class*='price']").first().text().trim();
    const price = parseFloat(priceText.replace(/[^0-9.]/g, ""));
    if (isNaN(price) || price === 0) return null;

    const changeText = $("[class*='change']").first().text().trim();
    const change = parseFloat(changeText.replace(/[^0-9.\-]/g, "")) || 0;
    const changePercent = price > 0 ? (change / (price - change)) * 100 : 0;

    const name = $("h1, .stockName, [class*='name']").first().text().trim() || ticker;

    return {
      ticker,
      name,
      price,
      currency: "EGP",
      change,
      changePercent,
      volume: 0,
      market: "EGX",
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// Scrape EGX top movers for the market screener page
export async function scrapeEGXTopMovers(): Promise<
  { ticker: string; name: string; price: number; changePercent: number }[]
> {
  try {
    const url = `${EGX_BASE}/egx/main.aspx/marketSummary`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PersonalInvestorBot/1.0)" },
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];

    const html = await res.text();
    const $ = cheerio.load(html);
    const movers: { ticker: string; name: string; price: number; changePercent: number }[] = [];

    $("table tr, .stockRow, [class*='stock-row']").each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length < 3) return;
      const ticker = $(cells[0]).text().trim();
      const name = $(cells[1]).text().trim();
      const priceText = $(cells[2]).text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ""));
      const changeText = $(cells[3] || cells[2]).text().trim();
      const changePercent = parseFloat(changeText.replace(/[^0-9.\-]/g, "")) || 0;

      if (ticker && !isNaN(price) && price > 0) {
        movers.push({ ticker, name, price, changePercent });
      }
    });

    return movers.slice(0, 50);
  } catch {
    return [];
  }
}

// Known EGX tickers that work on Yahoo Finance with .CA suffix
export const EGX_KNOWN_TICKERS: { ticker: string; name: string; sector: string }[] = [
  { ticker: "COMI", name: "Commercial International Bank", sector: "Banking" },
  { ticker: "HRHO", name: "El Sewedy Electric", sector: "Industrials" },
  { ticker: "EFGD", name: "EFG Hermes", sector: "Financial Services" },
  { ticker: "ETEL", name: "Telecom Egypt", sector: "Telecom" },
  { ticker: "SWDY", name: "Elsewedy Electric", sector: "Industrials" },
  { ticker: "ABUK", name: "Abu Qir Fertilizers", sector: "Chemicals" },
  { ticker: "OCDI", name: "SODIC", sector: "Real Estate" },
  { ticker: "ESRS", name: "Ezz Steel", sector: "Steel" },
  { ticker: "TMGH", name: "Talaat Mostafa Group", sector: "Real Estate" },
  { ticker: "ORWE", name: "Oriental Weavers", sector: "Textiles" },
  { ticker: "PHDC", name: "Palm Hills Developments", sector: "Real Estate" },
  { ticker: "MNHD", name: "Madinet Nasr Housing", sector: "Real Estate" },
  { ticker: "JUFO", name: "Juhayna Food Industries", sector: "Food & Beverage" },
  { ticker: "CLHO", name: "Cleopatra Hospitals", sector: "Healthcare" },
  { ticker: "SPMD", name: "Speed Medical", sector: "Healthcare" },
  { ticker: "EFIH", name: "EFG Finance", sector: "Financial Services" },
  { ticker: "AMOC", name: "Alexandria Mineral Oils", sector: "Energy" },
  { ticker: "ABCO", name: "Alexandria Container", sector: "Logistics" },
];
