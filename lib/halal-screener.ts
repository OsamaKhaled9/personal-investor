import type { HalalScreenResult, Market } from "./types";
import { getFundamentals } from "./yahoo-finance";
import { supabaseAdmin } from "./supabase";

// AAOIFI-based haram business categories
const HARAM_INDUSTRIES = [
  "alcohol", "beverages—brewers", "beverages—wineries",
  "tobacco", "pork", "gambling", "casinos", "gaming",
  "adult entertainment", "pornography",
  "weapons", "aerospace & defense", "defense",
  "conventional banking", "commercial banks", "mortgage finance",
  "conventional insurance", "insurance—diversified", "life insurance",
  "interest-based finance",
];

const QUESTIONABLE_INDUSTRIES = [
  "entertainment", "media", "hotels", "resorts", "lodging",
  "travel services", "restaurants",
];

// Primary screen: business activity
function screenBusiness(sector: string | null, industry: string | null): { pass: boolean; reasons: string[] } {
  const combined = `${sector ?? ""} ${industry ?? ""}`.toLowerCase();
  const reasons: string[] = [];

  for (const h of HARAM_INDUSTRIES) {
    if (combined.includes(h)) {
      reasons.push(`Business involves ${h}`);
    }
  }

  return { pass: reasons.length === 0, reasons };
}

// Secondary screen: financial ratios (AAOIFI thresholds)
function screenFinancials(data: {
  totalDebt: number | null;
  marketCap: number | null;
  totalRevenue: number | null;
  interestExpense: number | null;
  totalAssets: number | null;
  netReceivables: number | null;
}): { pass: boolean; questionable: boolean; reasons: string[]; ratios: Partial<HalalScreenResult> } {
  const reasons: string[] = [];
  let questionable = false;

  const debtRatio = data.totalDebt && data.marketCap && data.marketCap > 0
    ? data.totalDebt / data.marketCap
    : null;
  const interestRatio = data.interestExpense && data.totalRevenue && data.totalRevenue > 0
    ? Math.abs(data.interestExpense) / data.totalRevenue
    : null;
  const receivablesRatio = data.netReceivables && data.totalAssets && data.totalAssets > 0
    ? data.netReceivables / data.totalAssets
    : null;

  if (debtRatio !== null && debtRatio > 0.33) {
    reasons.push(`Debt/market cap ratio ${(debtRatio * 100).toFixed(1)}% exceeds 33% threshold`);
    questionable = true;
  }
  if (interestRatio !== null && interestRatio > 0.05) {
    reasons.push(`Interest expense/revenue ${(interestRatio * 100).toFixed(1)}% exceeds 5% threshold`);
    questionable = true;
  }
  if (receivablesRatio !== null && receivablesRatio > 0.33) {
    reasons.push(`Receivables/assets ${(receivablesRatio * 100).toFixed(1)}% exceeds 33% threshold`);
    questionable = true;
  }

  return {
    pass: reasons.length === 0,
    questionable,
    reasons,
    ratios: {
      debtRatio: debtRatio ?? undefined,
      interestIncomeRatio: interestRatio ?? undefined,
      receivablesRatio: receivablesRatio ?? undefined,
    },
  };
}

export async function screenStock(ticker: string, market: Market): Promise<HalalScreenResult> {
  // Check cache first
  const { data: cached } = await supabaseAdmin
    .from("halal_cache")
    .select("*")
    .eq("ticker", ticker)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (cached) {
    return {
      status: cached.status,
      reasons: cached.reasons,
      debtRatio: cached.debt_ratio ?? undefined,
      interestIncomeRatio: cached.interest_income_ratio ?? undefined,
      receivablesRatio: cached.receivables_ratio ?? undefined,
      checkedAt: cached.created_at,
    };
  }

  // Fetch fundamentals
  const fundamentals = await getFundamentals(ticker, market);
  if (!fundamentals) {
    const result: HalalScreenResult = {
      status: "unknown",
      reasons: ["Could not fetch fundamental data for screening"],
      checkedAt: new Date().toISOString(),
    };
    await cacheResult(ticker, result);
    return result;
  }

  const businessScreen = screenBusiness(fundamentals.sector, fundamentals.industry);
  if (!businessScreen.pass) {
    const result: HalalScreenResult = {
      status: "haram",
      reasons: businessScreen.reasons,
      checkedAt: new Date().toISOString(),
    };
    await cacheResult(ticker, result);
    return result;
  }

  // Check questionable industries
  const combined = `${fundamentals.sector ?? ""} ${fundamentals.industry ?? ""}`.toLowerCase();
  const isQuestionableIndustry = QUESTIONABLE_INDUSTRIES.some((q) => combined.includes(q));

  const financialScreen = screenFinancials({
    totalDebt: fundamentals.totalDebt,
    marketCap: fundamentals.marketCap,
    totalRevenue: fundamentals.totalRevenue,
    interestExpense: fundamentals.interestExpense,
    totalAssets: fundamentals.totalAssets,
    netReceivables: fundamentals.netReceivables,
  });

  let status: HalalScreenResult["status"] = "halal";
  const allReasons: string[] = [];

  if (isQuestionableIndustry) {
    status = "questionable";
    allReasons.push(`Industry (${fundamentals.industry ?? fundamentals.sector}) requires further review`);
  }
  if (financialScreen.questionable) {
    status = "questionable";
    allReasons.push(...financialScreen.reasons);
  }

  const result: HalalScreenResult = {
    status,
    reasons: allReasons.length > 0 ? allReasons : ["Passes primary business and financial ratio screens"],
    ...financialScreen.ratios,
    checkedAt: new Date().toISOString(),
  };

  await cacheResult(ticker, result);
  return result;
}

async function cacheResult(ticker: string, result: HalalScreenResult) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await supabaseAdmin.from("halal_cache").upsert({
    ticker,
    status: result.status,
    reasons: result.reasons,
    debt_ratio: result.debtRatio ?? null,
    interest_income_ratio: result.interestIncomeRatio ?? null,
    receivables_ratio: result.receivablesRatio ?? null,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
  });
}
