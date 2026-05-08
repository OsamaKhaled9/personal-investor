"use client";
import { motion } from "framer-motion";

type PrayerCardProps = {
  name: string;
  arabicName: string;
  time: string;
  prayed: boolean;
  isNext: boolean;
  onToggle: () => void;
};

export function PrayerCard({ name, arabicName, time, prayed, isNext, onToggle }: PrayerCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-4 rounded-xl border bg-[var(--surface)] p-4 min-h-[64px] transition-colors ${
        isNext ? "ring-1 ring-[var(--accent-blue)]" : ""
      }`}
      style={{ borderColor: "var(--border)" }}
    >
      {/* Spring checkbox — scale pulse uses tween (spring doesn't support 3-keyframe arrays) */}
      <motion.div
        animate={{ scale: prayed ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
        className="shrink-0"
        onClick={onToggle}
        role="checkbox"
        aria-checked={prayed}
        aria-label={`Mark ${name} as ${prayed ? "unprayed" : "prayed"}`}
        style={{ cursor: "pointer" }}
      >
        <motion.div
          animate={
            prayed
              ? { backgroundColor: "var(--accent-green)", borderColor: "var(--accent-green)" }
              : { backgroundColor: "transparent", borderColor: "var(--border)" }
          }
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className="w-6 h-6 rounded-full border-2 flex items-center justify-center min-w-6"
        >
          <motion.svg
            animate={{ opacity: prayed ? 1 : 0, scale: prayed ? 1 : 0.4 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <path d="M1 6l3 3 7-6" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </motion.div>
      </motion.div>

      {/* Prayer info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm" style={{ color: "var(--foreground)" }}>
            {name}
          </span>
          {isNext && (
            <span
              className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ color: "var(--accent-blue)", background: "color-mix(in srgb, var(--accent-blue) 12%, transparent)" }}
            >
              Next
            </span>
          )}
        </div>
        <p className="arabic-text text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
          {arabicName}
        </p>
      </div>

      {/* Time */}
      <span className="font-mono text-sm tabular-nums flex-shrink-0" style={{ color: prayed ? "var(--accent-green)" : "var(--foreground-muted)" }}>
        {time}
      </span>
    </motion.div>
  );
}
