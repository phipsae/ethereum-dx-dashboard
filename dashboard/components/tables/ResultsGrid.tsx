"use client";

import { useState } from "react";
import type { DashboardRunData } from "@/lib/types";
import { getChainColor, getNetworkColor } from "@/lib/types";

// Labels that are generic EVM/Solidity tooling, not chain-specific
const EVM_GENERIC_LABELS = new Set([
  "pragma solidity", ".sol file reference", "Hardhat", "Foundry/Forge",
  "Truffle", "Remix", "ethers.js", "web3.js", "ERC standard", "OpenZeppelin",
  "ABI encoding", "msg.sender", "Solidity require()", "Solidity mapping",
  "Solidity modifier", "Solidity emit", "payable keyword", "Scaffold-ETH",
  "wagmi", "viem", "Infura/Alchemy", "MetaMask", "Solidity mention",
  "Ethereum mention",
]);

function countChainSpecificSignals(evidence: string[]): number {
  return evidence.filter((e) => {
    const label = e.replace(/\s*\(×\d+.*$/, "");
    return !EVM_GENERIC_LABELS.has(label);
  }).length;
}

interface ResultsGridProps {
  data: DashboardRunData;
}

export default function ResultsGrid({ data }: ResultsGridProps) {
  const { promptIds, models, cells } = data.grid;
  // Build lookup from results for evidence
  const evidenceLookup = new Map<string, string[]>();
  for (const r of data.results) {
    if (r.evidence) {
      evidenceLookup.set(`${r.promptId}::${r.model}`, r.evidence);
    }
  }

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    ecosystem: string;
    network: string | null;
    chainSignals: number;
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
                const evidence = evidenceLookup.get(`${pid}::${m.id}`) ?? [];
                const signals = countChainSpecificSignals(evidence);
                // Map chain-specific signals to opacity (0 signals → 0.3, 5+ → 1.0)
                const opacity = eco === "Unknown" ? 0.15 : 0.3 + Math.min(signals / 5, 1) * 0.7;

                return (
                  <td key={m.id} className="px-1 py-1 text-center">
                    <div
                      className="flex cursor-default items-center justify-center gap-1 rounded-md px-2 py-2 transition-all hover:ring-1 hover:ring-white/30"
                      style={{ backgroundColor: ecoColor, opacity }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const evidence = evidenceLookup.get(`${pid}::${m.id}`) ?? [];
                        setTooltip({
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                          ecosystem: eco,
                          network: netLabel,
                          chainSignals: countChainSpecificSignals(evidence),
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
            {tooltip.chainSignals > 0
              ? `${tooltip.chainSignals} chain-specific signal${tooltip.chainSignals !== 1 ? "s" : ""}`
              : "No chain-specific signals (generic EVM only)"}
          </div>
        </div>
      )}
    </div>
  );
}
