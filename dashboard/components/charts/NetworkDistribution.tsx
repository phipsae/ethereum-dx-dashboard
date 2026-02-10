"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { getNetworkColor } from "@/lib/types";

interface NetworkDistributionProps {
  overall: Record<string, number>;
  perModel: Array<{ model: string; networks: Record<string, number> }>;
}

export default function NetworkDistribution({ overall, perModel }: NetworkDistributionProps) {
  const hasData = Object.keys(overall).some(
    (n) => n !== "Unspecified" && overall[n] > 0
  );

  if (!hasData) return null;

  const pieData = Object.entries(overall)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  const total = pieData.reduce((sum, d) => sum + d.value, 0);

  // Stacked bar data
  const allNetworks = [...new Set(perModel.flatMap((e) => Object.keys(e.networks)))];
  const barData = perModel.map((entry) => {
    const row: Record<string, string | number> = { model: entry.model };
    for (const net of allNetworks) {
      row[net] = entry.networks[net] ?? 0;
    }
    return row;
  });

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#0f3460] bg-[#16213e] p-4">
        <h3 className="mb-2 text-center text-sm text-[#a0a0b0]">
          Overall EVM Network Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              stroke="#1a1a2e"
              strokeWidth={2}
            >
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={getNetworkColor(entry.name)} />
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
            <Legend wrapperStyle={{ fontSize: 12, color: "#a0a0b0" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {perModel.length > 0 && (
        <div className="rounded-lg border border-[#0f3460] bg-[#16213e] p-4">
          <h3 className="mb-2 text-center text-sm text-[#a0a0b0]">
            EVM Network Distribution Per Model
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={barData}>
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
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "#a0a0b0" }} />
              {allNetworks.map((net) => (
                <Bar
                  key={net}
                  dataKey={net}
                  stackId="a"
                  fill={getNetworkColor(net)}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
