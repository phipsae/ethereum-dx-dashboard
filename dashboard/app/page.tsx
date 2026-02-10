import { loadRunDataFromFile } from "@/lib/server-data";
import {
  computeOverallChains,
  computePerModelChains,
  computeOverallNetworks,
  computePerModelNetworks,
  computeLatencyPerModel,
  computeDefaultChains,
  computeCategoryBreakdown,
} from "@/lib/data";
import ChainPieChart from "@/components/charts/ChainPieChart";
import NetworkDistribution from "@/components/charts/NetworkDistribution";
import LatencyBar from "@/components/charts/LatencyBar";
import CategoryBreakdown from "@/components/charts/CategoryBreakdown";
import ResultsGrid from "@/components/tables/ResultsGrid";
import PromptsTable from "@/components/tables/PromptsTable";
import DefaultChainSummary from "@/components/tables/DefaultChainSummary";

export default function DashboardPage() {
  const data = loadRunDataFromFile();

  if (!data) {
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

  const overallChains = computeOverallChains(data);
  const perModelChains = computePerModelChains(data);
  const overallNetworks = computeOverallNetworks(data);
  const perModelNetworks = computePerModelNetworks(data);
  const latencyData = computeLatencyPerModel(data);
  const defaultChains = computeDefaultChains(data);
  const categoryBreakdown = computeCategoryBreakdown(data);
  const modelNames = data.grid.models.map((m) => m.displayName);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Chain Bias Dashboard</h1>
        <p className="text-sm text-[#a0a0b0]">
          Run: {new Date(data.meta.timestamp).toLocaleString()} &middot;{" "}
          {data.meta.resultCount} results &middot; {data.meta.modelCount} models &middot;{" "}
          {data.meta.promptCount} prompts
        </p>
      </div>

      {/* Overall Chain Distribution */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          Chain Distribution (Overall)
        </h2>
        <ChainPieChart data={overallChains} />
      </section>

      {/* Per-model Chain Distribution */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          Chain Distribution (Per Model)
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {perModelChains.map((entry) => (
            <ChainPieChart
              key={entry.model}
              data={entry.chains}
              title={entry.model}
              height={250}
            />
          ))}
        </div>
      </section>

      {/* EVM Network Distribution */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          EVM Network Distribution
        </h2>
        <NetworkDistribution overall={overallNetworks} perModel={perModelNetworks} />
      </section>

      {/* Latency */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          Average Latency
        </h2>
        <LatencyBar data={latencyData} />
      </section>

      {/* Prompts */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          Prompts Used
        </h2>
        <PromptsTable prompts={data.prompts} />
      </section>

      {/* Results Grid */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          Results Grid
        </h2>
        <ResultsGrid data={data} />
      </section>

      {/* Default Chain Summary */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          Default Chain Summary
        </h2>
        <DefaultChainSummary data={defaultChains} />
      </section>

      {/* Category Breakdown */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          Chain Choice by Category
        </h2>
        <CategoryBreakdown data={categoryBreakdown} modelNames={modelNames} />
      </section>
    </div>
  );
}
