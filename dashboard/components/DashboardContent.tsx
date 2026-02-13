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
  computeEcosystemComparison,
  computePerModelComparison,
  computeToolComparison,
} from "@/lib/data";
import ChainPieChart from "@/components/charts/ChainPieChart";
import NetworkDistribution from "@/components/charts/NetworkDistribution";
import CategoryBreakdown from "@/components/charts/CategoryBreakdown";
import ToolFrequencyBar from "@/components/charts/ToolFrequencyBar";
import ToolStackedBar from "@/components/charts/ToolStackedBar";
import ResultsGrid from "@/components/tables/ResultsGrid";
import PromptsTable from "@/components/tables/PromptsTable";
import ComparisonBar from "@/components/charts/ComparisonBar";
import ComparisonStackedBar from "@/components/charts/ComparisonStackedBar";
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
  const [showAllTools, setShowAllTools] = useState(false);

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

  // Tool filtering: only show tools with >= 10% of results by default
  const minToolCount = toolData ? Math.ceil(toolData.meta.resultCount * 0.1) : 0;
  const minToolCountCompare = hasToolToggle
    ? Math.ceil(Math.min(toolStandard!.meta.resultCount, toolWebSearch!.meta.resultCount) * 0.1)
    : minToolCount;
  const filteredOverallTools = useMemo(() => {
    if (showAllTools) return overallTools;
    return overallTools.filter((t) => t.count >= minToolCount);
  }, [overallTools, showAllTools, minToolCount]);

  const visibleToolNames = useMemo(
    () => new Set(filteredOverallTools.map((t) => t.tool)),
    [filteredOverallTools],
  );

  const filteredPerModelTools = useMemo(() => {
    if (showAllTools) return perModelTools;
    return perModelTools.map((entry) => ({
      ...entry,
      tools: Object.fromEntries(
        Object.entries(entry.tools).filter(([name]) => visibleToolNames.has(name)),
      ),
    }));
  }, [perModelTools, showAllTools, visibleToolNames]);

  const filteredToolsByCategory = useMemo(() => {
    if (showAllTools) return toolsByCategory;
    return toolsByCategory.map((entry) => ({
      ...entry,
      tools: Object.fromEntries(
        Object.entries(entry.tools).filter(([name]) => visibleToolNames.has(name)),
      ),
    }));
  }, [toolsByCategory, showAllTools, visibleToolNames]);

  // Comparison computations (only when both modes exist)
  const ecosystemComparison = useMemo(
    () => hasChainToggle ? computeEcosystemComparison(standard!, webSearch!) : [],
    [hasChainToggle, standard, webSearch],
  );
  const perModelComparison = useMemo(
    () => hasChainToggle ? computePerModelComparison(standard!, webSearch!) : [],
    [hasChainToggle, standard, webSearch],
  );
  const toolComparison = useMemo(
    () => hasToolToggle ? computeToolComparison(toolStandard!, toolWebSearch!) : [],
    [hasToolToggle, toolStandard, toolWebSearch],
  );

  const activeData = tab === "network" ? chainData : tab === "tools" ? toolData : null;
  const modeLabel = activeData?.meta.webSearch ? "Web Search" : "Base Model";
  const hasToggle = tab === "network" ? hasChainToggle : tab === "tools" ? hasToolToggle : false;

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
        {hasChainToggle && (
          <button
            onClick={() => setTab("compare")}
            className={`pb-2 text-sm font-medium transition-colors ${
              tab === "compare"
                ? "border-b-2 border-[#e94560] text-white"
                : "text-[#a0a0b0] hover:text-white"
            }`}
          >
            Compare
          </button>
        )}
      </div>

      {/* Run stats + toggle */}
      {tab !== "compare" && (
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
      )}

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
              {/* Filter toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAllTools((v) => !v)}
                  className="rounded border border-[#0f3460] bg-[#16213e] px-3 py-1.5 text-xs font-medium text-[#a0a0b0] transition-colors hover:border-[#e94560] hover:text-white"
                >
                  {showAllTools
                    ? `Show top tools`
                    : `Show all (${overallTools.length})`}
                </button>
                <span className="text-xs text-[#a0a0b0]">
                  {showAllTools
                    ? `Showing all ${overallTools.length} tools`
                    : `Showing ${filteredOverallTools.length} tools with ${minToolCount}+ recommendations`}
                </span>
              </div>

              {/* Overall Tool Frequency */}
              <section>
                <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
                  Tool / Framework Recommendations (Overall)
                </h2>
                <ToolFrequencyBar data={filteredOverallTools} />
              </section>

              {/* Tool Recommendations by Model */}
              <section>
                <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
                  Tool Recommendations by Model
                </h2>
                <ToolStackedBar
                  data={filteredPerModelTools.map((e) => ({ label: e.model, tools: e.tools }))}
                />
              </section>

              {/* Tool Recommendations by Category */}
              <section>
                <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
                  Tool Recommendations by Category
                </h2>
                <ToolStackedBar
                  data={filteredToolsByCategory.map((e) => ({ label: e.category, tools: e.tools }))}
                />
              </section>
            </>
          )}
        </>
      )}

      {/* Compare Tab */}
      {tab === "compare" && hasChainToggle && (
        <>
          {/* Summary */}
          <div className="rounded-lg border border-[#0f3460] bg-[#16213e] p-4">
            <p className="text-sm text-[#e0e0e0]">
              Comparing{" "}
              <span className="font-semibold text-white">{standard!.meta.resultCount} base model</span>
              {" "}vs{" "}
              <span className="font-semibold text-white">{webSearch!.meta.resultCount} web search</span>
              {" "}responses across {standard!.meta.modelCount} models and{" "}
              {standard!.meta.promptCount} prompts.
            </p>
            {ecosystemComparison.length > 0 && (() => {
              const biggest = ecosystemComparison[0];
              const sign = biggest.deltaPp > 0 ? "+" : "";
              return (
                <p className="mt-2 text-xs text-[#a0a0b0]">
                  Largest shift: <span className="font-medium text-white">{biggest.label}</span>{" "}
                  moved{" "}
                  <span className={biggest.deltaPp > 0 ? "text-[#4bc0c0]" : "text-[#e94560]"}>
                    {sign}{Math.round(biggest.deltaPp * 10) / 10}pp
                  </span>{" "}
                  with web search enabled.
                </p>
              );
            })()}
          </div>

          {/* Ecosystem Distribution: Base vs Web Search */}
          <section>
            <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
              Ecosystem Distribution: Base vs Web Search
            </h2>
            <ComparisonBar
              data={ecosystemComparison.map((r) => ({
                label: r.label,
                baseValue: r.basePct,
                webValue: r.webPct,
                deltaPp: r.deltaPp,
              }))}
              title="Share of responses per ecosystem (%)"
            />
          </section>

          {/* Ecosystem by Model: Base vs Web Search */}
          <section>
            <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
              Ecosystem by Model: Base vs Web Search
            </h2>
            <ComparisonStackedBar data={perModelComparison.map((r) => ({ label: r.model, base: r.base, web: r.web }))} />
          </section>

          {/* Tool Recommendations: Base vs Web Search */}
          {hasToolToggle && toolComparison.length > 0 && (
            <>
              <section>
                <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
                  Most Recommended Tools: Base vs Web Search
                </h2>
                <p className="mb-3 text-xs text-[#a0a0b0]">
                  Top 20 tools by overall popularity. Each bar shows the % of responses that recommended this tool.
                </p>
                <ComparisonBar
                  data={toolComparison
                    .slice(0, 20)
                    .map((r) => ({
                    label: r.tool,
                    baseValue: r.basePct,
                    webValue: r.webPct,
                    deltaPp: r.deltaPp,
                  }))}
                  title="Share of responses recommending each tool (%)"
                />
              </section>

              <section>
                <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
                  Biggest Shifts with Web Search
                </h2>
                <p className="mb-3 text-xs text-[#a0a0b0]">
                  Tools with the largest change in recommendation rate between modes, sorted by absolute difference in percentage points.
                </p>
                <ComparisonBar
                  data={[...toolComparison]
                    .sort((a, b) => Math.abs(b.deltaPp) - Math.abs(a.deltaPp))
                    .slice(0, 15)
                    .map((r) => ({
                    label: r.tool,
                    baseValue: r.basePct,
                    webValue: r.webPct,
                    deltaPp: r.deltaPp,
                  }))}
                  title="Share of responses recommending each tool (%)"
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
          {tab === "compare" ? (
            <>
              <p className="mb-3">
                This view compares model responses collected in two modes: <strong className="text-white">Base Model</strong>{" "}
                (standard API calls with no system prompt) and <strong className="text-white">Web Search</strong>{" "}
                (the same prompts with web search enabled). Both sets use identical prompts and models.
              </p>
              <p>
                Deltas are shown in percentage points (pp). A positive delta means web search increased
                the share of that ecosystem or tool; a negative delta means it decreased. All responses
                are classified by the same Claude Opus 4.6 classifier, so any differences reflect changes
                in model behavior, not classifier variance.
              </p>
            </>
          ) : tab === "network" ? (
            <>
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
            </>
          ) : (
            <>
              <p className="mb-3">
                The same {chainData.meta.promptCount} chain-agnostic prompts are sent to {chainData.meta.modelCount} AI
                models via their APIs. Each response is then analyzed by Claude Opus 4.6 to identify
                which development tools, frameworks, and libraries the model actively recommends.
              </p>
              <p>
                The classifier distinguishes genuine recommendations from passing mentions - a tool
                is only counted when the model suggests using it as part of the solution, not when
                it mentions it as an alternative or outdated option. This reveals which tools each
                model defaults to when given open-ended blockchain development prompts.
              </p>
            </>
          )}
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
