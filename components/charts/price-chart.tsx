"use client";
import { useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

const PERIODS = ["1d", "1w", "1m", "3m", "1y"] as const;
type Period = typeof PERIODS[number];

export function PriceChart({
  data,
  ticker,
  positive,
  onPeriodChange,
}: {
  data: { date: string; close: number }[];
  ticker: string;
  positive: boolean;
  onPeriodChange?: (p: Period) => void;
}) {
  const [period, setPeriod] = useState<Period>("1m");
  const color = positive ? "#3fb950" : "#f85149";

  const handlePeriod = (p: Period) => {
    setPeriod(p);
    onPeriodChange?.(p);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => handlePeriod(p)}
            className="relative px-2 py-0.5 text-xs rounded font-mono transition-colors"
            style={{ color: period === p ? "var(--foreground)" : "var(--foreground-muted)" }}
          >
            {period === p && (
              <motion.span
                layoutId={`period-${ticker}`}
                className="absolute inset-0 rounded"
                style={{ background: "var(--surface-elevated)" }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
              />
            )}
            <span className="relative">{p}</span>
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#21262d" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#8b949e", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v.slice(5)}
          />
          <YAxis
            tick={{ fill: "#8b949e", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            domain={["auto", "auto"]}
            tickFormatter={(v) => v.toFixed(0)}
          />
          <Tooltip
            contentStyle={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 8, fontSize: 12 }}
            itemStyle={{ color }}
            labelStyle={{ color: "#8b949e" }}
          />
          <Area type="monotone" dataKey="close" stroke={color} strokeWidth={2} fill={`url(#grad-${ticker})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
