"use client";

import { useState, useEffect } from "react";
import type { DashboardRunData, RunIndexEntry } from "@/lib/types";
import { fetchRunsIndex, fetchRun } from "@/lib/data";
import RunSelector from "@/components/RunSelector";
import ChainPieChart from "@/components/charts/ChainPieChart";
import { computeOverallChains, computeDefaultChains } from "@/lib/data";
import { getChainColor } from "@/lib/types";

export default function HistoryPage() {
  const [runs, setRuns] = useState<RunIndexEntry[]>([]);
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);
  const [runDataA, setRunDataA] = useState<DashboardRunData | null>(null);
  const [runDataB, setRunDataB] = useState<DashboardRunData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRunsIndex().then((index) => {
      setRuns(index);
      setLoading(false);
      if (index.length >= 1) setSelectedA(index[0].filename);
      if (index.length >= 2) setSelectedB(index[1].filename);
    });
  }, []);

  useEffect(() => {
    if (selectedA) fetchRun(selectedA).then(setRunDataA);
    else setRunDataA(null);
  }, [selectedA]);

  useEffect(() => {
    if (selectedB) fetchRun(selectedB).then(setRunDataB);
    else setRunDataB(null);
  }, [selectedB]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[#a0a0b0]">Loading run history...</p>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-white">No Runs Found</h1>
          <p className="text-[#a0a0b0]">
            Run a benchmark to start building history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Run History</h1>
        <p className="text-sm text-[#a0a0b0]">
          Compare chain distribution across benchmark runs
        </p>
      </div>

      {/* Timeline */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          All Runs
        </h2>
        <div className="space-y-2">
          {runs.map((run) => (
            <div
              key={run.filename}
              className="flex items-center gap-4 rounded-lg border border-[#0f3460] bg-[#16213e] px-4 py-3"
            >
              <div className="h-3 w-3 rounded-full bg-[#e94560]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {new Date(run.timestamp).toLocaleString()}
                </p>
                <p className="text-xs text-[#a0a0b0]">
                  {run.modelCount} models &middot; {run.promptCount} prompts &middot;{" "}
                  {run.resultCount} results
                </p>
              </div>
              <span className="font-mono text-xs text-[#a0a0b0]">{run.runId}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      {runs.length >= 2 && (
        <section>
          <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
            Compare Runs
          </h2>
          <div className="mb-6 flex flex-wrap gap-4">
            <RunSelector
              runs={runs}
              selected={selectedA}
              onChange={setSelectedA}
              label="Run A:"
            />
            <RunSelector
              runs={runs}
              selected={selectedB}
              onChange={setSelectedB}
              label="Run B:"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {runDataA && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-[#a0a0b0]">
                  Run A: {new Date(runDataA.meta.timestamp).toLocaleString()}
                </h3>
                <ChainPieChart data={computeOverallChains(runDataA)} height={280} />
                <div className="mt-4 space-y-1">
                  {computeDefaultChains(runDataA).map((row) => (
                    <div key={row.model} className="flex items-center justify-between rounded bg-[#16213e] px-3 py-1.5 text-sm">
                      <span className="text-[#e0e0e0]">{row.model}</span>
                      <span style={{ color: getChainColor(row.defaultChain) }} className="font-semibold">
                        {row.defaultChain} <span className="text-[#a0a0b0] font-normal">({row.timesChosen})</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {runDataB && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-[#a0a0b0]">
                  Run B: {new Date(runDataB.meta.timestamp).toLocaleString()}
                </h3>
                <ChainPieChart data={computeOverallChains(runDataB)} height={280} />
                <div className="mt-4 space-y-1">
                  {computeDefaultChains(runDataB).map((row) => (
                    <div key={row.model} className="flex items-center justify-between rounded bg-[#16213e] px-3 py-1.5 text-sm">
                      <span className="text-[#e0e0e0]">{row.model}</span>
                      <span style={{ color: getChainColor(row.defaultChain) }} className="font-semibold">
                        {row.defaultChain} <span className="text-[#a0a0b0] font-normal">({row.timesChosen})</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
