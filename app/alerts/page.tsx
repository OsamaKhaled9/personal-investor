"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { AlertRule } from "@/lib/types";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const loadAlerts = useCallback(async () => {
    const res = await fetch("/api/alerts");
    if (res.ok) {
      const d = await res.json();
      setAlerts(d.alerts ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  const deleteAlert = async (id: string) => {
    await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
    loadAlerts();
  };

  const active = alerts.filter((a) => a.active);
  const triggered = alerts.filter((a) => !a.active && a.triggeredAt);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Price Alerts</h1>
          <p className="text-sm text-[var(--foreground-muted)]">Triggers send to Telegram instantly</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--foreground)] border border-[var(--border)] text-sm">
          + New Alert
        </Button>
      </motion.div>

      {/* Active alerts */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-widest text-[var(--foreground-muted)] mb-3">Active ({active.length})</h2>
        {loading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg bg-[var(--surface)]" />)}</div>
        ) : active.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-[var(--foreground-muted)] text-sm">
            No active alerts. Set one and get notified on Telegram.
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            {active.map((alert) => (
              <AlertRow key={alert.id} alert={alert} onDelete={deleteAlert} />
            ))}
          </motion.div>
        )}
      </section>

      {/* Triggered alerts */}
      {triggered.length > 0 && (
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-[var(--foreground-muted)] mb-3">Triggered ({triggered.length})</h2>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden opacity-60">
            {triggered.map((alert) => (
              <AlertRow key={alert.id} alert={alert} onDelete={deleteAlert} />
            ))}
          </div>
        </section>
      )}

      {/* Telegram tip */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-xs font-mono uppercase tracking-widest text-[var(--foreground-muted)] mb-2">Telegram Bot Commands</p>
        <div className="space-y-1.5 font-mono text-xs text-[var(--foreground-muted)]">
          <p><span className="text-[var(--accent-blue)]">/alert COMI 45 price_above</span> — set via bot</p>
          <p><span className="text-[var(--accent-blue)]">/alerts</span> — list active alerts</p>
          <p><span className="text-[var(--accent-blue)]">/analyze COMI</span> — full AI analysis</p>
          <p><span className="text-[var(--accent-blue)]">/portfolio</span> — live portfolio summary</p>
        </div>
      </div>

      <AddAlertDialog open={addOpen} onClose={() => setAddOpen(false)} onAdded={loadAlerts} />
    </div>
  );
}

function AlertRow({ alert, onDelete }: { alert: AlertRule; onDelete: (id: string) => void }) {
  const typeLabel = alert.type === "price_above" ? "Above" : alert.type === "price_below" ? "Below" : "Change%";
  const icon = alert.type === "price_above" ? "📈" : alert.type === "price_below" ? "📉" : "⚡";
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm">{alert.ticker}</span>
            <Badge variant="outline" className="text-xs border-[var(--border)] text-[var(--foreground-muted)]">{alert.market}</Badge>
            <span className="text-xs text-[var(--foreground-muted)]">{typeLabel}</span>
          </div>
          <p className="font-mono text-lg font-semibold">{alert.threshold.toFixed(2)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {alert.triggeredAt && (
          <span className="text-xs text-[var(--foreground-muted)]">
            {new Date(alert.triggeredAt).toLocaleDateString()}
          </span>
        )}
        <Badge className={alert.active ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"}>
          {alert.active ? "Active" : "Triggered"}
        </Badge>
        <button onClick={() => onDelete(alert.id)} className="text-[var(--foreground-muted)] hover:text-[var(--accent-red)] transition-colors text-xs px-2">✕</button>
      </div>
    </div>
  );
}

function AddAlertDialog({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ ticker: "", market: "EGX", type: "price_above", threshold: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, threshold: parseFloat(form.threshold) }),
    });
    setSaving(false);
    onAdded();
    onClose();
    setForm({ ticker: "", market: "EGX", type: "price_above", threshold: "" });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-[var(--surface)] border-[var(--border)] text-[var(--foreground)] max-w-sm">
        <DialogHeader><DialogTitle>New Price Alert</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[var(--foreground-muted)]">Ticker *</label>
              <Input value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })} placeholder="COMI" required className="bg-[var(--surface-elevated)] border-[var(--border)] font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--foreground-muted)]">Market</label>
              <Select value={form.market} onValueChange={(v) => setForm({ ...form, market: v ?? form.market })}>
                <SelectTrigger className="bg-[var(--surface-elevated)] border-[var(--border)]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[var(--surface-elevated)] border-[var(--border)]">
                  <SelectItem value="EGX">EGX</SelectItem>
                  <SelectItem value="US">US</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[var(--foreground-muted)]">Alert Type</label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v ?? form.type })}>
              <SelectTrigger className="bg-[var(--surface-elevated)] border-[var(--border)]"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[var(--surface-elevated)] border-[var(--border)]">
                <SelectItem value="price_above">Price Above</SelectItem>
                <SelectItem value="price_below">Price Below</SelectItem>
                <SelectItem value="percent_change">% Change</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[var(--foreground-muted)]">Threshold Price *</label>
            <Input type="number" step="any" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} placeholder="45.00" required className="bg-[var(--surface-elevated)] border-[var(--border)] font-mono" />
          </div>
          <Button type="submit" disabled={saving} className="w-full bg-[var(--accent-blue)] hover:opacity-90 text-white">
            {saving ? "Creating..." : "Create Alert"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
