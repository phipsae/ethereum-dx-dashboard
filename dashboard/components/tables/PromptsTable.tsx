import type { DashboardPrompt } from "@/lib/types";

interface PromptsTableProps {
  prompts: DashboardPrompt[];
}

export default function PromptsTable({ prompts }: PromptsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse overflow-hidden rounded-lg bg-[#16213e]">
        <thead>
          <tr className="bg-[#0f3460]">
            <th className="border-b border-[#0f3460] px-3 py-2 text-left text-sm font-semibold text-white">
              #
            </th>
            <th className="border-b border-[#0f3460] px-3 py-2 text-left text-sm font-semibold text-white">
              ID
            </th>
            <th className="border-b border-[#0f3460] px-3 py-2 text-left text-sm font-semibold text-white">
              Category
            </th>
            <th className="border-b border-[#0f3460] px-3 py-2 text-left text-sm font-semibold text-white">
              Prompt
            </th>
          </tr>
        </thead>
        <tbody>
          {prompts.map((p, i) => (
            <tr key={p.id} className="border-b border-[#0f3460] hover:bg-[#1a2a4e]">
              <td className="px-3 py-2 text-sm text-[#a0a0b0]">{i + 1}</td>
              <td className="px-3 py-2 font-mono text-sm text-[#e94560]">{p.id}</td>
              <td className="px-3 py-2 text-sm">
                <span className="rounded-full bg-[#0f3460] px-2 py-0.5 text-xs text-[#e0e0e0]">
                  {p.category}
                </span>
              </td>
              <td className="px-3 py-2 text-sm text-[#e0e0e0]">{p.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
