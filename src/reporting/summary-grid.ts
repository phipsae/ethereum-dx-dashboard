import type { BenchmarkResult, ModelConfig } from "../providers/types.js";

export interface GridCell {
  ecosystem: string;
  network: string;
  confidence: number;
  behavior: string;
  completeness: number;
  latencyMs: number;
  // When multiple runs, these are aggregated
  ecosystemCounts?: Record<string, number>;
  networkCounts?: Record<string, number>;
  avgCompleteness?: number;
  avgLatencyMs?: number;
  runCount: number;
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
    const ecosystemCounts: Record<string, number> = {};
    const networkCounts: Record<string, number> = {};
    let totalCompleteness = 0;
    let totalLatency = 0;

    for (const r of group) {
      const eco = r.analysis.detection.ecosystem;
      ecosystemCounts[eco] = (ecosystemCounts[eco] ?? 0) + 1;
      const net = r.analysis.detection.network;
      networkCounts[net] = (networkCounts[net] ?? 0) + 1;
      totalCompleteness += r.analysis.completeness.score;
      totalLatency += r.response.latencyMs;
    }

    // Most common ecosystem
    const topEcosystem = Object.entries(ecosystemCounts).sort((a, b) => b[1] - a[1])[0];
    // Most common network
    const topNetwork = Object.entries(networkCounts).sort((a, b) => b[1] - a[1])[0];
    // Most common behavior
    const behaviorCounts: Record<string, number> = {};
    for (const r of group) {
      behaviorCounts[r.analysis.behavior.behavior] =
        (behaviorCounts[r.analysis.behavior.behavior] ?? 0) + 1;
    }
    const topBehavior = Object.entries(behaviorCounts).sort((a, b) => b[1] - a[1])[0];

    const latestResult = group[group.length - 1];

    cells.set(key, {
      ecosystem: topEcosystem[0],
      network: topNetwork[0],
      confidence: latestResult.analysis.detection.confidence,
      behavior: topBehavior[0],
      completeness: Math.round(totalCompleteness / group.length),
      latencyMs: Math.round(totalLatency / group.length),
      ecosystemCounts,
      networkCounts,
      avgCompleteness: Math.round(totalCompleteness / group.length),
      avgLatencyMs: Math.round(totalLatency / group.length),
      runCount: group.length,
    });
  }

  return { promptIds, models, cells, promptCategories, promptTexts };
}

export function getCell(grid: Grid, promptId: string, modelId: string): GridCell | undefined {
  return grid.cells.get(cellKey(promptId, modelId));
}
