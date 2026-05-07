"use client";
import { LineChart, Line, ResponsiveContainer } from "recharts";

export function Sparkline({ data, positive }: { data: { price: number }[]; positive: boolean }) {
  if (data.length < 5) return null;
  return (
    <ResponsiveContainer width="100%" height={32}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="price"
          dot={false}
          strokeWidth={1.5}
          stroke={positive ? "var(--accent-green)" : "var(--accent-red)"}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
