import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Portfolio, StockQuote, HalalScreenResult, TechnicalSignals } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function getModel() {
  return genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: `You are a sharp, halal-conscious personal investment analyst focused on the Egyptian (EGX) and US markets.
You are direct, honest, and data-driven. You always consider halal compliance first — never recommend haram stocks.
When data is limited, say so explicitly rather than guessing. Use clear bullet points. Keep responses concise.
Current date context: Egypt timezone (UTC+2/UTC+3 in summer). EGX trades Sunday–Thursday 10am–2:30pm Cairo time.`,
  });
}

export async function analyzeStock(params: {
  quote: StockQuote;
  halal: HalalScreenResult;
  technicals: TechnicalSignals | null;
  portfolio?: Portfolio;
}): Promise<{ summary: string; recommendation: string; risks: string[]; targetPrice?: number }> {
  const model = getModel();

  const prompt = `Analyze this stock:

**${params.quote.ticker} — ${params.quote.name}**
Price: ${params.quote.price} ${params.quote.currency}
Change: ${params.quote.changePercent.toFixed(2)}%
P/E: ${params.quote.peRatio ?? "N/A"}
Market Cap: ${params.quote.marketCap ? (params.quote.marketCap / 1e9).toFixed(2) + "B" : "N/A"}
52w Range: ${params.quote.low52w ?? "?"} – ${params.quote.high52w ?? "?"}

**Halal Status: ${params.halal.status.toUpperCase()}**
${params.halal.reasons.join(", ")}

**Technical Signals:**
RSI: ${params.technicals?.rsi ?? "N/A"} (${params.technicals?.rsiSignal ?? "N/A"})
MACD: ${params.technicals?.macdSignal ?? "N/A"}
MA50 > MA200: ${params.technicals?.ma50Above200 ?? "N/A"}
Score: ${params.technicals?.score ?? "N/A"}/100

${params.portfolio ? `**User's Portfolio Context:**
Total portfolio value: ${params.portfolio.totalValueEGP.toFixed(0)} EGP
Holdings: ${params.portfolio.holdings.map((h) => h.ticker).join(", ")}` : ""}

Provide:
1. One-paragraph investment thesis (2-3 sentences)
2. Recommendation: STRONG_BUY / BUY / HOLD / SELL / STRONG_SELL
3. 3 key risks (bullet points)
4. Estimated 12-month target price in ${params.quote.currency} (if confident, otherwise omit)

Format as JSON: { "summary": "...", "recommendation": "HOLD", "risks": ["...", "...", "..."], "targetPrice": 45.00 }`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      summary: parsed.summary ?? "Analysis unavailable.",
      recommendation: parsed.recommendation ?? "HOLD",
      risks: parsed.risks ?? [],
      targetPrice: parsed.targetPrice,
    };
  } catch {
    return {
      summary: "AI analysis temporarily unavailable.",
      recommendation: "HOLD",
      risks: ["Data unavailable — manual research recommended"],
    };
  }
}

export async function chat(
  messages: { role: "user" | "model"; parts: { text: string }[] }[],
  portfolio?: Portfolio
): Promise<string> {
  const model = getModel();

  const portfolioContext = portfolio
    ? `\n\n[USER PORTFOLIO — ${new Date().toLocaleDateString("en-EG")}]\n` +
      portfolio.holdings
        .map((h) => `${h.ticker}: ${h.shares} shares @ ${h.avgCostPrice} avg, now ${h.currentPrice} (${h.unrealizedGainPercent > 0 ? "+" : ""}${h.unrealizedGainPercent.toFixed(1)}%)`)
        .join("\n") +
      `\nTotal value: ${portfolio.totalValueEGP.toFixed(0)} EGP | P&L: ${portfolio.totalUnrealizedGainPercent > 0 ? "+" : ""}${portfolio.totalUnrealizedGainPercent.toFixed(1)}%`
    : "";

  const fullMessages = portfolioContext
    ? [
        { role: "user" as const, parts: [{ text: `[Context]${portfolioContext}` }] },
        { role: "model" as const, parts: [{ text: "Got it, I have your portfolio context." }] },
        ...messages,
      ]
    : messages;

  try {
    const chat = model.startChat({ history: fullMessages.slice(0, -1) });
    const lastMessage = fullMessages[fullMessages.length - 1];
    const result = await chat.sendMessage(lastMessage.parts[0].text);
    return result.response.text();
  } catch {
    return "AI temporarily unavailable. Please try again in a moment.";
  }
}

export async function generateNewsSentiment(article: {
  title: string;
  summary: string;
  portfolioTickers: string[];
}): Promise<{ sentiment: "positive" | "negative" | "neutral"; urgency: "high" | "medium" | "low"; relatedTickers: string[]; shortSummary: string }> {
  const model = getModel();
  const prompt = `Analyze this financial news article for an Egyptian market investor:

Title: ${article.title}
Summary: ${article.summary}
User's portfolio tickers: ${article.portfolioTickers.join(", ")}

Respond as JSON only:
{
  "sentiment": "positive" | "negative" | "neutral",
  "urgency": "high" | "medium" | "low",
  "relatedTickers": ["TICKER1", "TICKER2"],
  "shortSummary": "One sentence summary focusing on market impact"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { sentiment: "neutral", urgency: "low", relatedTickers: [], shortSummary: article.title };
  }
}

export async function generateMorningBrief(params: {
  portfolio: Portfolio;
  egxMovers: { ticker: string; changePercent: number }[];
  news: { title: string; sentiment: string }[];
  usdToEgp: number;
}): Promise<string> {
  const model = getModel();
  const prompt = `Generate a concise morning investment brief (Telegram-formatted with emojis) for today.

Portfolio Summary:
${params.portfolio.holdings.map((h) => `• ${h.ticker}: ${h.currentPrice} ${h.currency} (${h.unrealizedGainPercent > 0 ? "+" : ""}${h.unrealizedGainPercent.toFixed(1)}%)`).join("\n")}
Total: ${params.portfolio.totalValueEGP.toFixed(0)} EGP | P&L: ${params.portfolio.totalUnrealizedGainPercent > 0 ? "+" : ""}${params.portfolio.totalUnrealizedGainPercent.toFixed(1)}%

EGX Top Movers:
${params.egxMovers.slice(0, 5).map((m) => `• ${m.ticker}: ${m.changePercent > 0 ? "+" : ""}${m.changePercent.toFixed(1)}%`).join("\n")}

USD/EGP: ${params.usdToEgp}

Recent News:
${params.news.slice(0, 3).map((n) => `• [${n.sentiment.toUpperCase()}] ${n.title}`).join("\n")}

Keep it under 300 words. Use Telegram markdown (*bold*, _italic_). Focus on what matters for the portfolio.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch {
    return `📊 *Morning Brief*\nAI summary unavailable. Check your portfolio manually.`;
  }
}
