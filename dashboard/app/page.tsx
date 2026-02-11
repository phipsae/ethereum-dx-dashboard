import { loadRunDataFromFile } from "@/lib/server-data";
import {
  computeOverallEcosystems,
  computePerModelEcosystems,
  computeOverallNetworks,
  computePerModelNetworks,

  computeCategoryBreakdown,
  computePerPromptNetworks,
  computeToolFrequency,
} from "@/lib/data";
import ChainPieChart from "@/components/charts/ChainPieChart";
import NetworkDistribution from "@/components/charts/NetworkDistribution";
import CategoryBreakdown from "@/components/charts/CategoryBreakdown";
import ToolFrequencyBar from "@/components/charts/ToolFrequencyBar";
import ResultsGrid from "@/components/tables/ResultsGrid";
import PromptsTable from "@/components/tables/PromptsTable";


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

  const categoryBreakdown = computeCategoryBreakdown(data);
  const perPromptNetworks = computePerPromptNetworks(data);
  const toolFrequency = computeToolFrequency(data);


  return (
    <div className="space-y-8">
      {/* Run stats */}
      <p className="text-sm text-[#a0a0b0]">
        Run: {new Date(data.meta.timestamp).toLocaleString()} &middot;{" "}
        {data.meta.resultCount} results &middot; {data.meta.modelCount} models &middot;{" "}
        {data.meta.promptCount} prompts
      </p>

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

      {/* Network Choice by Category */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          Network Choice by Category
        </h2>
        <CategoryBreakdown data={categoryBreakdown} />
      </section>

      {/* Prompts */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          Prompts Used
        </h2>
        <PromptsTable prompts={data.prompts} />
      </section>

      {/* Network Choice by Prompt */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          Network Choice by Prompt
        </h2>
        <ResultsGrid data={perPromptNetworks} />
      </section>

      {/* About */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          About this Research
        </h2>
        <div className="rounded-lg border border-[#0f3460] bg-[#16213e] p-6 text-sm leading-relaxed text-[#e0e0e0]">
          <p>
            This benchmark sends {data.meta.promptCount} chain-agnostic prompts (e.g. &quot;build me a DeFi
            app&quot;) to {data.meta.modelCount} AI models without specifying a blockchain, and analyzes
            which chain each response defaults to. Detection works by scanning responses for
            chain-specific signals (chain names, chain IDs, block explorer URLs, SDKs) and generic
            EVM signals (Solidity code, tooling like Hardhat/Foundry). Each signal has a weight, and
            the chain with the highest total score wins.
          </p>
        </div>
      </section>
    </div>
  );
}
