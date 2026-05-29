"use client";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSurahForPage, getJuzForPage } from "@/lib/quran-meta";
import type { ReadingSession } from "@/lib/types";

type Props = {
  defaultFromPage: number;
  onLogged: (session: ReadingSession) => void;
};

export function SessionForm({ defaultFromPage, onLogged }: Props) {
  const [fromPage, setFromPage] = useState(String(defaultFromPage));
  const [toPage, setToPage] = useState(String(defaultFromPage));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedPages, setSavedPages] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const toPagePreview = useMemo(() => {
    const p = Number(toPage);
    if (!Number.isInteger(p) || p < 1 || p > 604) return null;
    return { surah: getSurahForPage(p), juz: getJuzForPage(p) };
  }, [toPage]);

  const handleSubmit = useCallback(async () => {
    const fp = Number(fromPage);
    const tp = Number(toPage);
    if (!fp || !tp || fp > tp || fp < 1 || tp > 604) {
      setError("Check page range — from must be ≤ to, both 1–604");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/quran/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_page: fp,
          to_page: tp,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json() as { data: ReadingSession };
      onLogged(json.data);
      setSavedPages(tp - fp + 1);
      setSaved(true);
      setNotes("");
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save. Try again.");
    } finally {
      setSubmitting(false);
    }
  }, [fromPage, toPage, notes, onLogged]);

  return (
    <div
      className="space-y-3 pt-3 mt-2 border-t"
      style={{ borderColor: "var(--border)" }}
    >
      {/* From / To row */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label
            className="font-mono text-[9px] uppercase tracking-widest block mb-1"
            style={{ color: "var(--foreground-muted)" }}
          >
            From page
          </label>
          <input
            type="number"
            min={1}
            max={604}
            value={fromPage}
            onChange={(e) => setFromPage(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 font-mono text-sm text-center tabular-nums outline-none focus:ring-1"
            style={{
              background: "var(--surface-elevated)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />
        </div>
        <span
          className="font-mono text-base pb-2 shrink-0"
          style={{ color: "var(--foreground-muted)" }}
        >
          →
        </span>
        <div className="flex-1">
          <label
            className="font-mono text-[9px] uppercase tracking-widest block mb-1"
            style={{ color: "var(--foreground-muted)" }}
          >
            To page
          </label>
          <input
            type="number"
            min={1}
            max={604}
            value={toPage}
            onChange={(e) => setToPage(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 font-mono text-sm text-center tabular-nums outline-none focus:ring-1"
            style={{
              background: "var(--surface-elevated)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />
        </div>
      </div>

      {/* Live to-page surah preview */}
      <AnimatePresence mode="wait">
        {toPagePreview && (
          <motion.p
            key={toPage}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="font-mono text-[10px]"
            style={{ color: "var(--hayati-gold-400)" }}
          >
            <span className="arabic-text text-sm">{toPagePreview.surah.name}</span>
            {" · "}Juz {toPagePreview.juz}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Notes */}
      <div>
        <label
          className="font-mono text-[9px] uppercase tracking-widest block mb-1"
          style={{ color: "var(--foreground-muted)" }}
        >
          Notes (optional)
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What did you reflect on?"
          className="w-full rounded-lg border px-3 py-2 font-mono text-xs outline-none focus:ring-1"
          style={{
            background: "var(--surface-elevated)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="font-mono text-[10px]" style={{ color: "var(--accent-red)" }}>
          {error}
        </p>
      )}

      {/* Submit row */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <AnimatePresence>
          {saved && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="font-mono text-sm font-semibold"
              style={{ color: "var(--accent-green)" }}
            >
              ✓ Logged — {savedPages} pages
            </motion.p>
          )}
        </AnimatePresence>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={submitting}
          className="ml-auto px-4 py-2 rounded-xl font-mono text-sm font-semibold shrink-0"
          style={{
            background: "rgba(201,145,61,0.12)",
            color: "var(--hayati-gold-400)",
            border: "1px solid rgba(201,145,61,0.22)",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "..." : "Log Session"}
        </motion.button>
      </div>
    </div>
  );
}
