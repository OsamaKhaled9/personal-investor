"use client";
import { motion } from "framer-motion";
import { getSurahForPage } from "@/lib/quran-meta";

type Props = {
  page: number;
  viewMode: "verse" | "page";
  onViewModeChange: (mode: "verse" | "page") => void;
  onExit: () => void;
};

export function ReaderHeader({ page, viewMode, onViewModeChange, onExit }: Props) {
  const surah = getSurahForPage(page);

  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-b shrink-0"
      style={{ borderColor: "var(--border)" }}
    >
      <button
        onClick={onExit}
        className="font-mono text-sm px-3 py-1.5 rounded-lg shrink-0"
        style={{
          background: "var(--surface-elevated)",
          color: "var(--foreground-muted)",
          border: "1px solid var(--border)",
        }}
      >
        ← Exit
      </button>

      <div className="text-center mx-3 min-w-0 flex-1">
        <p
          className="arabic-text text-base font-bold truncate"
          style={{ color: "var(--hayati-gold-400)" }}
        >
          {surah.name}
        </p>
        <p className="font-mono text-[9px]" style={{ color: "var(--foreground-muted)" }}>
          Page {page}
        </p>
      </div>

      {/* View mode toggle with shared layout pill */}
      <div
        className="flex items-center rounded-xl p-0.5 shrink-0 relative"
        style={{
          background: "var(--surface-elevated)",
          border: "1px solid var(--border)",
        }}
      >
        {(["verse", "page"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className="relative px-3 py-1 font-mono text-[10px] rounded-lg z-10"
            style={{
              color:
                viewMode === mode
                  ? "var(--hayati-gold-400)"
                  : "var(--foreground-muted)",
            }}
          >
            {viewMode === mode && (
              <motion.div
                layoutId="reader-mode-pill"
                className="absolute inset-0 rounded-lg"
                style={{
                  background: "rgba(201,145,61,0.12)",
                  border: "1px solid rgba(201,145,61,0.22)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
              />
            )}
            <span className="relative">
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
