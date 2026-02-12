"use client";

import { useState } from "react";
import { getToolColor } from "@/lib/types";

interface ToolStackedBarProps {
  data: Array<{ label: string; tools: Record<string, number> }>;
}

export default function ToolStackedBar({ data }: ToolStackedBarProps) {
  if (data.length === 0) return null;

  // Collect all tool names across all rows for consistent coloring
  const allTools = new Set<string>();
  for (const row of data) {
    for (const tool of Object.keys(row.tools)) {
      allTools.add(tool);
    }
  }
  const toolList = [...allTools];
  const toolColorMap = new Map<string, string>();
  toolList.forEach((tool, i) => toolColorMap.set(tool, getToolColor(i)));

  const [hovered, setHovered] = useState<{
    label: string;
    tool: string;
    count: number;
    total: number;
    x: number;
    y: number;
  } | null>(null);

  return (
    <div className="relative rounded-lg border border-[#0f3460] bg-[#16213e] p-4">
      <div className="space-y-3">
        {data.map((row) => {
          const sorted = Object.entries(row.tools).sort((a, b) => b[1] - a[1]);
          const total = sorted.reduce((sum, [, v]) => sum + v, 0);
          if (total === 0) return null;

          return (
            <div key={row.label} className="flex items-center gap-3">
              <div className="w-32 shrink-0 text-right text-sm text-[#a0a0b0] truncate" title={row.label}>
                {row.label}
              </div>
              <div className="flex h-8 w-full overflow-hidden rounded">
                {sorted.map(([tool, count]) => {
                  const pct = (count / total) * 100;
                  return (
                    <div
                      key={tool}
                      className="relative flex items-center justify-center overflow-hidden transition-opacity hover:opacity-80"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: toolColorMap.get(tool) ?? "#888",
                        minWidth: count > 0 ? 4 : 0,
                      }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHovered({
                          label: row.label,
                          tool,
                          count,
                          total,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setHovered(null)}
                    >
                      {pct > 12 && (
                        <span className="text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                          {tool}
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
        {toolList.map((tool) => (
          <div key={tool} className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: toolColorMap.get(tool) }}
            />
            <span className="text-xs text-[#a0a0b0]">{tool}</span>
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
          <div className="text-xs text-[#a0a0b0]">{hovered.label}</div>
          <div className="mt-0.5 font-semibold" style={{ color: toolColorMap.get(hovered.tool) }}>
            {hovered.tool}
          </div>
          <div className="text-xs text-[#a0a0b0]">
            {hovered.count} of {hovered.total} ({((hovered.count / hovered.total) * 100).toFixed(0)}%)
          </div>
        </div>
      )}
    </div>
  );
}
