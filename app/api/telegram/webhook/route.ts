import { NextRequest, NextResponse } from "next/server";
import { Bot, webhookCallback } from "grammy";
import { supabaseAdmin } from "@/lib/supabase";
import { getQuote } from "@/lib/yahoo-finance";
import { screenStock } from "@/lib/halal-screener";
import { analyzeStock, chat } from "@/lib/ai";
import { computeTechnicals } from "@/lib/yahoo-finance";
import { formatPortfolioMessage } from "@/lib/telegram";
import type { Market, PortfolioHoldingRow } from "@/lib/types";

export const runtime = "nodejs";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN ?? "placeholder");

bot.command("start", (ctx) => {
  ctx.reply(
    "👋 *Personal Investor Bot*\n\n" +
    "Commands:\n" +
    "/portfolio — your portfolio summary\n" +
    "/halal COMI — halal screening for a stock\n" +
    "/analyze COMI — full AI analysis\n" +
    "/brief — today's market brief\n" +
    "/alert COMI 45 price_above — set price alert\n" +
    "/alerts — list your alerts",
    { parse_mode: "Markdown" }
  );
});

bot.command("portfolio", async (ctx) => {
  const { data: rows } = await supabaseAdmin.from("portfolio_holdings").select("*");
  if (!rows || rows.length === 0) {
    ctx.reply("📭 Portfolio is empty. Add holdings via the web app.");
    return;
  }
  const holdings = rows as PortfolioHoldingRow[];
  ctx.reply("⏳ Fetching live prices...");
  const quotes = await Promise.all(holdings.map((h) => getQuote(h.ticker, h.market as Market)));
  const priceMap = new Map(quotes.filter(Boolean).map((q) => [q!.ticker, q!.price]));

  const enriched = holdings.map((h) => ({
    ticker: h.ticker,
    currentPrice: priceMap.get(h.ticker) ?? h.avg_cost_price,
    currency: h.currency,
    unrealizedGainPercent: ((priceMap.get(h.ticker) ?? h.avg_cost_price) - h.avg_cost_price) / h.avg_cost_price * 100,
    currentValue: h.shares * (priceMap.get(h.ticker) ?? h.avg_cost_price),
  }));

  const totalValue = enriched.reduce((s, h) => s + h.currentValue, 0);
  const totalCost = holdings.reduce((s, h) => s + h.shares * h.avg_cost_price, 0);
  const totalGainPercent = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

  ctx.reply(
    formatPortfolioMessage({ holdings: enriched, totalValueEGP: totalValue, totalUnrealizedGainPercent: totalGainPercent }),
    { parse_mode: "Markdown" }
  );
});

bot.command("halal", async (ctx) => {
  const args = ctx.message?.text?.split(" ").slice(1);
  if (!args || args.length === 0) { ctx.reply("Usage: /halal TICKER [EGX|US]"); return; }
  const ticker = args[0].toUpperCase();
  const market = (args[1]?.toUpperCase() ?? "EGX") as Market;
  ctx.reply(`🔍 Screening ${ticker}...`);
  const result = await screenStock(ticker, market);
  const icon = result.status === "halal" ? "✅" : result.status === "haram" ? "❌" : "⚠️";
  ctx.reply(
    `${icon} *${ticker} — ${result.status.toUpperCase()}*\n\n` +
    result.reasons.map((r) => `• ${r}`).join("\n"),
    { parse_mode: "Markdown" }
  );
});

bot.command("analyze", async (ctx) => {
  const args = ctx.message?.text?.split(" ").slice(1);
  if (!args || args.length === 0) { ctx.reply("Usage: /analyze TICKER [EGX|US]"); return; }
  const ticker = args[0].toUpperCase();
  const market = (args[1]?.toUpperCase() ?? "EGX") as Market;
  ctx.reply(`🧠 Analyzing ${ticker}...`);

  const [quote, halal, technicals] = await Promise.all([
    getQuote(ticker, market),
    screenStock(ticker, market),
    computeTechnicals(ticker, market),
  ]);
  if (!quote) { ctx.reply("❌ Stock not found."); return; }

  const analysis = await analyzeStock({ quote, halal, technicals });
  const recIcon = analysis.recommendation.includes("BUY") ? "📈" : analysis.recommendation.includes("SELL") ? "📉" : "⚖️";
  const halalIcon = halal.status === "halal" ? "✅" : halal.status === "haram" ? "❌" : "⚠️";

  ctx.reply(
    `${recIcon} *${ticker} Analysis*\n\n` +
    `${halalIcon} Halal: *${halal.status.toUpperCase()}*\n` +
    `💰 Price: ${quote.price} ${quote.currency} (${quote.changePercent > 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%)\n` +
    `📊 Technical Score: ${technicals?.score ?? "N/A"}/100\n\n` +
    `${analysis.summary}\n\n` +
    `*Recommendation: ${analysis.recommendation}*\n\n` +
    `*Risks:*\n${analysis.risks.map((r) => `• ${r}`).join("\n")}`,
    { parse_mode: "Markdown" }
  );
});

bot.command("alerts", async (ctx) => {
  const { data: alerts } = await supabaseAdmin.from("alert_rules").select("*").eq("active", true);
  if (!alerts || alerts.length === 0) { ctx.reply("📭 No active alerts."); return; }
  const lines = alerts.map((a) => `• ${a.ticker}: ${a.type.replace("_", " ")} ${a.threshold}`);
  ctx.reply(`🔔 *Active Alerts*\n\n${lines.join("\n")}`, { parse_mode: "Markdown" });
});

bot.command("alert", async (ctx) => {
  const args = ctx.message?.text?.split(" ").slice(1);
  if (!args || args.length < 3) { ctx.reply("Usage: /alert TICKER THRESHOLD price_above|price_below"); return; }
  const [ticker, thresholdStr, type] = args;
  const threshold = parseFloat(thresholdStr);
  if (isNaN(threshold)) { ctx.reply("❌ Invalid threshold"); return; }
  const market = (args[3]?.toUpperCase() ?? "EGX") as Market;
  await supabaseAdmin.from("alert_rules").insert({ ticker: ticker.toUpperCase(), market, type, threshold, active: true });
  ctx.reply(`✅ Alert set: ${ticker.toUpperCase()} ${type.replace("_", " ")} ${threshold}`);
});

// Freeform text goes to AI chat
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith("/")) return;
  ctx.reply("🤔 Thinking...");
  const response = await chat([{ role: "user", parts: [{ text }] }]);
  ctx.reply(response, { parse_mode: "Markdown" }).catch(() => ctx.reply(response));
});

const handler = webhookCallback(bot, "std/http");

export async function POST(req: NextRequest) {
  return handler(req);
}

// Vercel setup endpoint — call once to register webhook
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const setup = searchParams.get("setup");
  if (setup !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const webhookUrl = `${req.headers.get("origin") ?? ""}/api/telegram/webhook`;
  await bot.api.setWebhook(webhookUrl);
  return NextResponse.json({ ok: true, webhookUrl });
}
