"use client";
import { useState, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Khatma } from "@/lib/types";

type Props = {
  active: Khatma | null;
  history: Khatma[];
  totalKhatmas: number;
  onUpdated: () => void;
};

function todayStr(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
}

function formatDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ── Active khatma card ────────────────────────────────────────────────────────

function ActiveKhatmaCard({
  khatma,
  onUpdated,
}: {
  khatma: Khatma;
  onUpdated: () => void;
}) {
  const [showStepper, setShowStepper] = useState(false);
  const [stepperValue, setStepperValue] = useState(khatma.current_page);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  const pct = (khatma.current_page / 604) * 100;
  const daysElapsed = Math.floor(
    (Date.now() - new Date(khatma.started_at + "T00:00:00").getTime()) / 86_400_000
  );
  const daysLeft = Math.max(
    1,
    Math.ceil(
      (new Date(khatma.target_date + "T00:00:00").getTime() - Date.now()) / 86_400_000
    )
  );
  const pagesLeft = 604 - khatma.current_page;
  const pagesPerDay = Math.ceil(pagesLeft / daysLeft);
  const canComplete = khatma.current_page === 604;

  const openStepper = useCallback(() => {
    setStepperValue(khatma.current_page);
    setShowStepper((v) => !v);
  }, [khatma.current_page]);

  const handleSavePage = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/quran/khatma/${khatma.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_page", current_page: stepperValue }),
      });
      if (!res.ok) throw new Error("Failed");
      onUpdated();
      setShowStepper(false);
    } catch {
      // user can retry
    } finally {
      setSaving(false);
    }
  }, [khatma.id, stepperValue, saving, onUpdated]);

  const handleComplete = useCallback(async () => {
    if (completing || !canComplete) return;
    setCompleting(true);
    try {
      const res = await fetch(`/api/quran/khatma/${khatma.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
      if (!res.ok) throw new Error("Failed");
      onUpdated();
    } catch {
      // user can retry
    } finally {
      setCompleting(false);
    }
  }, [khatma.id, canComplete, completing, onUpdated]);

  return (
    <div
      className="rounded-2xl border p-4 space-y-3"
      style={{ borderColor: "rgba(201,145,61,0.18)", background: "var(--surface)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p
            className="font-mono text-[9px] uppercase tracking-[0.18em]"
            style={{ color: "var(--foreground-muted)" }}
          >
            Active Khatma · Started {formatDate(khatma.started_at)}
          </p>
        </div>
        <p
          className="font-mono text-sm font-bold tabular-nums shrink-0"
          style={{ color: "var(--hayati-gold-400)" }}
        >
          {pct.toFixed(1)}%
        </p>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: "var(--surface-elevated)" }}
      >
        <motion.div
          className="h-full rounded-full origin-left"
          style={{
            background:
              "linear-gradient(90deg, var(--hayati-gold-600), var(--hayati-gold-300))",
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: pct / 100 }}
          transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.15 }}
        />
      </div>

      {/* Stats */}
      <div className="space-y-0.5">
        <p className="font-mono text-xs" style={{ color: "var(--foreground-muted)" }}>
          Page {khatma.current_page} / 604 · {daysElapsed} day
          {daysElapsed !== 1 ? "s" : ""} elapsed
        </p>
        <p className="font-mono text-xs" style={{ color: "var(--foreground-muted)" }}>
          Need {pagesPerDay} pages/day to finish by {formatDate(khatma.target_date)}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={openStepper}
          className="font-mono text-[10px] px-3 py-1.5 rounded-lg"
          style={{
            background: "var(--surface-elevated)",
            color: "var(--foreground-muted)",
            border: "1px solid var(--border)",
          }}
        >
          Update Khatma Position
        </button>

        <motion.button
          whileTap={{ scale: canComplete ? 0.94 : 1 }}
          onClick={handleComplete}
          disabled={!canComplete || completing}
          className="font-mono text-[10px] px-3 py-1.5 rounded-lg"
          style={{
            background: canComplete
              ? "rgba(74,154,112,0.12)"
              : "var(--surface-elevated)",
            color: canComplete ? "var(--accent-green)" : "var(--foreground-muted)",
            border: `1px solid ${canComplete ? "rgba(74,154,112,0.25)" : "var(--border)"}`,
            opacity: completing ? 0.6 : 1,
          }}
        >
          Complete ✓
        </motion.button>
      </div>

      {/* Inline stepper */}
      <AnimatePresence initial={false}>
        {showStepper && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="overflow-hidden"
          >
            <div
              className="pt-3 border-t space-y-3"
              style={{ borderColor: "var(--border)" }}
            >
              <p
                className="font-mono text-[9px] uppercase tracking-widest"
                style={{ color: "var(--foreground-muted)" }}
              >
                Update page
              </p>
              <div className="flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setStepperValue((p) => Math.max(1, p - 1))}
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg shrink-0"
                  style={{
                    background: "var(--surface-elevated)",
                    color: "var(--foreground-muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  −
                </motion.button>

                <div className="flex-1 text-center">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={stepperValue}
                      initial={{ opacity: 0, y: -6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="font-mono font-bold text-2xl tabular-nums block"
                      style={{ color: "var(--hayati-gold-400)" }}
                    >
                      {stepperValue}
                    </motion.span>
                  </AnimatePresence>
                  <span
                    className="font-mono text-[9px]"
                    style={{ color: "var(--foreground-muted)" }}
                  >
                    / 604
                  </span>
                </div>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setStepperValue((p) => Math.min(604, p + 1))}
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg shrink-0"
                  style={{
                    background: "var(--surface-elevated)",
                    color: "var(--foreground-muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  +
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSavePage}
                  disabled={saving}
                  className="px-4 h-9 rounded-xl font-mono text-sm font-semibold shrink-0"
                  style={{
                    background: "rgba(201,145,61,0.12)",
                    color: "var(--hayati-gold-400)",
                    border: "1px solid rgba(201,145,61,0.22)",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? "..." : "Save"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── New khatma form ───────────────────────────────────────────────────────────

function NewKhatmaForm({ onCreated }: { onCreated: () => void }) {
  const today = todayStr();
  const [targetDate, setTargetDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => {
    if (!targetDate) return null;
    const daysLeft = Math.max(
      1,
      Math.ceil(
        (new Date(targetDate + "T00:00:00").getTime() - Date.now()) / 86_400_000
      )
    );
    return { pagesPerDay: Math.ceil(604 / daysLeft) };
  }, [targetDate]);

  const handleSubmit = useCallback(async () => {
    if (!targetDate || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/quran/khatma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_date: targetDate }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Failed");
      }
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start khatma");
    } finally {
      setSubmitting(false);
    }
  }, [targetDate, submitting, onCreated]);

  return (
    <div className="space-y-3 pt-3 mt-2 border-t" style={{ borderColor: "var(--border)" }}>
      <div>
        <label
          className="font-mono text-[9px] uppercase tracking-widest block mb-1"
          style={{ color: "var(--foreground-muted)" }}
        >
          Target completion date
        </label>
        <input
          type="date"
          min={today}
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 font-mono text-sm outline-none"
          style={{
            background: "var(--surface-elevated)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        />
      </div>

      <AnimatePresence>
        {preview && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="font-mono text-[10px]"
            style={{ color: "var(--hayati-gold-400)" }}
          >
            You&apos;ll need {preview.pagesPerDay} pages/day
          </motion.p>
        )}
      </AnimatePresence>

      {error && (
        <p className="font-mono text-[10px]" style={{ color: "var(--accent-red)" }}>
          {error}
        </p>
      )}

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleSubmit}
        disabled={!targetDate || submitting}
        className="w-full py-2 rounded-xl font-mono text-sm font-semibold"
        style={{
          background: "rgba(201,145,61,0.12)",
          color: "var(--hayati-gold-400)",
          border: "1px solid rgba(201,145,61,0.22)",
          opacity: !targetDate || submitting ? 0.5 : 1,
        }}
      >
        {submitting ? "Starting..." : "Start Khatma"}
      </motion.button>
    </div>
  );
}

// ── History item ──────────────────────────────────────────────────────────────

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 28 },
  },
};

const KhatmaHistoryItem = memo(function KhatmaHistoryItem({
  khatma,
  num,
}: {
  khatma: Khatma;
  num: number;
}) {
  const duration =
    khatma.completed_at
      ? Math.round(
          (new Date(khatma.completed_at + "T00:00:00").getTime() -
            new Date(khatma.started_at + "T00:00:00").getTime()) /
            86_400_000
        ) + 1
      : null;

  return (
    <motion.div
      variants={itemVariants}
      className="flex items-center justify-between py-2 border-b last:border-0"
      style={{ borderColor: "var(--border)" }}
    >
      <div>
        <p
          className="font-mono text-xs font-semibold"
          style={{ color: "var(--accent-green)" }}
        >
          ✓ Khatma #{num}
        </p>
        <p
          className="font-mono text-[10px] mt-0.5"
          style={{ color: "var(--foreground-muted)" }}
        >
          {formatDate(khatma.started_at)} →{" "}
          {khatma.completed_at ? formatDate(khatma.completed_at) : "—"}
          {duration != null ? ` · ${duration} days` : ""}
        </p>
      </div>
    </motion.div>
  );
});

// ── Main export ───────────────────────────────────────────────────────────────

const listVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

export function KhatmaSection({ active, history, totalKhatmas, onUpdated }: Props) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const handleCreated = useCallback(() => {
    onUpdated();
    setShowNewForm(false);
  }, [onUpdated]);

  const visibleHistory = showAllHistory ? history : history.slice(0, 3);

  return (
    <div className="space-y-3">
      {/* Section label */}
      <p
        className="font-mono text-[9px] uppercase tracking-[0.18em]"
        style={{ color: "var(--foreground-muted)" }}
      >
        Khatma
      </p>

      {/* Active khatma or empty state */}
      <AnimatePresence mode="wait">
        {active ? (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <ActiveKhatmaCard khatma={active} onUpdated={onUpdated} />
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border p-4"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <p
              className="font-mono text-xs mb-3"
              style={{ color: "var(--foreground-muted)" }}
            >
              No active Khatma
            </p>

            <button
              onClick={() => setShowNewForm((v) => !v)}
              className="font-mono text-sm font-semibold px-4 py-2 rounded-xl"
              style={{
                background: "rgba(201,145,61,0.10)",
                color: "var(--hayati-gold-400)",
                border: "1px solid rgba(201,145,61,0.20)",
              }}
            >
              + Start New Khatma
            </button>

            <AnimatePresence initial={false}>
              {showNewForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                  className="overflow-hidden"
                >
                  <NewKhatmaForm onCreated={handleCreated} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History list */}
      {history.length > 0 && (
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <p
            className="font-mono text-[9px] uppercase tracking-widest mb-3"
            style={{ color: "var(--foreground-muted)" }}
          >
            Completed · {totalKhatmas} total
          </p>

          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            {visibleHistory.map((k, i) => (
              <KhatmaHistoryItem
                key={k.id}
                khatma={k}
                num={totalKhatmas - i}
              />
            ))}
          </motion.div>

          {history.length > 3 && (
            <button
              onClick={() => setShowAllHistory((v) => !v)}
              className="mt-2 font-mono text-[10px]"
              style={{ color: "var(--foreground-muted)" }}
            >
              {showAllHistory
                ? "Show less"
                : `See all ${history.length} khatmas`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
