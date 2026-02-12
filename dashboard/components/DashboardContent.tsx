"use client";

import { useState, useMemo } from "react";
import type { DashboardRunData, SearchMode } from "@/lib/types";
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
import ModeToggle from "@/components/ModeToggle";

interface DashboardContentProps {
  standard: DashboardRunData | null;
  webSearch: DashboardRunData | null;
}

export default function DashboardContent({ standard, webSearch }: DashboardContentProps) {
  const hasToggle = !!standard && !!webSearch;
  const [mode, setMode] = useState<SearchMode>(webSearch ? "webSearch" : "standard");

  const data = hasToggle
    ? mode === "standard"
      ? standard!
      : webSearch!
    : standard ?? webSearch!;

  const overallEcosystems = useMemo(() => computeOverallEcosystems(data), [data]);
  const perModelEcosystems = useMemo(() => computePerModelEcosystems(data), [data]);
  const overallNetworks = useMemo(() => computeOverallNetworks(data), [data]);
  const perModelNetworks = useMemo(() => computePerModelNetworks(data), [data]);
  const categoryBreakdown = useMemo(() => computeCategoryBreakdown(data), [data]);
  const perPromptNetworks = useMemo(() => computePerPromptNetworks(data), [data]);
  const toolFrequency = useMemo(() => computeToolFrequency(data), [data]);

  const modeLabel = data.meta.webSearch ? "Web Search" : "Base Model";

  return (
    <div className="space-y-8">
      {/* Run stats + toggle */}
      <div className="flex flex-wrap items-center gap-4">
        {hasToggle && <ModeToggle mode={mode} onChange={setMode} />}
        <p className="text-sm text-[#a0a0b0]">
          {hasToggle && <span className="font-medium text-white">{modeLabel} &middot; </span>}
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
          <p className="mb-3">
            This benchmark sends {data.meta.promptCount} chain-agnostic prompts to {data.meta.modelCount} AI
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
