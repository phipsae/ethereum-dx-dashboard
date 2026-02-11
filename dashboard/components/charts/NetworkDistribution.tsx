"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
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

  return (
    <div className="space-y-6">
      {/* Overall pie */}
      <div className="rounded-lg border border-[#0f3460] bg-[#16213e] p-4">
        <h3 className="mb-2 text-center text-sm text-[#a0a0b0]">
          Overall
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
              formatter={(value: number, name: string) => {
                const pct = `${value} (${((value / total) * 100).toFixed(1)}%)`;
                if (name === "Unspecified") {
                  return [
                    <span key="unspecified">
                      {pct}
                      <br />
                      <span style={{ fontSize: 11, color: "#a0a0b0" }}>
                        Said Ethereum but didn&apos;t name a specific L2/network
                      </span>
                    </span>,
                    name,
                  ];
                }
                return [pct, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "#a0a0b0" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Per-model pies */}
      {perModel.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {perModel.map((entry) => {
            const modelData = Object.entries(entry.networks)
              .filter(([, v]) => v > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([name, value]) => ({ name, value }));

            if (modelData.length === 0) return null;

            const modelTotal = modelData.reduce((sum, d) => sum + d.value, 0);

            return (
              <div
                key={entry.model}
                className="rounded-lg border border-[#0f3460] bg-[#16213e] p-4"
              >
                <h3 className="mb-2 text-center text-sm text-[#a0a0b0]">
                  {entry.model}
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={modelData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      stroke="#1a1a2e"
                      strokeWidth={2}
                    >
                      {modelData.map((d) => (
                        <Cell key={d.name} fill={getNetworkColor(d.name)} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#16213e", border: "1px solid #0f3460", borderRadius: 8 }}
                      itemStyle={{ color: "#e0e0e0" }}
                      formatter={(value: number, name: string) => {
                        const pct = `${value} (${((value / modelTotal) * 100).toFixed(1)}%)`;
                        if (name === "Unspecified") {
                          return [
                            <span key="unspecified">
                              {pct}
                              <br />
                              <span style={{ fontSize: 11, color: "#a0a0b0" }}>
                                Said Ethereum but didn&apos;t name a specific L2/network
                              </span>
                            </span>,
                            name,
                          ];
                        }
                        return [pct, name];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#a0a0b0" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
