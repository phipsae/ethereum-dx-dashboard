import { loadComparisonData } from "@/lib/server-data";
import DashboardContent from "@/components/DashboardContent";

export default function DashboardPage() {
  const { standard, webSearch } = loadComparisonData();

  if (!standard && !webSearch) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-white">No Data Available</h1>
          <p className="text-[#a0a0b0]">
            Run a benchmark first to generate dashboard data:
          </p>
          <code className="mt-2 block rounded bg-[#16213e] px-4 py-2 font-mono text-sm text-[#e94560]">
            npx tsx src/index.ts run
          </code>
        </div>
      </div>
    );
  }

  return <DashboardContent standard={standard} webSearch={webSearch} />;
}
