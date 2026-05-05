import { cn } from "@/lib/utils";

export function PriceChange({ value, percent, className }: { value?: number; percent: number; className?: string }) {
  const positive = percent >= 0;
  return (
    <span className={cn("font-mono text-sm font-medium", positive ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]", className)}>
      {positive ? "+" : ""}{percent.toFixed(2)}%
      {value !== undefined && (
        <span className="ml-1 opacity-70">
          ({positive ? "+" : ""}{value.toFixed(2)})
        </span>
      )}
    </span>
  );
}
