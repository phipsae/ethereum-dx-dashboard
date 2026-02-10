"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getChainColor } from "@/lib/types";

interface ChainPieChartProps {
  data: Record<string, number>;
  title?: string;
  height?: number;
}

export default function ChainPieChart({ data, title, height = 300 }: ChainPieChartProps) {
  const entries = Object.entries(data)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  const chartData = entries.map(([name, value]) => ({ name, value }));

  return (
    <div className="rounded-lg border border-[#0f3460] bg-[#16213e] p-4">
      {title && (
        <h3 className="mb-2 text-center text-sm text-[#a0a0b0]">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={height / 3}
            stroke="#1a1a2e"
            strokeWidth={2}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={getChainColor(entry.name)} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#16213e", border: "1px solid #0f3460", borderRadius: 8 }}
            itemStyle={{ color: "#e0e0e0" }}
            formatter={(value: number, name: string) => [
              `${value} (${((value / total) * 100).toFixed(1)}%)`,
              name,
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#a0a0b0" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
