import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { BenchmarkResult } from "../providers/types.js";
import type { Grid } from "./summary-grid.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DASHBOARD_DATA_DIR = path.resolve(__dirname, "../../dashboard/public/data");

interface DashboardRunMeta {
  timestamp: string;
  runId: string;
  modelCount: number;
  promptCount: number;
  resultCount: number;
  webSearch: boolean;
}

interface SlimResult {
  promptId: string;
  promptCategory: string;
  model: string;
  modelDisplayName: string;
  modelTier: string;
  ecosystem: string;
  network: string;
  strength: string;
  behavior: string;
  completeness: number;
  latencyMs: number;
  tokensUsed: number;
  evidence: string[];
  webSearch: boolean;
}

interface SerializedGridCell {
  ecosystem: string;
  network: string;
  strength: string;
  behavior: string;
  completeness: number;
  latencyMs: number;
  ecosystemCounts: Record<string, number>;
  networkCounts: Record<string, number>;
  runCount: number;
}

interface DashboardPrompt {
  id: string;
  category: string;
  text: string;
}

interface DashboardRunData {
  meta: DashboardRunMeta;
  results: SlimResult[];
  grid: {
    promptIds: string[];
    models: Array<{ id: string; displayName: string; tier: string; provider: string }>;
    cells: Record<string, SerializedGridCell>;
  };
  prompts: DashboardPrompt[];
}

interface RunIndexEntry {
  timestamp: string;
  runId: string;
  filename: string;
  modelCount: number;
  promptCount: number;
  resultCount: number;
  webSearch: boolean;
}

function toSlimResult(r: BenchmarkResult): SlimResult {
  return {
    promptId: r.promptId,
    promptCategory: r.promptCategory,
    model: r.model.id,
    modelDisplayName: r.model.displayName,
    modelTier: r.model.tier,
    ecosystem: r.analysis.detection.ecosystem,
    network: r.analysis.detection.network,
    strength: r.analysis.detection.strength,
    behavior: r.analysis.behavior.behavior,
    completeness: r.analysis.completeness.score,
    latencyMs: r.response.latencyMs,
    tokensUsed: r.response.tokensUsed,
    evidence: r.analysis.detection.evidence,
    webSearch: r.webSearch ?? false,
  };
}

function serializeGrid(grid: Grid): DashboardRunData["grid"] {
  const cells: Record<string, SerializedGridCell> = {};
  for (const [key, cell] of grid.cells) {
    cells[key] = {
      ecosystem: cell.ecosystem,
      network: cell.network,
      strength: cell.strength,
      behavior: cell.behavior,
      completeness: cell.completeness,
      latencyMs: cell.latencyMs,
      ecosystemCounts: cell.ecosystemCounts ?? { [cell.ecosystem]: 1 },
      networkCounts: cell.networkCounts ?? {},
      runCount: cell.runCount,
    };
  }

  return {
    promptIds: grid.promptIds,
    models: grid.models.map((m) => ({
      id: m.id,
      displayName: m.displayName,
      tier: m.tier,
      provider: m.provider,
    })),
    cells,
  };
}

export function exportDashboardData(
  results: BenchmarkResult[],
  grid: Grid
): string {
  // Ensure output directory exists
  fs.mkdirSync(DASHBOARD_DATA_DIR, { recursive: true });

  const timestamp = new Date().toISOString();
  const safeTimestamp = timestamp.replace(/:/g, "-").replace(/\.\d+Z$/, "");
  const runId = results[0]?.runId ?? safeTimestamp;
  const filename = `run-${safeTimestamp}.json`;

  // Build prompts array
  const prompts: DashboardPrompt[] = grid.promptIds.map((id) => ({
    id,
    category: grid.promptCategories.get(id) ?? "Unknown",
    text: grid.promptTexts.get(id) ?? "",
  }));

  // Build run data
  const runData: DashboardRunData = {
    meta: {
      timestamp,
      runId,
      modelCount: grid.models.length,
      promptCount: grid.promptIds.length,
      resultCount: results.length,
      webSearch: results.some((r) => r.webSearch === true),
    },
    results: results.map(toSlimResult),
    grid: serializeGrid(grid),
    prompts,
  };

  // Write run file
  const runFilePath = path.join(DASHBOARD_DATA_DIR, filename);
  fs.writeFileSync(runFilePath, JSON.stringify(runData, null, 2));

  // Write latest.json (always the data that was passed in)
  const latestPath = path.join(DASHBOARD_DATA_DIR, "latest.json");
  fs.writeFileSync(latestPath, JSON.stringify(runData, null, 2));

  // Update runs.json index
  const runsIndexPath = path.join(DASHBOARD_DATA_DIR, "runs.json");
  let runsIndex: RunIndexEntry[] = [];
  if (fs.existsSync(runsIndexPath)) {
    try {
      runsIndex = JSON.parse(fs.readFileSync(runsIndexPath, "utf-8"));
    } catch {
      runsIndex = [];
    }
  }

  runsIndex.push({
    timestamp,
    runId,
    filename,
    modelCount: grid.models.length,
    promptCount: grid.promptIds.length,
    resultCount: results.length,
    webSearch: results.some((r) => r.webSearch === true),
  });

  // Sort by timestamp descending (newest first)
  runsIndex.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  fs.writeFileSync(runsIndexPath, JSON.stringify(runsIndex, null, 2));

  return runFilePath;
}
