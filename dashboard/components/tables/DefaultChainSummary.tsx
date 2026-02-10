import { getChainColor } from "@/lib/types";

interface DefaultChainSummaryProps {
  data: Array<{
    model: string;
    tier: string;
    defaultChain: string;
    timesChosen: string;
  }>;
}

export default function DefaultChainSummary({ data }: DefaultChainSummaryProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse overflow-hidden rounded-lg bg-[#16213e]">
        <thead>
          <tr className="bg-[#0f3460]">
            <th className="border-b border-[#0f3460] px-3 py-2 text-left text-sm font-semibold text-white">
              Model
            </th>
            <th className="border-b border-[#0f3460] px-3 py-2 text-left text-sm font-semibold text-white">
              Tier
            </th>
            <th className="border-b border-[#0f3460] px-3 py-2 text-left text-sm font-semibold text-white">
              Default Chain
            </th>
            <th className="border-b border-[#0f3460] px-3 py-2 text-left text-sm font-semibold text-white">
              Times Chosen
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.model} className="border-b border-[#0f3460] hover:bg-[#1a2a4e]">
              <td className="px-3 py-2 text-sm text-[#e0e0e0]">{row.model}</td>
              <td className="px-3 py-2 text-sm">
                <span className="rounded-full bg-[#0f3460] px-2 py-0.5 text-xs text-[#e0e0e0]">
                  {row.tier}
                </span>
              </td>
              <td className="px-3 py-2 text-sm">
                <span
                  className="font-semibold"
                  style={{ color: getChainColor(row.defaultChain) }}
                >
                  {row.defaultChain}
                </span>
              </td>
              <td className="px-3 py-2 text-sm text-[#a0a0b0]">{row.timesChosen}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
