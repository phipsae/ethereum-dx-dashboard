import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadResponsesOrResults, type RawResponse } from "../storage/response-store.js";
import { setClassifierModel } from "../analysis/claude-cli.js";
import { llmDetectTools } from "../analysis/tool-detector.js";
import type { ToolBenchmarkResult } from "../providers/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DASHBOARD_DATA_DIR = path.resolve(__dirname, "../../dashboard/public/data");

export interface ClassifyToolsOptions {
  dirs: string[];
  concurrency: number;
  model?: string;
}

function createToolOutputDir(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dir = path.join("results", "tools", `run-${timestamp}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function saveToolResult(outputDir: string, result: ToolBenchmarkResult): void {
  fs.mkdirSync(outputDir, { recursive: true });
  const filename = `${result.runId}_${result.promptId}_${result.model.id}.json`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(result, null, 2));

  const combinedPath = path.join(outputDir, "results.jsonl");
  fs.appendFileSync(combinedPath, JSON.stringify(result) + "\n");
}

interface ToolSlimResult {
  promptId: string;
  promptCategory: string;
  model: string;
  modelDisplayName: string;
  modelTier: string;
  tools: string[];
  reasoning?: string;
  latencyMs: number;
  tokensUsed: number;
  webSearch: boolean;
}

interface ToolDashboardRunData {
  meta: {
    timestamp: string;
    runId: string;
    modelCount: number;
    promptCount: number;
    resultCount: number;
    webSearch: boolean;
  };
  results: ToolSlimResult[];
  prompts: Array<{ id: string; category: string; text: string }>;
}

function toToolSlimResult(r: ToolBenchmarkResult): ToolSlimResult {
  return {
    promptId: r.promptId,
    promptCategory: r.promptCategory,
    model: r.model.id,
    modelDisplayName: r.model.displayName,
    modelTier: r.model.tier,
    tools: r.toolDetection.tools,
    reasoning: r.toolDetection.reasoning,
    latencyMs: r.response.latencyMs,
    tokensUsed: r.response.tokensUsed,
    webSearch: r.webSearch,
  };
}

function exportToolDashboardData(results: ToolBenchmarkResult[]): string {
  const toolDataDir = path.join(DASHBOARD_DATA_DIR, "tools");
  fs.mkdirSync(toolDataDir, { recursive: true });

  const timestamp = new Date().toISOString();
  const safeTimestamp = timestamp.replace(/:/g, "-").replace(/\.\d+Z$/, "");
  const runId = results[0]?.runId ?? safeTimestamp;
  const filename = `run-${safeTimestamp}.json`;

  // Build unique prompts
  const promptMap = new Map<string, { id: string; category: string; text: string }>();
  for (const r of results) {
    if (!promptMap.has(r.promptId)) {
      promptMap.set(r.promptId, {
        id: r.promptId,
        category: r.promptCategory,
        text: r.promptText,
      });
    }
  }

  const models = new Set(results.map(r => r.model.id));

  const runData: ToolDashboardRunData = {
    meta: {
      timestamp,
      runId,
      modelCount: models.size,
      promptCount: promptMap.size,
      resultCount: results.length,
      webSearch: results.some(r => r.webSearch),
    },
    results: results.map(toToolSlimResult),
    prompts: [...promptMap.values()],
  };

  // Write run file
  const runFilePath = path.join(toolDataDir, filename);
  fs.writeFileSync(runFilePath, JSON.stringify(runData, null, 2));

  // Write latest.json
  const latestPath = path.join(toolDataDir, "latest.json");
  fs.writeFileSync(latestPath, JSON.stringify(runData, null, 2));

  return runFilePath;
}

async function classifyOne(
  r: RawResponse,
  index: number,
  total: number,
): Promise<{ result: ToolBenchmarkResult; ok: boolean }> {
  const progress = `[${index + 1}/${total}]`;
  const label = `${r.model.displayName} x "${r.promptId}"`;

  try {
    const detection = await llmDetectTools(r.response.content);

    const result: ToolBenchmarkResult = {
      promptId: r.promptId,
      promptText: r.promptText,
      promptCategory: r.promptCategory,
      model: r.model,
      response: r.response,
      toolDetection: detection,
      timestamp: r.timestamp,
      runId: r.runId,
      webSearch: r.webSearch,
    };

    const toolList = detection.tools.length > 0 ? detection.tools.join(", ") : "(none)";
    console.log(`${progress} ${label} -> ${toolList}`);

    return { result, ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${progress} ${label} x FAILED: ${message.slice(0, 100)}`);

    const result: ToolBenchmarkResult = {
      promptId: r.promptId,
      promptText: r.promptText,
      promptCategory: r.promptCategory,
      model: r.model,
      response: r.response,
      toolDetection: { tools: [], reasoning: "Classification failed" },
      timestamp: r.timestamp,
      runId: r.runId,
      webSearch: r.webSearch,
    };
    return { result, ok: false };
  }
}

export async function runClassifyTools(options: ClassifyToolsOptions): Promise<void> {
  const { dirs, concurrency, model } = options;

  if (model) {
    setClassifierModel(model);
  }

  const responses = loadResponsesOrResults(dirs);
  if (responses.length === 0) {
    console.error("No responses found in specified directories.");
    process.exit(1);
  }

  const modelLabel = model ?? "default (Opus)";
  console.log(`Loaded ${responses.length} responses from ${dirs.length} dir(s)`);
  console.log(`Classifying tools with LLM (concurrency: ${concurrency}, model: ${modelLabel})...\n`);

  const outputDir = createToolOutputDir();
  const results: ToolBenchmarkResult[] = [];
  let failCount = 0;

  // Process in batches
  for (let batchStart = 0; batchStart < responses.length; batchStart += concurrency) {
    const batchEnd = Math.min(batchStart + concurrency, responses.length);

    const batchPromises = [];
    for (let i = batchStart; i < batchEnd; i++) {
      batchPromises.push(classifyOne(responses[i], i, responses.length));
    }

    const batchResults = await Promise.all(batchPromises);

    for (const { result, ok } of batchResults) {
      results.push(result);
      saveToolResult(outputDir, result);
      if (!ok) failCount++;
    }

    console.log(`--- Batch done: ${Math.min(batchEnd, responses.length)}/${responses.length} complete ---\n`);
  }

  console.log(`\nClassification complete. ${results.length} results (${failCount} failures).`);
  console.log(`Results saved to: ${outputDir}`);

  // Export to dashboard
  const dashboardPath = exportToolDashboardData(results);
  console.log(`Dashboard data: ${dashboardPath}`);
}
