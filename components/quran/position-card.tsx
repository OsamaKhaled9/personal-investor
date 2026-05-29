"use client";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSurahForPage, getJuzForPage } from "@/lib/quran-meta";
import { SessionForm } from "./session-form";
import type { ReadingSession } from "@/lib/types";

type Props = {
  currentPosition: number;
  onSessionLogged: (session: ReadingSession) => void;
  onOpenReader: (page: number) => void;
};

export function PositionCard({
  currentPosition,
  onSessionLogged,
  onOpenReader,
}: Props) {
  const [showForm, setShowForm] = useState(false);

  const { surah, juz } = useMemo(
    () => ({
      surah: getSurahForPage(currentPosition),
      juz: getJuzForPage(currentPosition),
    }),
    [currentPosition]
  );

  const defaultFromPage = useMemo(
    () => Math.min(604, currentPosition + 1),
    [currentPosition]
  );

  const handleLogged = useCallback(
    (session: ReadingSession) => {
      onSessionLogged(session);
      setShowForm(false);
    },
    [onSessionLogged]
  );

  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        borderColor: "rgba(201,145,61,0.18)",
        background: "var(--surface)",
      }}
    >
      {/* Position info row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p
            className="font-mono text-[9px] uppercase tracking-[0.18em] mb-1"
            style={{ color: "var(--foreground-muted)" }}
          >
            Current Position
          </p>
          <p
            className="arabic-text text-xl font-bold leading-snug"
            style={{ color: "var(--hayati-gold-400)" }}
          >
            {surah.name}
          </p>
          <p
            className="font-mono text-[10px] mt-0.5"
            style={{ color: "var(--foreground-muted)" }}
          >
            {surah.nameEn} · Juz {juz} · Page {currentPosition}
          </p>
        </div>

        {/* Read button */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => onOpenReader(currentPosition)}
          className="shrink-0 px-3 py-1.5 rounded-xl font-mono text-xs font-semibold"
          style={{
            background: "rgba(201,145,61,0.10)",
            color: "var(--hayati-gold-400)",
            border: "1px solid rgba(201,145,61,0.20)",
          }}
        >
          Read
        </motion.button>
      </div>

      {/* Toggle form button */}
      <button
        onClick={() => setShowForm((v) => !v)}
        className="flex items-center gap-1 font-mono text-[10px]"
        style={{ color: "var(--foreground-muted)" }}
      >
        Update Position
        <motion.span
          animate={{ rotate: showForm ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          style={{ display: "inline-block", lineHeight: 1 }}
        >
          ↓
        </motion.span>
      </button>

      {/* Inline session form — height collapse */}
      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="overflow-hidden"
          >
            <SessionForm
              defaultFromPage={defaultFromPage}
              onLogged={handleLogged}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
