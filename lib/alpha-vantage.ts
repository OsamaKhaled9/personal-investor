const AV_BASE = "https://www.alphavantage.co/query";

export async function fetchUSFundamentalsAV(ticker: string) {
  const key = process.env.ALPHA_VANTAGE_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `${AV_BASE}?function=COMPANY_OVERVIEW&symbol=${encodeURIComponent(ticker)}&apikey=${key}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const d = await res.json();
    if (d.Note || d["Error Message"] || !d.Symbol) return null;
    const n = (v: string) => parseFloat(v) || null;
    return {
      marketCap:       n(d.MarketCapitalization),
      peRatio:         n(d.PERatio),
      high52w:         n(d["52WeekHigh"]),
      low52w:          n(d["52WeekLow"]),
      totalRevenue:    n(d.RevenueTTM),
      totalDebt:       n(d.TotalDebtToEquityQuarterly),
      debtToEquity:    n(d.DebtToEquityRatioQuarterly),
      sector:          (d.Sector as string) || null,
      industry:        (d.Industry as string) || null,
      totalCash:       null as null,
      businessSummary: null as null,
      interestExpense: null as null,
      totalAssets:     null as null,
      netReceivables:  null as null,
    };
  } catch {
    return null;
  }
}
