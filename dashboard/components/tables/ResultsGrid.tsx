"use client";

import { useState } from "react";
import type { DashboardRunData } from "@/lib/types";
import { getChainColor, getNetworkColor } from "@/lib/types";

interface ResultsGridProps {
  data: DashboardRunData;
}

export default function ResultsGrid({ data }: ResultsGridProps) {
  const { promptIds, models, cells } = data.grid;
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    ecosystem: string;
    network: string | null;
    confidence: number;
    latencyMs: number;
    prompt: string;
    model: string;
  } | null>(null);

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse overflow-hidden rounded-lg bg-[#16213e]">
        <thead>
          <tr className="bg-[#0f3460]">
            <th className="border-b border-[#0f3460] px-3 py-2 text-left text-sm font-semibold text-white">
              Prompt
            </th>
            {models.map((m) => (
              <th
                key={m.id}
                className="border-b border-[#0f3460] px-3 py-2 text-center text-sm font-semibold text-white"
              >
                {m.displayName}
                <span className="ml-1 text-xs text-[#a0a0b0]">({m.tier})</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {promptIds.map((pid) => (
            <tr key={pid} className="border-b border-[#0f3460]">
              <td className="px-3 py-2 font-mono text-sm text-[#e94560]">{pid}</td>
              {models.map((m) => {
                const cell = cells[`${pid}::${m.id}`];
                if (!cell) {
                  return (
                    <td key={m.id} className="px-3 py-2 text-center text-sm text-[#555]">
                      &mdash;
                    </td>
                  );
                }

                const eco = cell.ecosystem ?? cell.chain ?? "Unknown";
                const netLabel =
                  cell.network && cell.network !== "Unspecified" && cell.network !== "Unknown" && cell.network !== "N/A"
                    ? cell.network
                    : null;
                const ecoColor = getChainColor(eco);
                // Map confidence (0-100) to opacity (0.2 - 1.0)
                const opacity = eco === "Unknown" ? 0.15 : 0.2 + (cell.confidence / 100) * 0.8;

                return (
                  <td key={m.id} className="px-1 py-1 text-center">
                    <div
                      className="flex cursor-default items-center justify-center gap-1 rounded-md px-2 py-2 transition-all hover:ring-1 hover:ring-white/30"
                      style={{ backgroundColor: ecoColor, opacity }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                          ecosystem: eco,
                          network: netLabel,
                          confidence: cell.confidence,
                          latencyMs: cell.latencyMs,
                          prompt: pid,
                          model: m.displayName,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <span className="text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {netLabel ?? (eco === "Unknown" ? "?" : eco.replace(" Ecosystem", ""))}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-[#0f3460] bg-[#16213e] px-3 py-2 shadow-xl"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="text-xs text-[#a0a0b0]">
            <span className="font-mono text-[#e94560]">{tooltip.prompt}</span>
            {" × "}
            <span className="text-white">{tooltip.model}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="font-semibold" style={{ color: getChainColor(tooltip.ecosystem) }}>
              {tooltip.ecosystem}
            </span>
            {tooltip.network && (
              <span style={{ color: getNetworkColor(tooltip.network) }}>
                → {tooltip.network}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-[#a0a0b0]">
            Confidence: {tooltip.confidence}% · Latency: {(tooltip.latencyMs / 1000).toFixed(1)}s
          </div>
        </div>
      )}
    </div>
  );
}
