"use client";
import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import { HalalBadge } from "@/components/halal-badge";
import { PriceChange } from "@/components/price-change";
import { PriceChart } from "@/components/charts/price-chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { StockAnalysis } from "@/lib/types";

export default function StockPage({ params, searchParams }: { params: Promise<{ ticker: string }>; searchParams: Promise<{ market?: string }> }) {
  const { ticker } = use(params);
  const { market = "EGX" } = use(searchParams);

  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [history, setHistory] = useState<{ date: string; close: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/ai/analyze?ticker=${ticker}&market=${market}`).then((r) => r.json()),
      fetch(`/api/market/us?ticker=${ticker}&market=${market}&period=1m`).then((r) => r.json()),
    ]).then(([analysis, marketData]) => {
      setAnalysis(analysis);
      setHistory((marketData.history ?? []).map((h: { date: string; close: number }) => ({ date: h.date, close: h.close })));
      setLoading(false);
    });
  }, [ticker, market]);

  if (loading) return <StockSkeleton />;
  if (!analysis?.quote) return <div className="text-center py-20 text-[var(--foreground-muted)]">Stock not found</div>;

  const { quote, halal, technical } = analysis;
  const positive = quote.changePercent >= 0;

  const recColor: Record<string, string> = {
    strong_buy: "text-[var(--accent-green)]",
    buy: "text-green-400",
    hold: "text-[var(--accent-gold)]",
    sell: "text-orange-400",
    strong_sell: "text-[var(--accent-red)]",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold font-mono">{ticker}</h1>
            <HalalBadge status={halal.status} />
          </div>
          <p className="text-[var(--foreground-muted)] text-sm">{quote.name}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold font-mono">{quote.price.toFixed(2)} <span className="text-base text-[var(--foreground-muted)]">{quote.currency}</span></p>
          <PriceChange value={quote.change} percent={quote.changePercent} />
        </div>
      </motion.div>

      {/* Price chart */}
      {history.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <PriceChart data={history} ticker={ticker} positive={positive} />
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Key stats */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[var(--foreground-muted)]">Key Stats</h3>
          <StatRow label="Market Cap" value={quote.marketCap ? `${(quote.marketCap / 1e9).toFixed(2)}B` : "—"} />
          <StatRow label="P/E Ratio" value={quote.peRatio?.toFixed(1) ?? "—"} />
          <StatRow label="52W High" value={quote.high52w?.toFixed(2) ?? "—"} />
          <StatRow label="52W Low" value={quote.low52w?.toFixed(2) ?? "—"} />
          <StatRow label="Volume" value={quote.volume ? quote.volume.toLocaleString() : "—"} />
        </motion.div>

        {/* Technical signals */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[var(--foreground-muted)]">Technical Signals</h3>
          {technical ? (
            <>
              <StatRow label="RSI (14)" value={`${technical.rsi.toFixed(1)} — ${technical.rsiSignal}`} highlight={technical.rsiSignal === "oversold" ? "green" : technical.rsiSignal === "overbought" ? "red" : undefined} />
              <StatRow label="MACD" value={technical.macdSignal} highlight={technical.macdSignal === "bullish" ? "green" : "red"} />
              <StatRow label="MA50 > MA200" value={technical.ma50Above200 ? "Yes (Golden)" : "No (Death)"} highlight={technical.ma50Above200 ? "green" : "red"} />
              <div className="pt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--foreground-muted)] font-mono">Score</span>
                  <span className={`font-mono font-bold ${technical.score >= 60 ? "text-[var(--accent-green)]" : technical.score <= 40 ? "text-[var(--accent-red)]" : "text-[var(--accent-gold)]"}`}>{technical.score}/100</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--border)]">
                  <div className="h-full rounded-full bg-[var(--accent-blue)] transition-all" style={{ width: `${technical.score}%` }} />
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-[var(--foreground-muted)]">Insufficient data for technicals</p>
          )}
        </motion.div>

        {/* Halal details */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[var(--foreground-muted)]">Halal Screen</h3>
          <HalalBadge status={halal.status} />
          <div className="space-y-1.5 mt-2">
            {halal.reasons.map((r, i) => (
              <p key={i} className="text-xs text-[var(--foreground-muted)] flex items-start gap-1.5">
                <span className="mt-0.5 flex-shrink-0">{halal.status === "halal" ? "✓" : halal.status === "haram" ? "✗" : "⚠"}</span>
                {r}
              </p>
            ))}
          </div>
          {halal.debtRatio !== undefined && (
            <div className="pt-2 space-y-1 border-t border-[var(--border)]">
              {halal.debtRatio !== undefined && <StatRow label="Debt/Market Cap" value={`${(halal.debtRatio * 100).toFixed(1)}%`} highlight={halal.debtRatio < 0.33 ? "green" : "red"} />}
              {halal.interestIncomeRatio !== undefined && <StatRow label="Interest/Revenue" value={`${(halal.interestIncomeRatio * 100).toFixed(1)}%`} highlight={halal.interestIncomeRatio < 0.05 ? "green" : "red"} />}
            </div>
          )}
        </motion.div>
      </div>

      {/* AI Analysis */}
      {analysis.aiSummary && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[var(--foreground-muted)]">AI Analysis</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--foreground-muted)]">Recommendation:</span>
              <span className={`font-mono font-bold text-sm ${recColor[analysis.recommendation] ?? "text-[var(--foreground)]"}`}>
                {analysis.recommendation.replace("_", " ").toUpperCase()}
              </span>
            </div>
          </div>
          <p className="text-sm text-[var(--foreground)] leading-relaxed mb-4">{analysis.aiSummary}</p>
          {analysis.risks.length > 0 && (
            <div>
              <p className="text-xs font-mono text-[var(--foreground-muted)] mb-2">RISKS</p>
              <ul className="space-y-1">
                {analysis.risks.map((r, i) => (
                  <li key={i} className="text-xs text-[var(--foreground-muted)] flex items-start gap-2">
                    <span className="text-[var(--accent-red)] mt-0.5 flex-shrink-0">•</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {analysis.targetPrice && (
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <span className="text-xs text-[var(--foreground-muted)] font-mono">12M TARGET </span>
              <span className="font-mono font-bold text-[var(--accent-blue)]">{analysis.targetPrice.toFixed(2)} {quote.currency}</span>
              <span className="text-xs text-[var(--foreground-muted)] ml-2">
                ({((analysis.targetPrice - quote.price) / quote.price * 100).toFixed(1)}% potential)
              </span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: "green" | "red" }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-[var(--foreground-muted)] font-mono">{label}</span>
      <span className={`text-xs font-mono font-medium ${highlight === "green" ? "text-[var(--accent-green)]" : highlight === "red" ? "text-[var(--accent-red)]" : "text-[var(--foreground)]"}`}>{value}</span>
    </div>
  );
}

function StockSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-12 w-40 bg-[var(--surface)]" />
        <Skeleton className="h-12 w-32 bg-[var(--surface)]" />
      </div>
      <Skeleton className="h-52 rounded-xl bg-[var(--surface)]" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl bg-[var(--surface)]" />)}
      </div>
    </div>
  );
}
