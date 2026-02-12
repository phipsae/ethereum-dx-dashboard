"use client";

import { useState, useMemo } from "react";
import type { DashboardRunData, ToolDashboardRunData, SearchMode, DashboardTab } from "@/lib/types";
import {
  computeOverallEcosystems,
  computePerModelEcosystems,
  computeOverallNetworks,
  computePerModelNetworks,
  computeCategoryBreakdown,
  computePerPromptNetworks,
  computeToolFrequency,
  computeOverallTools,
  computePerModelTools,
  computeToolsByCategory,
} from "@/lib/data";
import ChainPieChart from "@/components/charts/ChainPieChart";
import NetworkDistribution from "@/components/charts/NetworkDistribution";
import CategoryBreakdown from "@/components/charts/CategoryBreakdown";
import ToolFrequencyBar from "@/components/charts/ToolFrequencyBar";
import ToolStackedBar from "@/components/charts/ToolStackedBar";
import ResultsGrid from "@/components/tables/ResultsGrid";
import PromptsTable from "@/components/tables/PromptsTable";
import ModeToggle from "@/components/ModeToggle";

interface DashboardContentProps {
  standard: DashboardRunData | null;
  webSearch: DashboardRunData | null;
  toolStandard?: ToolDashboardRunData | null;
  toolWebSearch?: ToolDashboardRunData | null;
}

export default function DashboardContent({
  standard,
  webSearch,
  toolStandard,
  toolWebSearch,
}: DashboardContentProps) {
  const hasChainToggle = !!standard && !!webSearch;
  const hasToolData = !!toolStandard || !!toolWebSearch;
  const hasToolToggle = !!toolStandard && !!toolWebSearch;

  const [tab, setTab] = useState<DashboardTab>("network");
  const [mode, setMode] = useState<SearchMode>(webSearch ? "webSearch" : "standard");

  // Chain data selection
  const chainData = hasChainToggle
    ? mode === "standard"
      ? standard!
      : webSearch!
    : standard ?? webSearch!;

  // Tool data selection
  const toolData = hasToolToggle
    ? mode === "standard"
      ? toolStandard!
      : toolWebSearch!
    : toolStandard ?? toolWebSearch ?? null;

  // Chain computations
  const overallEcosystems = useMemo(() => computeOverallEcosystems(chainData), [chainData]);
  const perModelEcosystems = useMemo(() => computePerModelEcosystems(chainData), [chainData]);
  const overallNetworks = useMemo(() => computeOverallNetworks(chainData), [chainData]);
  const perModelNetworks = useMemo(() => computePerModelNetworks(chainData), [chainData]);
  const categoryBreakdown = useMemo(() => computeCategoryBreakdown(chainData), [chainData]);
  const perPromptNetworks = useMemo(() => computePerPromptNetworks(chainData), [chainData]);
  const toolFrequency = useMemo(() => computeToolFrequency(chainData), [chainData]);

  // Tool computations
  const overallTools = useMemo(() => toolData ? computeOverallTools(toolData) : [], [toolData]);
  const perModelTools = useMemo(() => toolData ? computePerModelTools(toolData) : [], [toolData]);
  const toolsByCategory = useMemo(() => toolData ? computeToolsByCategory(toolData) : [], [toolData]);

  const activeData = tab === "network" ? chainData : toolData;
  const modeLabel = activeData?.meta.webSearch ? "Web Search" : "Base Model";
  const hasToggle = tab === "network" ? hasChainToggle : hasToolToggle;

  return (
    <div className="space-y-8">
      {/* Tab bar */}
      <div className="flex items-center gap-6 border-b border-[#0f3460]">
        <button
          onClick={() => setTab("network")}
          className={`pb-2 text-sm font-medium transition-colors ${
            tab === "network"
              ? "border-b-2 border-[#e94560] text-white"
              : "text-[#a0a0b0] hover:text-white"
          }`}
        >
          Network Bias
        </button>
        <button
          onClick={() => setTab("tools")}
          className={`pb-2 text-sm font-medium transition-colors ${
            tab === "tools"
              ? "border-b-2 border-[#e94560] text-white"
              : "text-[#a0a0b0] hover:text-white"
          }`}
        >
          Tool Bias
        </button>
      </div>

      {/* Run stats + toggle */}
      <div className="flex flex-wrap items-center gap-4">
        {hasToggle && <ModeToggle mode={mode} onChange={setMode} />}
        {activeData && (
          <p className="text-sm text-[#a0a0b0]">
            {hasToggle && <span className="font-medium text-white">{modeLabel} &middot; </span>}
            Run: {new Date(activeData.meta.timestamp).toLocaleString()} &middot;{" "}
            {activeData.meta.resultCount} results &middot; {activeData.meta.modelCount} models &middot;{" "}
            {activeData.meta.promptCount} prompts
          </p>
        )}
      </div>

      {/* Network Bias Tab */}
      {tab === "network" && (
        <>
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

          {/* Tool / Framework Frequency (legacy, from evidence field) */}
          {toolFrequency.length > 0 && (
            <section>
              <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
                Tool / Framework Frequency
              </h2>
              <ToolFrequencyBar data={toolFrequency} />
            </section>
          )}

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
            <PromptsTable prompts={chainData.prompts} />
          </section>

          {/* Network Choice by Prompt */}
          <section>
            <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
              Network Choice by Prompt
            </h2>
            <ResultsGrid data={perPromptNetworks} />
          </section>
        </>
      )}

      {/* Tool Bias Tab */}
      {tab === "tools" && (
        <>
          {!hasToolData ? (
            <div className="rounded-lg border border-[#0f3460] bg-[#16213e] p-8 text-center">
              <p className="text-[#a0a0b0]">No tool classification data available yet.</p>
              <code className="mt-2 block rounded bg-[#1a1a2e] px-4 py-2 font-mono text-sm text-[#e94560]">
                npx tsx src/index.ts classify tools &lt;responses-dir&gt;
              </code>
            </div>
          ) : (
            <>
              {/* Overall Tool Frequency */}
              <section>
                <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
                  Tool / Framework Recommendations (Overall)
                </h2>
                <ToolFrequencyBar data={overallTools} />
              </section>

              {/* Tool Recommendations by Model */}
              <section>
                <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
                  Tool Recommendations by Model
                </h2>
                <ToolStackedBar
                  data={perModelTools.map((e) => ({ label: e.model, tools: e.tools }))}
                />
              </section>

              {/* Tool Recommendations by Category */}
              <section>
                <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
                  Tool Recommendations by Category
                </h2>
                <ToolStackedBar
                  data={toolsByCategory.map((e) => ({ label: e.category, tools: e.tools }))}
                />
              </section>
            </>
          )}
        </>
      )}

      {/* About */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          About this Research
        </h2>
        <div className="rounded-lg border border-[#0f3460] bg-[#16213e] p-6 text-sm leading-relaxed text-[#e0e0e0]">
          <p className="mb-3">
            This benchmark sends {chainData.meta.promptCount} chain-agnostic prompts to {chainData.meta.modelCount} AI
            models via their APIs, with no system prompt, to measure each model&apos;s inherent chain
            defaults. Every response is classified by Claude Opus 4.6.
          </p>
          <p>
            Classification follows a strict priority: an explicit chain recommendation wins first; then
            a concrete example or tutorial targeting one chain; then code with chain-specific
            configuration (chain IDs, RPC URLs); generic Ethereum/EVM code without a specific L2 is
            marked &quot;Ethereum Ecosystem&quot;; multiple EVM chains presented equally is also
            &quot;Ethereum Ecosystem&quot;; if listed chains span multiple ecosystems (e.g. Solana,
            Base, and Ethereum presented equally), the response is &quot;Chain-Agnostic&quot;; and if
            no blockchain is mentioned or the model refuses to choose, it is also
            &quot;Chain-Agnostic&quot;.
          </p>
        </div>
      </section>

      {/* Limitations & Caveats */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          Limitations &amp; Caveats
        </h2>
        <div className="rounded-lg border border-[#0f3460] bg-[#16213e] p-6 text-sm leading-relaxed text-[#e0e0e0]">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-white">API vs. chat interfaces</strong> - This benchmark
              uses direct API calls, not chat products like ChatGPT, Claude.ai, or Gemini. Chat
              interfaces add system prompts, built-in tools, moderation layers, and user memory
              that shape responses. Model versions may also differ between the API and the chat
              product. The API approach isolates the model&apos;s inherent defaults with minimal
              external influence.
            </li>
            <li>
              <strong className="text-white">Single classifier</strong> - All responses are
              classified by Claude Opus 4.6. Systematic biases in the classifier affect all
              results uniformly.
            </li>
            <li>
              <strong className="text-white">Sample size</strong> - Results depend on the number of
              prompts and runs per prompt. Single-prompt categories reflect one prompt, not the
              category as a whole.
            </li>
            <li>
              <strong className="text-white">Prompt design</strong> - Some prompts may implicitly
              favor chains where well-known products already exist (e.g., name service prompts
              resemble ENS, memecoin prompts resemble pump.fun).
            </li>
            <li>
              <strong className="text-white">Non-deterministic</strong> - LLM responses vary
              between runs. The same prompt can produce different chain choices on repeat.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
