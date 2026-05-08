"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HalalBadge } from "@/components/halal-badge";
import { PriceChange } from "@/components/price-change";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StockQuote } from "@/lib/types";

const stagger = { show: { transition: { staggerChildren: 0.04 } } };
const fadeIn = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function MarketPage() {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("EGX");

  const loadQuotes = (market: string) => {
    setLoading(true);
    setError(null);
    const endpoint = market === "EGX" ? "/api/market/egx" : "/api/market/us/list";
    fetch(endpoint)
      .then((r) => r.json())
      .then((d) => { setQuotes(d.quotes ?? []); setLoading(false); })
      .catch(() => { setError("Couldn't load market data"); setLoading(false); });
  };

  useEffect(() => { loadQuotes(tab); }, [tab]);

  const filtered = quotes.filter((q) =>
    q.ticker.toLowerCase().includes(search.toLowerCase()) ||
    q.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">Market Screener</h1>
        <p className="text-sm text-[var(--foreground-muted)]">Halal-filtered stocks — all haram industries excluded by default</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ticker or company..."
          className="bg-[var(--surface)] border-[var(--border)] max-w-xs"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--accent-red)] bg-[var(--surface)] p-6 text-center">
          <p className="text-[var(--foreground-muted)] mb-3">{error}</p>
          <Button onClick={() => loadQuotes(tab)} variant="outline" size="sm">Retry</Button>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-[var(--surface)] border border-[var(--border)]">
          <TabsTrigger value="EGX" className="data-[state=active]:bg-[var(--surface-elevated)]">EGX</TabsTrigger>
          <TabsTrigger value="US" className="data-[state=active]:bg-[var(--surface-elevated)]">US Halal</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg bg-[var(--surface)]" />)}
            </div>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show" className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-[var(--border)] text-xs font-mono uppercase tracking-widest text-[var(--foreground-muted)]">
                <span className="col-span-4">Company</span>
                <span className="col-span-2 text-right">Price</span>
                <span className="col-span-2 text-right">Change</span>
                <span className="col-span-2 text-right">P/E</span>
                <span className="col-span-2 text-right">Halal</span>
              </div>
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-[var(--foreground-muted)] text-sm">No stocks found</div>
              ) : (
                filtered.map((q) => <StockRow key={q.ticker} quote={q} />)
              )}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StockRow({ quote: q }: { quote: StockQuote }) {
  return (
    <motion.a
      variants={fadeIn}
      href={`/wealth/stock/${q.ticker}?market=${q.market}`}
      className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-elevated)] transition-colors items-center"
    >
      <div className="col-span-4">
        <p className="font-mono font-semibold text-sm text-[var(--foreground)]">{q.ticker}</p>
        <p className="text-xs text-[var(--foreground-muted)] truncate">{q.name}</p>
      </div>
      <div className="col-span-2 text-right">
        <p className="font-mono text-sm">{q.price.toFixed(2)}</p>
        <p className="text-xs text-[var(--foreground-muted)]">{q.currency}</p>
      </div>
      <div className="col-span-2 text-right">
        <PriceChange percent={q.changePercent} />
      </div>
      <div className="col-span-2 text-right font-mono text-sm text-[var(--foreground-muted)]">
        {q.peRatio ? q.peRatio.toFixed(1) : "—"}
      </div>
      <div className="col-span-2 flex justify-end">
        <HalalBadge status={q.halal?.status ?? "unknown"} compact />
      </div>
    </motion.a>
  );
}
