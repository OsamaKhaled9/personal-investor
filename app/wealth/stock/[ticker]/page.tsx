"use client";
import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import { HalalBadge } from "@/components/halal-badge";
import { PriceChange } from "@/components/price-change";
import { PriceChart } from "@/components/charts/price-chart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { StockAnalysis } from "@/lib/types";

export default function StockPage({ params, searchParams }: { params: Promise<{ ticker: string }>; searchParams: Promise<{ market?: string }> }) {
  const { ticker } = use(params);
  const { market = "EGX" } = use(searchParams);

  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [history, setHistory] = useState<{ date: string; close: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isWatched, setIsWatched] = useState(false);
  const [watchId, setWatchId] = useState<string | null>(null);
  const [watchLoading, setWatchLoading] = useState(false);
  const [watchStatus, setWatchStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      setLoading(true);
      try {
        const [analysisData, marketData] = await Promise.all([
          fetch(`/api/ai/analyze?ticker=${ticker}&market=${market}`).then((r) => r.json()),
          fetch(`/api/market/us?ticker=${ticker}&market=${market}&period=1m`).then((r) => r.json()),
        ]);
        if (cancelled) return;
        setAnalysis(analysisData);
        setHistory((marketData.history ?? []).map((h: { date: string; close: number }) => ({ date: h.date, close: h.close })));
        setLoading(false);
      } catch {
        if (!cancelled) { setError("Couldn't load stock data"); setLoading(false); }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [ticker, market, retryCount]);

  useEffect(() => {
    fetch("/api/watchlist")
      .then((r) => r.json())
      .then((d) => {
        const match = (d.items ?? []).find((i: { ticker: string; id: string }) => i.ticker === ticker);
        if (match) { setIsWatched(true); setWatchId(match.id); }
      })
      .catch(() => {});
  }, [ticker]);

  const toggleWatch = async () => {
    setWatchLoading(true);
    setWatchStatus(null);
    try {
      if (isWatched && watchId) {
        await fetch(`/api/watchlist?id=${watchId}`, { method: "DELETE" });
        setIsWatched(false);
        setWatchId(null);
        setWatchStatus("Removed from watchlist");
      } else {
        const res = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker, market, name: analysis?.quote?.name ?? ticker }),
        });
        if (res.ok) {
          const d = await res.json();
          setIsWatched(true);
          setWatchId(d.id);
          setWatchStatus("Added to watchlist");
        }
      }
    } catch {
      setWatchStatus("Failed — try again");
    }
    setWatchLoading(false);
    setTimeout(() => setWatchStatus(null), 2500);
  };

  if (loading) return <StockSkeleton />;
  if (error) return (
    <div className="rounded-xl border border-[var(--accent-red)] bg-[var(--surface)] p-8 text-center">
      <p className="text-[var(--foreground-muted)] mb-3">{error}</p>
      <Button onClick={() => setRetryCount((c) => c + 1)} variant="outline" size="sm">Retry</Button>
    </div>
  );
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
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold font-mono">{ticker}</h1>
            <HalalBadge status={halal.status} />
            <button
              onClick={toggleWatch}
              disabled={watchLoading}
              title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
              className="text-xl leading-none transition-opacity hover:opacity-70 disabled:opacity-40"
            >
              {isWatched ? "🔖" : "🏷️"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[var(--foreground-muted)] text-sm">{quote.name}</p>
            {watchStatus && (
              <span className="text-xs text-[var(--foreground-muted)] bg-[var(--surface-elevated)] px-2 py-0.5 rounded-full">
                {watchStatus}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold font-mono">{quote.price.toFixed(2)} <span className="text-base text-[var(--foreground-muted)]">{quote.currency}</span></p>
          <PriceChange value={quote.change} percent={quote.changePercent} />
        </div>
      </motion.div>

      {history.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <PriceChart data={history} ticker={ticker} positive={positive} />
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[var(--foreground-muted)]">Key Stats</h3>
          <StatRow label="Market Cap" value={quote.marketCap ? `${(quote.marketCap / 1e9).toFixed(2)}B` : "—"} />
          <StatRow label="P/E Ratio" value={quote.peRatio?.toFixed(1) ?? "—"} />
          <StatRow label="52W High" value={quote.high52w?.toFixed(2) ?? "—"} />
          <StatRow label="52W Low" value={quote.low52w?.toFixed(2) ?? "—"} />
          <StatRow label="Volume" value={quote.volume ? quote.volume.toLocaleString() : "—"} />
        </motion.div>

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
