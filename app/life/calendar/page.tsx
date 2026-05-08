"use client";
import { motion } from "framer-motion";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">Calendar</h1>
        <p className="text-sm text-[var(--foreground-muted)]">Coming in Sprint 11 — Google Calendar sync</p>
      </motion.div>
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center">
        <p className="text-4xl mb-3">📅</p>
        <p className="text-[var(--foreground-muted)]">Calendar sync will be available soon</p>
      </div>
    </div>
  );
}
