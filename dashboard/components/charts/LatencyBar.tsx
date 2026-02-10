"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface LatencyBarProps {
  data: Array<{ model: string; avg: number }>;
}

export default function LatencyBar({ data }: LatencyBarProps) {
  const chartData = data.map((d) => ({
    model: d.model,
    seconds: +(d.avg / 1000).toFixed(1),
  }));

  return (
    <div className="rounded-lg border border-[#0f3460] bg-[#16213e] p-4">
      <h3 className="mb-2 text-center text-sm text-[#a0a0b0]">
        Average Latency (seconds)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#0f3460" />
          <XAxis
            dataKey="model"
            tick={{ fill: "#a0a0b0", fontSize: 11 }}
            angle={-20}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fill: "#a0a0b0" }} />
          <Tooltip
            contentStyle={{ background: "#16213e", border: "1px solid #0f3460", borderRadius: 8 }}
            itemStyle={{ color: "#e0e0e0" }}
            formatter={(value: number) => [`${value}s`, "Avg Latency"]}
          />
          <Bar dataKey="seconds" fill="#ff6384" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
