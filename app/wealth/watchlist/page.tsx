"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { HalalBadge } from "@/components/halal-badge";
import { PriceChange } from "@/components/price-change";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { StockQuote } from "@/lib/types";

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

interface WatchlistEntry {
  id: string;
  ticker: string;
  name: string;
  market: string;
  currency: string;
  addedAt: string;
  quote: StockQuote | null;
}

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [addOpen, setAddOpen] = useState(false);

  const refetch = useCallback(async () => {
    const res = await fetch("/api/watchlist");
    if (res.ok) setItems((await res.json()).items ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      setLoading(true);
      try {
        const res = await fetch("/api/watchlist");
        if (cancelled) return;
        if (res.ok) setItems((await res.json()).items ?? []);
        setLoading(false);
      } catch {
        if (!cancelled) { setError("Couldn't load watchlist"); setLoading(false); }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [retryCount]);

  const remove = async (id: string) => {
    await fetch(`/api/watchlist?id=${id}`, { method: "DELETE" });
    refetch();
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold mb-1">Watchlist</h1>
          <p className="text-sm text-[var(--foreground-muted)]">Stocks you're monitoring — without adding to your portfolio</p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--foreground)] border border-[var(--border)] text-sm"
        >
          + Add Stock
        </Button>
      </motion.div>

      {error && (
        <div className="rounded-xl border border-[var(--accent-red)] bg-[var(--surface)] p-6 text-center">
          <p className="text-[var(--foreground-muted)] mb-3">{error}</p>
          <Button onClick={() => setRetryCount((c) => c + 1)} variant="outline" size="sm">Retry</Button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-[var(--surface)]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center"
        >
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-[var(--foreground-muted)] mb-4">Your watchlist is empty</p>
          <Button onClick={() => setAddOpen(true)} className="bg-[var(--accent-blue)] hover:opacity-90 text-white text-sm">
            Add your first stock
          </Button>
        </motion.div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {items.map((item) => (
            <WatchCard key={item.id} item={item} onRemove={remove} />
          ))}
        </motion.div>
      )}

      <AddToWatchlistDialog open={addOpen} onClose={() => setAddOpen(false)} onAdded={refetch} />
    </div>
  );
}

function WatchCard({ item, onRemove }: { item: WatchlistEntry; onRemove: (id: string) => void }) {
  const q = item.quote;
  const positive = (q?.changePercent ?? 0) >= 0;

  return (
    <motion.div
      variants={fadeIn}
      className="group relative rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--foreground-subtle)] transition-colors"
    >
      <button
        onClick={() => onRemove(item.id)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-[var(--foreground-muted)] hover:text-[var(--accent-red)] transition-all text-xs px-1"
      >
        ✕
      </button>

      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <a
              href={`/wealth/stock/${item.ticker}?market=${item.market}`}
              className="font-mono font-bold text-[var(--foreground)] hover:text-[var(--accent-blue)] transition-colors"
            >
              {item.ticker}
            </a>
            {q?.halal && <HalalBadge status={q.halal.status} compact />}
          </div>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5 truncate max-w-[160px]">{item.name}</p>
        </div>
        <div className="text-right">
          {q ? (
            <>
              <p className="font-mono font-semibold text-sm">{q.price.toFixed(2)}</p>
              <p className="text-xs text-[var(--foreground-muted)]">{q.currency}</p>
            </>
          ) : (
            <p className="text-xs text-[var(--foreground-muted)]">—</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-subtle)]">
        <span className="text-xs text-[var(--foreground-muted)]">{item.market}</span>
        <div className="flex items-center gap-3">
          {q && <PriceChange percent={q.changePercent} className="text-xs" />}
          <a
            href={`/wealth/stock/${item.ticker}?market=${item.market}`}
            className="text-xs font-mono text-[var(--accent-blue)] hover:opacity-80"
          >
            Analyze →
          </a>
        </div>
      </div>
    </motion.div>
  );
}

function AddToWatchlistDialog({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ ticker: "", name: "", market: "EGX" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      onAdded();
      onClose();
      setForm({ ticker: "", name: "", market: "EGX" });
    } else {
      const d = await res.json();
      setFormError(d.error ?? "Failed to add");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-[var(--surface)] border-[var(--border)] text-[var(--foreground)] max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to Watchlist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[var(--foreground-muted)]">Ticker *</label>
              <Input
                value={form.ticker}
                onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
                placeholder="COMI"
                required
                className="bg-[var(--surface-elevated)] border-[var(--border)] font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--foreground-muted)]">Market *</label>
              <Select value={form.market} onValueChange={(v) => setForm({ ...form, market: v ?? form.market })}>
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
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Commercial International Bank"
              className="bg-[var(--surface-elevated)] border-[var(--border)]"
            />
          </div>
          {formError && <p className="text-xs text-[var(--accent-red)]">{formError}</p>}
          <Button type="submit" disabled={saving} className="w-full bg-[var(--accent-blue)] hover:opacity-90 text-white">
            {saving ? "Adding..." : "Add to Watchlist"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
