"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { SlimAyah } from "./verse-card";

type Props = {
  ayahs: SlimAyah[];
  page: number;
  onPrevPage: () => void;
  onNextPage: () => void;
};

function toArabicNumeral(n: number): string {
  return n.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

export function PageView({ ayahs, page, onPrevPage, onNextPage }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Flowing page text */}
      <div
        className="flex-1 overflow-y-auto px-5 py-4"
        style={{ touchAction: "manipulation" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            dir="rtl"
            className="font-scheherazade text-2xl text-right"
            style={{ lineHeight: 2.4, color: "var(--foreground)" }}
          >
            {ayahs.map((a) => (
              <span key={a.number}>
                {a.text}
                {" "}
                <span
                  className="text-base"
                  style={{ color: "var(--hayati-gold-500)" }}
                >
                  ﴿{toArabicNumeral(a.numberInSurah)}﴾
                </span>
                {" "}
              </span>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Page navigation bar */}
      <div
        className="flex items-center justify-between px-5 py-3 border-t shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onPrevPage}
          disabled={page <= 1}
          className="w-10 h-10 rounded-xl flex items-center justify-center font-mono text-xl"
          style={{
            background: "var(--surface-elevated)",
            color: "var(--foreground-muted)",
            border: "1px solid var(--border)",
            opacity: page <= 1 ? 0.3 : 1,
          }}
        >
          ‹
        </motion.button>

        <p
          className="font-mono text-sm tabular-nums"
          style={{ color: "var(--foreground-muted)" }}
        >
          {page} / 604
        </p>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onNextPage}
          disabled={page >= 604}
          className="w-10 h-10 rounded-xl flex items-center justify-center font-mono text-xl"
          style={{
            background: "var(--surface-elevated)",
            color: "var(--foreground-muted)",
            border: "1px solid var(--border)",
            opacity: page >= 604 ? 0.3 : 1,
          }}
        >
          ›
        </motion.button>
      </div>
    </div>
  );
}
