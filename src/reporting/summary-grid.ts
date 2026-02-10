import type { BenchmarkResult, ModelConfig } from "../providers/types.js";

export interface GridCell {
  chain: string;
  confidence: number;
  behavior: string;
  completeness: number;
  latencyMs: number;
  // When multiple runs, these are aggregated
  chainCounts?: Record<string, number>;
  avgCompleteness?: number;
  avgLatencyMs?: number;
  runCount: number;
  networkCounts?: Record<string, number>;
  network?: string;
}

export interface Grid {
  promptIds: string[];
  models: ModelConfig[];
  cells: Map<string, GridCell>; // key: `${promptId}::${modelId}`
  promptCategories: Map<string, string>; // promptId → category
  promptTexts: Map<string, string>; // promptId → text
}

function cellKey(promptId: string, modelId: string): string {
  return `${promptId}::${modelId}`;
}

export function buildGrid(results: BenchmarkResult[]): Grid {
  const promptIds = [...new Set(results.map((r) => r.promptId))];
  const modelMap = new Map<string, ModelConfig>();
  const promptCategories = new Map<string, string>();
  const promptTexts = new Map<string, string>();
  for (const r of results) {
    modelMap.set(r.model.id, r.model);
    if (r.promptCategory) promptCategories.set(r.promptId, r.promptCategory);
    if (r.promptText) promptTexts.set(r.promptId, r.promptText);
  }
  const models = [...modelMap.values()];

  // Group results by prompt+model
  const groups = new Map<string, BenchmarkResult[]>();
  for (const r of results) {
    const key = cellKey(r.promptId, r.model.id);
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }

  const cells = new Map<string, GridCell>();
  for (const [key, group] of groups) {
    // Aggregate chain results
    const chainCounts: Record<string, number> = {};
    let totalCompleteness = 0;
    let totalLatency = 0;

    const networkCounts: Record<string, number> = {};

    for (const r of group) {
      const chain = r.analysis.chain.chain;
      chainCounts[chain] = (chainCounts[chain] ?? 0) + 1;
      totalCompleteness += r.analysis.completeness.score;
      totalLatency += r.response.latencyMs;

      const net = r.analysis.chain.network?.primary ?? "N/A";
      networkCounts[net] = (networkCounts[net] ?? 0) + 1;
    }

    // Most common chain
    const topChain = Object.entries(chainCounts).sort((a, b) => b[1] - a[1])[0];
    // Most common behavior
    const behaviorCounts: Record<string, number> = {};
    for (const r of group) {
      behaviorCounts[r.analysis.behavior.behavior] =
        (behaviorCounts[r.analysis.behavior.behavior] ?? 0) + 1;
    }
    const topBehavior = Object.entries(behaviorCounts).sort((a, b) => b[1] - a[1])[0];

    // Use the latest result's confidence
    const latestResult = group[group.length - 1];

    const topNetwork = Object.entries(networkCounts).sort((a, b) => b[1] - a[1])[0];

    cells.set(key, {
      chain: topChain[0],
      confidence: latestResult.analysis.chain.confidence,
      behavior: topBehavior[0],
      completeness: Math.round(totalCompleteness / group.length),
      latencyMs: Math.round(totalLatency / group.length),
      chainCounts,
      avgCompleteness: Math.round(totalCompleteness / group.length),
      avgLatencyMs: Math.round(totalLatency / group.length),
      runCount: group.length,
      networkCounts,
      network: topNetwork[0],
    });
  }

  return { promptIds, models, cells, promptCategories, promptTexts };
}

export function getCell(grid: Grid, promptId: string, modelId: string): GridCell | undefined {
  return grid.cells.get(cellKey(promptId, modelId));
}
