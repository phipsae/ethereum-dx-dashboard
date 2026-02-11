import { loadRunDataFromFile } from "@/lib/server-data";
import {
  computeOverallEcosystems,
  computePerModelEcosystems,
  computeOverallNetworks,
  computePerModelNetworks,
  computeDefaultEcosystems,
  computeCategoryBreakdown,
  computeToolFrequency,
} from "@/lib/data";
import ChainPieChart from "@/components/charts/ChainPieChart";
import NetworkDistribution from "@/components/charts/NetworkDistribution";
import CategoryBreakdown from "@/components/charts/CategoryBreakdown";
import ToolFrequencyBar from "@/components/charts/ToolFrequencyBar";
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

  const overallEcosystems = computeOverallEcosystems(data);
  const perModelEcosystems = computePerModelEcosystems(data);
  const overallNetworks = computeOverallNetworks(data);
  const perModelNetworks = computePerModelNetworks(data);
  const defaultEcosystems = computeDefaultEcosystems(data);
  const categoryBreakdown = computeCategoryBreakdown(data);
  const toolFrequency = computeToolFrequency(data);
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
        <ChainPieChart data={overallEcosystems} />
      </section>

      {/* Per-model Chain Distribution */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          Chain Distribution (Per Model)
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {perModelEcosystems.map((entry) => (
            <ChainPieChart
              key={entry.model}
              data={entry.ecosystems}
              title={entry.model}
              height={250}
            />
          ))}
        </div>
      </section>

      {/* Ethereum Ecosystem Breakdown */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          Ethereum Ecosystem Breakdown
        </h2>
        <NetworkDistribution overall={overallNetworks} perModel={perModelNetworks} />
      </section>

      {/* Tool / Framework Frequency */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          Tool / Framework Frequency
        </h2>
        <ToolFrequencyBar data={toolFrequency} />
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
          Default Ecosystem Summary
        </h2>
        <DefaultChainSummary data={defaultEcosystems} />
      </section>

      {/* Category Breakdown */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          Ecosystem Choice by Category
        </h2>
        <CategoryBreakdown data={categoryBreakdown} modelNames={modelNames} />
      </section>
    </div>
  );
}
