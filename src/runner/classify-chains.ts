import { loadResponsesOrResults, type RawResponse } from "../storage/response-store.js";
import { createOutputDir, saveResult } from "../storage/json-store.js";
import { analyzeResponse } from "../analysis/analyzer.js";
import { setClassifierModel } from "../analysis/claude-cli.js";
import { buildGrid } from "../reporting/summary-grid.js";
import { exportDashboardData } from "../reporting/dashboard-exporter.js";
import type { BenchmarkResult } from "../providers/types.js";

export interface ClassifyChainsOptions {
  dirs: string[];
  concurrency: number;
  model?: string;
}

async function classifyOne(
  r: RawResponse,
  index: number,
  total: number,
): Promise<{ result: BenchmarkResult; ok: boolean }> {
  const progress = `[${index + 1}/${total}]`;
  const label = `${r.model.displayName} x "${r.promptId}"`;

  try {
    const analysis = await analyzeResponse(r.response.content, r.promptText);

    const result: BenchmarkResult = {
      promptId: r.promptId,
      promptText: r.promptText,
      promptCategory: r.promptCategory,
      model: r.model,
      response: r.response,
      analysis,
      timestamp: r.timestamp,
      runId: r.runId,
      webSearch: r.webSearch,
    };

    const netSuffix = analysis.detection.network !== "Ethereum Ecosystem" && analysis.detection.network !== "Chain-Agnostic"
      ? ` [${analysis.detection.network}]` : "";
    console.log(`${progress} ${label} -> ${analysis.detection.ecosystem}${netSuffix} (${analysis.detection.strength})`);

    return { result, ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${progress} ${label} x FAILED: ${message.slice(0, 100)}`);

    // Return a placeholder result so we don't lose the response
    const result: BenchmarkResult = {
      promptId: r.promptId,
      promptText: r.promptText,
      promptCategory: r.promptCategory,
      model: r.model,
      response: r.response,
      analysis: {
        detection: {
          network: "Chain-Agnostic",
          ecosystem: "Chain-Agnostic",
          strength: "implicit",
          evidence: ["Classification failed"],
          all: { "Chain-Agnostic": 1 },
        },
        behavior: { behavior: "just-built", questionsAsked: 0, decisionsStated: [] },
        completeness: { score: 0, hasContract: false, hasDeployScript: false, hasFrontend: false, hasTests: false, todoCount: 0 },
      },
      timestamp: r.timestamp,
      runId: r.runId,
      webSearch: r.webSearch,
    };
    return { result, ok: false };
  }
}

export async function runClassifyChains(options: ClassifyChainsOptions): Promise<void> {
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
  console.log(`Classifying chains with LLM (concurrency: ${concurrency}, model: ${modelLabel})...\n`);

  const outputDir = createOutputDir("results/chains");
  const results: BenchmarkResult[] = [];
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
      saveResult(outputDir, result);
      if (!ok) failCount++;
    }

    console.log(`--- Batch done: ${Math.min(batchEnd, responses.length)}/${responses.length} complete ---\n`);
  }

  console.log(`\nClassification complete. ${results.length} results (${failCount} failures).`);
  console.log(`Results saved to: ${outputDir}`);

  // Export to dashboard
  const grid = buildGrid(results);
  const dashboardPath = exportDashboardData(results, grid, "chains");
  console.log(`Dashboard data: ${dashboardPath}`);
}
