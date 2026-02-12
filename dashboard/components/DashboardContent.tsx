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
  const [mode, setMode] = useState<SearchMode>("standard");

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
          <p>
            This benchmark sends {data.meta.promptCount} chain-agnostic prompts (see above) to {data.meta.modelCount} AI models without specifying a blockchain, and analyzes
            which chain each response defaults to. Each response is classified by an LLM that
            determines the primary chain recommended. If a response explicitly picks one chain, that
            wins; if it lists multiple options equally or uses generic EVM code, it&apos;s marked
            &quot;Ethereum (No Specific L2)&quot;; if no blockchain is mentioned at all, it&apos;s &quot;Chain Agnostic&quot;.
          </p>
        </div>
      </section>

      {/* API vs ChatGPT */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          Why API Results May Differ from ChatGPT.com
        </h2>
        <div className="rounded-lg border border-[#0f3460] bg-[#16213e] p-6 text-sm leading-relaxed text-[#e0e0e0]">
          <p className="mb-3">
            This benchmark uses direct API calls rather than the ChatGPT web interface. Results may
            differ for several reasons:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-white">No system prompt</strong> &mdash; ChatGPT.com injects a
              hidden system prompt that shapes tone, safety behavior, and formatting. API calls send
              only the raw user prompt, giving a purer read of the model&apos;s defaults.
            </li>
            <li>
              <strong className="text-white">Fewer tools available</strong> &mdash; ChatGPT.com has
              Code Interpreter, DALL-E, file upload, and canvas. The model may behave differently when
              it knows these tools exist. Our API calls only optionally enable web search.
            </li>
            <li>
              <strong className="text-white">Different moderation layers</strong> &mdash; ChatGPT.com
              applies additional safety and moderation filtering on top of the model that can alter or
              refuse certain outputs.
            </li>
            <li>
              <strong className="text-white">Model version may differ</strong> &mdash; The model served
              on ChatGPT.com can be a slightly different snapshot or fine-tune than what the API returns
              for the same model name.
            </li>
            <li>
              <strong className="text-white">No user memory or context</strong> &mdash; ChatGPT.com can
              use stored user preferences and conversation history. API calls are stateless with zero
              prior context.
            </li>
          </ul>
          <p className="mt-3 text-[#a0a0b0]">
            The API approach measures a model&apos;s inherent bias with minimal external influence,
            while ChatGPT.com responses are shaped by multiple additional layers that could nudge the
            model toward or away from specific chains.
          </p>
        </div>
      </section>
    </div>
  );
}
