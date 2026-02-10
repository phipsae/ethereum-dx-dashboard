"use client";

import { getChainColor } from "@/lib/types";

interface CategoryBreakdownProps {
  data: Array<{
    category: string;
    models: Array<{ model: string; chains: Record<string, number> }>;
  }>;
  modelNames: string[];
}

export default function CategoryBreakdown({ data, modelNames }: CategoryBreakdownProps) {
  if (data.length <= 1) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse overflow-hidden rounded-lg bg-[#16213e]">
        <thead>
          <tr className="bg-[#0f3460]">
            <th className="border-b border-[#0f3460] px-3 py-2 text-left text-sm font-semibold text-white">
              Category
            </th>
            {modelNames.map((name) => (
              <th
                key={name}
                className="border-b border-[#0f3460] px-3 py-2 text-left text-sm font-semibold text-white"
              >
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.category} className="border-b border-[#0f3460] hover:bg-[#1a2a4e]">
              <td className="px-3 py-2 text-sm text-[#e0e0e0]">{row.category}</td>
              {row.models.map((m, i) => {
                const sorted = Object.entries(m.chains).sort((a, b) => b[1] - a[1]);
                return (
                  <td key={i} className="px-3 py-2 text-sm">
                    {sorted.length === 0
                      ? <span className="text-[#555]">&mdash;</span>
                      : sorted.map(([chain, count]) => (
                          <span key={chain} className="mr-2">
                            <span
                              className="font-semibold"
                              style={{ color: getChainColor(chain) }}
                            >
                              {chain}
                            </span>
                            <span className="text-[#a0a0b0]"> ({count})</span>
                          </span>
                        ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
