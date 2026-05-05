import type { HalalStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const CONFIG = {
  halal: { label: "HALAL", icon: "✓", className: "bg-green-500/10 text-green-400 border border-green-500/20" },
  questionable: { label: "QUESTIONABLE", icon: "⚠", className: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" },
  haram: { label: "HARAM", icon: "✗", className: "bg-red-500/10 text-red-400 border border-red-500/20" },
  unknown: { label: "UNSCREENED", icon: "?", className: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20" },
};

export function HalalBadge({ status, compact = false }: { status: HalalStatus; compact?: boolean }) {
  const cfg = CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold font-mono", cfg.className)}>
      <span>{cfg.icon}</span>
      {!compact && <span>{cfg.label}</span>}
    </span>
  );
}
