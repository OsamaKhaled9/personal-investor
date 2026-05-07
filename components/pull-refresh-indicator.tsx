"use client";
import { AnimatePresence, motion } from "framer-motion";

export function PullRefreshIndicator({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--foreground-muted)] shadow-lg"
        >
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full"
          />
          Refreshing…
        </motion.div>
      )}
    </AnimatePresence>
  );
}
