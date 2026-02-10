import type { DashboardRunData } from "@/lib/types";
import { getChainColor, getNetworkColor } from "@/lib/types";

interface ResultsGridProps {
  data: DashboardRunData;
}

export default function ResultsGrid({ data }: ResultsGridProps) {
  const { promptIds, models, cells } = data.grid;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse overflow-hidden rounded-lg bg-[#16213e]">
        <thead>
          <tr className="bg-[#0f3460]">
            <th className="border-b border-[#0f3460] px-3 py-2 text-left text-sm font-semibold text-white">
              Prompt
            </th>
            {models.map((m) => (
              <th
                key={m.id}
                className="border-b border-[#0f3460] px-3 py-2 text-left text-sm font-semibold text-white"
              >
                {m.displayName}
                <span className="ml-1 text-xs text-[#a0a0b0]">({m.tier})</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {promptIds.map((pid) => (
            <tr key={pid} className="border-b border-[#0f3460] hover:bg-[#1a2a4e]">
              <td className="px-3 py-2 font-mono text-sm text-[#e94560]">{pid}</td>
              {models.map((m) => {
                const cell = cells[`${pid}::${m.id}`];
                if (!cell) {
                  return (
                    <td key={m.id} className="px-3 py-2 text-sm text-[#555]">
                      &mdash;
                    </td>
                  );
                }
                const netLabel =
                  cell.network && cell.network !== "N/A" && cell.network !== "Unspecified"
                    ? cell.network
                    : null;

                return (
                  <td key={m.id} className="px-3 py-2 text-sm">
                    <span className="font-semibold" style={{ color: getChainColor(cell.chain) }}>
                      {cell.chain}
                    </span>
                    {netLabel && (
                      <span className="ml-1" style={{ color: getNetworkColor(netLabel) }}>
                        &rarr; {netLabel}
                      </span>
                    )}
                    <span className="ml-1 text-[#a0a0b0]">({cell.confidence}%)</span>
                    <br />
                    <span className="text-xs text-[#a0a0b0]">
                      {(cell.latencyMs / 1000).toFixed(1)}s
                    </span>
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
