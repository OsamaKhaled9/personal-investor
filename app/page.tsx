"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { HalalBadge } from "@/components/halal-badge";
import { PriceChange } from "@/components/price-change";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Portfolio, Holding, NewsArticle } from "@/lib/types";

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const loadPortfolio = useCallback(async () => {
    const res = await fetch("/api/portfolio");
    if (res.ok) setPortfolio(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPortfolio();
    fetch("/api/news").then((r) => r.json()).then((d) => setNews(d.articles ?? []));
  }, [loadPortfolio]);

  const removeHolding = async (id: string) => {
    await fetch(`/api/portfolio?id=${id}`, { method: "DELETE" });
    loadPortfolio();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between"
      >
        <div>
          <p className="text-xs text-[var(--foreground-muted)] font-mono uppercase tracking-widest mb-1">Portfolio Value</p>
          {loading ? (
            <Skeleton className="h-10 w-48 bg-[var(--surface-elevated)]" />
          ) : (
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold font-mono tracking-tight">
                {(portfolio?.totalValueEGP ?? 0).toLocaleString("en-EG", { maximumFractionDigits: 0 })}
                <span className="text-lg text-[var(--foreground-muted)] ml-1">EGP</span>
              </span>
              {portfolio && (
                <PriceChange percent={portfolio.totalUnrealizedGainPercent} className="text-base" />
              )}
            </div>
          )}
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--foreground)] border border-[var(--border)] text-sm"
        >
          + Add Holding
        </Button>
      </motion.div>

      {/* Holdings grid */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-widest text-[var(--foreground-muted)] mb-3">Holdings</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl bg-[var(--surface)]" />
            ))}
          </div>
        ) : portfolio?.holdings.length === 0 ? (
          <EmptyPortfolio onAdd={() => setAddOpen(true)} />
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {portfolio?.holdings.map((h) => (
              <HoldingCard key={h.id} holding={h} onRemove={removeHolding} />
            ))}
          </motion.div>
        )}
      </section>

      {/* Summary stats */}
      {portfolio && portfolio.holdings.length > 0 && (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Invested" value={`${portfolio.totalCostEGP.toLocaleString("en-EG", { maximumFractionDigits: 0 })} EGP`} />
            <StatCard
              label="Unrealized P&L"
              value={`${portfolio.totalUnrealizedGainEGP >= 0 ? "+" : ""}${portfolio.totalUnrealizedGainEGP.toLocaleString("en-EG", { maximumFractionDigits: 0 })} EGP`}
              valueClass={portfolio.totalUnrealizedGainEGP >= 0 ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}
            />
            <StatCard label="Holdings" value={String(portfolio.holdings.length)} />
            <StatCard label="Halal Violations" value={String(portfolio.holdings.filter((h) => h.halal?.status === "haram").length)} valueClass="text-[var(--accent-red)]" />
          </div>
        </motion.section>
      )}

      {/* News feed */}
      {news.length > 0 && (
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-[var(--foreground-muted)] mb-3">Market News</h2>
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
            {news.slice(0, 6).map((article) => (
              <NewsItem key={article.id} article={article} />
            ))}
          </motion.div>
        </section>
      )}

      <AddHoldingDialog open={addOpen} onClose={() => setAddOpen(false)} onAdded={loadPortfolio} />
    </div>
  );
}

function HoldingCard({ holding: h, onRemove }: { holding: Holding; onRemove: (id: string) => void }) {
  const positive = h.unrealizedGainPercent >= 0;
  return (
    <motion.div
      variants={fadeIn}
      className="group relative rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--foreground-subtle)] transition-colors"
    >
      <button
        onClick={() => onRemove(h.id)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-[var(--foreground-muted)] hover:text-[var(--accent-red)] transition-all text-xs px-1"
      >
        ✕
      </button>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <a href={`/stock/${h.ticker}?market=${h.market}`} className="font-mono font-bold text-[var(--foreground)] hover:text-[var(--accent-blue)] transition-colors">
              {h.ticker}
            </a>
            <HalalBadge status={h.halal?.status ?? "unknown"} compact />
          </div>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5 truncate max-w-[160px]">{h.name}</p>
        </div>
        <div className="text-right">
          <p className="font-mono font-semibold text-sm">{h.currentPrice.toFixed(2)}</p>
          <p className="text-xs text-[var(--foreground-muted)]">{h.currency}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-subtle)]">
        <div>
          <p className="text-xs text-[var(--foreground-muted)]">{h.shares} shares</p>
          <p className="text-xs text-[var(--foreground-muted)]">avg {h.avgCostPrice.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className={`font-mono text-sm font-medium ${positive ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}`}>
            {positive ? "+" : ""}{h.unrealizedGainPercent.toFixed(2)}%
          </p>
          <p className={`font-mono text-xs ${positive ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"} opacity-70`}>
            {positive ? "+" : ""}{h.unrealizedGain.toFixed(0)} {h.currency}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function NewsItem({ article }: { article: NewsArticle }) {
  const sentimentColor = article.sentiment === "positive" ? "bg-green-500" : article.sentiment === "negative" ? "bg-red-500" : "bg-zinc-500";
  return (
    <motion.a
      variants={fadeIn}
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--foreground-subtle)] transition-colors group"
    >
      <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${sentimentColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--foreground)] group-hover:text-[var(--accent-blue)] transition-colors line-clamp-2">{article.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-[var(--foreground-muted)]">{article.source}</span>
          {article.relatedTickers.length > 0 && (
            <span className="text-xs font-mono text-[var(--foreground-subtle)]">{article.relatedTickers.slice(0, 3).join(", ")}</span>
          )}
        </div>
      </div>
    </motion.a>
  );
}

function StatCard({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs text-[var(--foreground-muted)] font-mono uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-mono font-bold text-lg ${valueClass ?? "text-[var(--foreground)]"}`}>{value}</p>
    </div>
  );
}

function EmptyPortfolio({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center"
    >
      <p className="text-4xl mb-3">📭</p>
      <p className="text-[var(--foreground-muted)] mb-4">Your portfolio is empty</p>
      <Button onClick={onAdd} className="bg-[var(--accent-blue)] hover:opacity-90 text-white text-sm">
        Add your first holding
      </Button>
    </motion.div>
  );
}

function AddHoldingDialog({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ ticker: "", name: "", market: "EGX", currency: "EGP", shares: "", avgCostPrice: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, shares: parseFloat(form.shares), avgCostPrice: parseFloat(form.avgCostPrice) }),
    });
    setSaving(false);
    if (res.ok) {
      onAdded();
      onClose();
      setForm({ ticker: "", name: "", market: "EGX", currency: "EGP", shares: "", avgCostPrice: "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-[var(--surface)] border-[var(--border)] text-[var(--foreground)] max-w-md">
        <DialogHeader>
          <DialogTitle>Add Holding</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[var(--foreground-muted)]">Ticker *</label>
              <Input value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })} placeholder="COMI" required className="bg-[var(--surface-elevated)] border-[var(--border)] font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--foreground-muted)]">Market *</label>
              <Select value={form.market} onValueChange={(v) => { const m = v ?? form.market; setForm({ ...form, market: m, currency: m === "EGX" ? "EGP" : "USD" }); }}>
                <SelectTrigger className="bg-[var(--surface-elevated)] border-[var(--border)]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[var(--surface-elevated)] border-[var(--border)]">
                  <SelectItem value="EGX">EGX (Egypt)</SelectItem>
                  <SelectItem value="US">US Market</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[var(--foreground-muted)]">Company Name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Commercial International Bank" className="bg-[var(--surface-elevated)] border-[var(--border)]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[var(--foreground-muted)]">Shares *</label>
              <Input type="number" step="any" value={form.shares} onChange={(e) => setForm({ ...form, shares: e.target.value })} placeholder="100" required className="bg-[var(--surface-elevated)] border-[var(--border)] font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--foreground-muted)]">Avg Cost ({form.currency}) *</label>
              <Input type="number" step="any" value={form.avgCostPrice} onChange={(e) => setForm({ ...form, avgCostPrice: e.target.value })} placeholder="45.50" required className="bg-[var(--surface-elevated)] border-[var(--border)] font-mono" />
            </div>
          </div>
          <Button type="submit" disabled={saving} className="w-full bg-[var(--accent-blue)] hover:opacity-90 text-white">
            {saving ? "Adding..." : "Add Holding"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
