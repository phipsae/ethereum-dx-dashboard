"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";

interface ComparisonBarProps {
  data: Array<{ label: string; baseValue: number; webValue: number; deltaPp?: number }>;
  title?: string;
  valueLabel?: string;
}

const BASE_COLOR = "#627eea";
const WEB_COLOR = "#4bc0c0";

function DeltaLabel(props: Record<string, unknown>) {
  const { x, y, width, height, index, data } = props as {
    x: number;
    y: number;
    width: number;
    height: number;
    index: number;
    data: Array<{ delta: number }>;
  };
  const entry = data[index];
  if (!entry || Math.abs(entry.delta) < 0.5) return null;

  const sign = entry.delta > 0 ? "+" : "";
  const color = entry.delta > 0 ? "#4bc0c0" : "#e94560";

  return (
    <text
      x={x + width + 6}
      y={y + height / 2 + 1}
      fill={color}
      fontSize={11}
      fontFamily="monospace"
      fontWeight={600}
      dominantBaseline="middle"
    >
      {sign}{Math.round(entry.delta * 10) / 10}pp
    </text>
  );
}

export default function ComparisonBar({ data, title, valueLabel = "%" }: ComparisonBarProps) {
  if (data.length === 0) return null;

  const chartData = data.map((d) => ({
    name: d.label,
    Base: Math.round(d.baseValue * 10) / 10,
    Web: Math.round(d.webValue * 10) / 10,
    delta: d.deltaPp != null ? d.deltaPp : d.webValue - d.baseValue,
  }));

  return (
    <div className="rounded-lg border border-[#0f3460] bg-[#16213e] p-4">
      {title && (
        <h3 className="mb-2 text-center text-sm text-[#a0a0b0]">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 48)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 70 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#0f3460" />
          <XAxis
            type="number"
            tick={{ fill: "#a0a0b0" }}
            tickFormatter={(v: number) => `${v}${valueLabel}`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "#a0a0b0", fontSize: 12 }}
            width={140}
          />
          <Tooltip
            contentStyle={{ background: "#16213e", border: "1px solid #0f3460", borderRadius: 8 }}
            itemStyle={{ color: "#e0e0e0" }}
            formatter={(value: number, name: string) => [`${value}${valueLabel}`, name === "Base" ? "Base Model" : "Web Search"]}
          />
          <Legend
            formatter={(value: string) => (
              <span style={{ color: "#a0a0b0", fontSize: 12 }}>
                {value === "Base" ? "Base Model" : "Web Search"}
              </span>
            )}
          />
          <Bar dataKey="Base" fill={BASE_COLOR} radius={[0, 4, 4, 0]} barSize={14} />
          <Bar dataKey="Web" fill={WEB_COLOR} radius={[0, 4, 4, 0]} barSize={14}>
            <LabelList
              content={<DeltaLabel data={chartData} />}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
