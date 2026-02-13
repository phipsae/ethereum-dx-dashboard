"use client";

import { useState } from "react";
import { getChainColor, getDisplayName } from "@/lib/types";

interface ComparisonStackedBarProps {
  data: Array<{ label: string; base: Record<string, number>; web: Record<string, number> }>;
}

export default function ComparisonStackedBar({ data }: ComparisonStackedBarProps) {
  if (data.length === 0) return null;

  // Collect all ecosystem names for legend
  const allEcosystems = new Set<string>();
  for (const row of data) {
    for (const key of [...Object.keys(row.base), ...Object.keys(row.web)]) {
      allEcosystems.add(key);
    }
  }

  const [hovered, setHovered] = useState<{
    label: string;
    mode: string;
    ecosystem: string;
    count: number;
    total: number;
    x: number;
    y: number;
  } | null>(null);

  return (
    <div className="relative rounded-lg border border-[#0f3460] bg-[#16213e] p-4">
      <div className="space-y-4">
        {data.map((row) => {
          const baseSorted = Object.entries(row.base).sort((a, b) => b[1] - a[1]);
          const webSorted = Object.entries(row.web).sort((a, b) => b[1] - a[1]);
          const baseTotal = baseSorted.reduce((s, [, v]) => s + v, 0);
          const webTotal = webSorted.reduce((s, [, v]) => s + v, 0);
          if (baseTotal === 0 && webTotal === 0) return null;

          return (
            <div key={row.label}>
              <div className="mb-1 text-sm font-medium text-white">{row.label}</div>
              <div className="space-y-1">
                {/* Base row */}
                <div className="flex items-center gap-3">
                  <div className="w-20 shrink-0 text-right text-xs text-[#a0a0b0]">Base</div>
                  <div className="flex h-7 w-full overflow-hidden rounded">
                    {baseTotal > 0 ? baseSorted.map(([eco, count]) => {
                      const pct = (count / baseTotal) * 100;
                      return (
                        <div
                          key={eco}
                          className="relative flex items-center justify-center overflow-hidden transition-opacity hover:opacity-80"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: getChainColor(eco),
                            minWidth: count > 0 ? 3 : 0,
                          }}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHovered({
                              label: row.label,
                              mode: "Base Model",
                              ecosystem: eco,
                              count,
                              total: baseTotal,
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                            });
                          }}
                          onMouseLeave={() => setHovered(null)}
                        >
                          {pct > 18 && (
                            <span className="text-[10px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                              {getDisplayName(eco)}
                            </span>
                          )}
                        </div>
                      );
                    }) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[#a0a0b0]">
                        No data
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-[#a0a0b0]">{baseTotal}</span>
                </div>
                {/* Web row */}
                <div className="flex items-center gap-3">
                  <div className="w-20 shrink-0 text-right text-xs text-[#a0a0b0]">Web</div>
                  <div className="flex h-7 w-full overflow-hidden rounded">
                    {webTotal > 0 ? webSorted.map(([eco, count]) => {
                      const pct = (count / webTotal) * 100;
                      return (
                        <div
                          key={eco}
                          className="relative flex items-center justify-center overflow-hidden transition-opacity hover:opacity-80"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: getChainColor(eco),
                            minWidth: count > 0 ? 3 : 0,
                          }}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHovered({
                              label: row.label,
                              mode: "Web Search",
                              ecosystem: eco,
                              count,
                              total: webTotal,
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                            });
                          }}
                          onMouseLeave={() => setHovered(null)}
                        >
                          {pct > 18 && (
                            <span className="text-[10px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                              {getDisplayName(eco)}
                            </span>
                          )}
                        </div>
                      );
                    }) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[#a0a0b0]">
                        No data
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-[#a0a0b0]">{webTotal}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-3 border-t border-[#0f3460] pt-3">
        {[...allEcosystems].map((eco) => (
          <div key={eco} className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: getChainColor(eco) }}
            />
            <span className="text-xs text-[#a0a0b0]">{getDisplayName(eco)}</span>
          </div>
        ))}
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
          <div className="text-xs text-[#a0a0b0]">
            {hovered.label} - {hovered.mode}
          </div>
          <div className="mt-0.5 font-semibold" style={{ color: getChainColor(hovered.ecosystem) }}>
            {getDisplayName(hovered.ecosystem)}
          </div>
          <div className="text-xs text-[#a0a0b0]">
            {hovered.count} of {hovered.total} ({((hovered.count / hovered.total) * 100).toFixed(0)}%)
          </div>
        </div>
      )}
    </div>
  );
}
