"use client";
import { motion } from "framer-motion";

type PrayerCardProps = {
  name: string;
  arabicName: string;
  time: string;
  prayed: boolean;
  isNext: boolean;
  nextIn?: string;
  onToggle: () => void;
};

export function PrayerCard({ name, arabicName, time, prayed, isNext, nextIn, onToggle }: PrayerCardProps) {
  return (
    <motion.div
      layout
      animate={{ opacity: prayed ? 0.62 : 1 }}
      transition={{ duration: 0.3 }}
      // CSS class drives box-shadow animation; Framer only handles opacity + layout
      className={`flex items-center gap-4 rounded-xl border p-4 min-h-16${isNext && !prayed ? " prayer-card-next" : ""}`}
      style={{
        background: prayed
          ? "linear-gradient(135deg, rgba(74,154,112,0.06) 0%, var(--surface) 55%)"
          : isNext
          ? "linear-gradient(135deg, rgba(201,145,61,0.08) 0%, var(--surface) 60%)"
          : "var(--surface)",
        borderColor: prayed
          ? "rgba(74,154,112,0.28)"
          : isNext
          ? "rgba(201,145,61,0.28)"
          : "var(--border)",
        transition: "background 0.3s ease, border-color 0.3s ease",
      }}
    >
      {/* Spring checkbox */}
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
              : { backgroundColor: "rgba(0,0,0,0)", borderColor: "var(--border)" }
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
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm" style={{ color: "var(--foreground)" }}>
            {name}
          </span>
          {isNext && nextIn && (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{
                color: "var(--hayati-gold-400)",
                background: "rgba(201,145,61,0.10)",
                border: "1px solid rgba(201,145,61,0.20)",
              }}
            >
              {nextIn}
            </span>
          )}
          {isNext && !nextIn && (
            <span
              className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ color: "var(--hayati-gold-400)", background: "rgba(201,145,61,0.10)" }}
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
      <span
        className="font-mono text-sm tabular-nums shrink-0 font-semibold"
        style={{
          color: prayed
            ? "var(--accent-green)"
            : isNext
            ? "var(--hayati-gold-400)"
            : "var(--foreground-muted)",
        }}
      >
        {time}
      </span>
    </motion.div>
  );
}
