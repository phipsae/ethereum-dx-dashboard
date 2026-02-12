"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { getToolColor } from "@/lib/types";

interface ToolFrequencyBarProps {
  data: Array<{ tool: string; count: number }>;
}

export default function ToolFrequencyBar({ data }: ToolFrequencyBarProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-[#0f3460] bg-[#16213e] p-4">
        <p className="text-center text-sm text-[#a0a0b0]">
          No tool/framework data available (evidence field missing from results)
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#0f3460] bg-[#16213e] p-4">
      <h3 className="mb-2 text-center text-sm text-[#a0a0b0]">
        Number of responses recommending each tool
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 32)}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#0f3460" />
          <XAxis type="number" tick={{ fill: "#a0a0b0" }} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="tool"
            tick={{ fill: "#a0a0b0", fontSize: 12 }}
            width={130}
          />
          <Tooltip
            contentStyle={{ background: "#16213e", border: "1px solid #0f3460", borderRadius: 8 }}
            itemStyle={{ color: "#e0e0e0" }}
            formatter={(value: number) => [`${value} responses`, "Count"]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={getToolColor(i)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
