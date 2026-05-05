import { Bot } from "grammy";
import type { HalalScreenResult } from "./types";

let _bot: Bot | null = null;

function getBot(): Bot {
  if (!_bot) {
    if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not set");
    _bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
  }
  return _bot;
}

const CHAT_ID = () => {
  if (!process.env.TELEGRAM_CHAT_ID) throw new Error("TELEGRAM_CHAT_ID not set");
  return process.env.TELEGRAM_CHAT_ID;
};

export async function sendMessage(text: string, parseMode: "Markdown" | "HTML" = "Markdown") {
  const bot = getBot();
  await bot.api.sendMessage(CHAT_ID(), text, { parse_mode: parseMode });
}

export async function sendPriceAlert(params: {
  ticker: string;
  currentPrice: number;
  currency: string;
  alertType: "price_above" | "price_below" | "percent_change";
  threshold: number;
}) {
  const icon = params.alertType === "price_above" ? "📈" : params.alertType === "price_below" ? "📉" : "⚡";
  const msg =
    `${icon} *Price Alert — ${params.ticker}*\n` +
    `Current: ${params.currentPrice} ${params.currency}\n` +
    `Trigger: ${params.alertType.replace("_", " ")} ${params.threshold}\n` +
    `_${new Date().toLocaleString("en-EG", { timeZone: "Africa/Cairo" })}_`;
  await sendMessage(msg);
}

export async function sendNewsAlert(params: {
  title: string;
  source: string;
  relatedTickers: string[];
  sentiment: string;
  url: string;
}) {
  const icon = params.sentiment === "positive" ? "🟢" : params.sentiment === "negative" ? "🔴" : "⚪";
  const tickers = params.relatedTickers.length > 0 ? `\nAffects: ${params.relatedTickers.join(", ")}` : "";
  const msg =
    `${icon} *News Alert*\n` +
    `${params.title}\n` +
    `Source: ${params.source}${tickers}\n` +
    `[Read more](${params.url})`;
  await sendMessage(msg);
}

export async function sendHalalAlert(ticker: string, result: HalalScreenResult) {
  const icon = result.status === "halal" ? "✅" : result.status === "haram" ? "❌" : "⚠️";
  const msg =
    `${icon} *Halal Status Update — ${ticker}*\n` +
    `Status: *${result.status.toUpperCase()}*\n` +
    result.reasons.map((r) => `• ${r}`).join("\n");
  await sendMessage(msg);
}

export function formatPortfolioMessage(params: {
  holdings: { ticker: string; currentPrice: number; currency: string; unrealizedGainPercent: number; currentValue: number }[];
  totalValueEGP: number;
  totalUnrealizedGainPercent: number;
}): string {
  const lines = params.holdings.map((h) => {
    const icon = h.unrealizedGainPercent >= 0 ? "📈" : "📉";
    return `${icon} *${h.ticker}*: ${h.currentPrice} ${h.currency} (${h.unrealizedGainPercent > 0 ? "+" : ""}${h.unrealizedGainPercent.toFixed(1)}%)`;
  });

  const totalIcon = params.totalUnrealizedGainPercent >= 0 ? "✅" : "❌";
  return (
    `💼 *Portfolio Summary*\n\n` +
    lines.join("\n") +
    `\n\n${totalIcon} Total: *${params.totalValueEGP.toFixed(0)} EGP*\n` +
    `P&L: ${params.totalUnrealizedGainPercent > 0 ? "+" : ""}${params.totalUnrealizedGainPercent.toFixed(2)}%`
  );
}

export { getBot };
