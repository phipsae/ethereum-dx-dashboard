"use client";

import { useState } from "react";
import { getNetworkColor, getChainColor } from "@/lib/types";

interface CategoryBreakdownProps {
  data: Array<{ category: string; networks: Record<string, number> }>;
}

function getColor(network: string): string {
  // Try network color first (Arbitrum, Base, etc.), fall back to ecosystem color
  const netColor = getNetworkColor(network);
  if (netColor !== "#888888") return netColor;
  return getChainColor(network);
}

export default function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  if (data.length <= 1) return null;

  const [hovered, setHovered] = useState<{
    category: string;
    network: string;
    count: number;
    total: number;
    x: number;
    y: number;
  } | null>(null);

  return (
    <div className="relative rounded-lg border border-[#0f3460] bg-[#16213e] p-4">
      <div className="space-y-3">
        {data.map((row) => {
          const sorted = Object.entries(row.networks).sort((a, b) => b[1] - a[1]);
          const total = sorted.reduce((sum, [, v]) => sum + v, 0);

          return (
            <div key={row.category} className="flex items-center gap-3">
              <div className="w-28 shrink-0 text-right text-sm text-[#a0a0b0]">
                {row.category}
              </div>
              <div className="flex h-8 w-full overflow-hidden rounded">
                {sorted.map(([network, count]) => {
                  const pct = (count / total) * 100;
                  return (
                    <div
                      key={network}
                      className="relative flex items-center justify-center overflow-hidden transition-opacity hover:opacity-80"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: getColor(network),
                        minWidth: count > 0 ? 4 : 0,
                      }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHovered({
                          category: row.category,
                          network,
                          count,
                          total,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setHovered(null)}
                    >
                      {pct > 15 && (
                        <span className="text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                          {network}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <span className="shrink-0 text-xs text-[#a0a0b0]">{total}</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-3 border-t border-[#0f3460] pt-3">
        {(() => {
          const allNetworks = new Set<string>();
          for (const row of data) {
            for (const net of Object.keys(row.networks)) {
              allNetworks.add(net);
            }
          }
          return [...allNetworks].map((net) => (
            <div key={net} className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: getColor(net) }}
              />
              <span className="text-xs text-[#a0a0b0]">{net}</span>
            </div>
          ));
        })()}
      </div>

      {/* Tooltip */}
      {hovered && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-[#0f3460] bg-[#16213e] px-3 py-2 shadow-xl"
          style={{
            left: hovered.x,
            top: hovered.y - 8,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="text-xs text-[#a0a0b0]">{hovered.category}</div>
          <div className="mt-0.5 font-semibold" style={{ color: getColor(hovered.network) }}>
            {hovered.network}
          </div>
          <div className="text-xs text-[#a0a0b0]">
            {hovered.count} of {hovered.total} ({((hovered.count / hovered.total) * 100).toFixed(0)}%)
          </div>
          {hovered.network === "Unknown" && (
            <div className="mt-1 text-xs text-[#a0a0b0] italic">
              Response didn&apos;t specify a blockchain or was chain-agnostic
            </div>
          )}
          {hovered.network === "Unspecified" && (
            <div className="mt-1 text-xs text-[#a0a0b0] italic">
              Said Ethereum but didn&apos;t name a specific L2/network
            </div>
          )}
        </div>
      )}
    </div>
  );
}
