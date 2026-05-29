"use client";
import { memo } from "react";
import { motion } from "framer-motion";

type Props = {
  totalPages: number;
  totalKhatmas: number;
  avgPerDay: number;
  bestDay: { date: string; pages: number } | null;
};

function formatBestDay(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const StatPill = memo(function StatPill({
  value,
  label,
  sublabel,
  delay,
}: {
  value: number | string;
  label: string;
  sublabel?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 28 }}
      className="rounded-xl border p-3"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <p
        className="font-mono font-bold text-lg tabular-nums leading-none"
        style={{ color: "var(--foreground)" }}
      >
        {value}
      </p>
      <p
        className="font-mono text-[9px] uppercase tracking-widest mt-1"
        style={{ color: "var(--foreground-muted)" }}
      >
        {label}
      </p>
      {sublabel && (
        <p
          className="font-mono text-[9px] mt-0.5"
          style={{ color: "var(--hayati-gold-400)" }}
        >
          {sublabel}
        </p>
      )}
    </motion.div>
  );
});

export function StatsRow({ totalPages, totalKhatmas, avgPerDay, bestDay }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatPill value={totalPages} label="pages read" delay={0} />
      <StatPill value={totalKhatmas} label="khatmas" delay={0.08} />
      <StatPill value={avgPerDay} label="pages/day" delay={0.16} />
      <StatPill
        value={bestDay?.pages ?? 0}
        label="best day"
        sublabel={bestDay ? formatBestDay(bestDay.date) : undefined}
        delay={0.24}
      />
    </div>
  );
}
