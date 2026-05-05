"use client";
import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";

export function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const chartData = data.map((v, i) => ({ i, v }));
  const color = positive ? "#3fb950" : "#f85149";
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
        <Tooltip
          contentStyle={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 6, fontSize: 11 }}
          itemStyle={{ color: color }}
          labelFormatter={() => ""}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any) => [(Number(v) || 0).toFixed(2), ""]}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
