/**
 * Re-classify existing benchmark results using the LLM detector.
 * Reads raw results from results.jsonl, runs each through claude -p
 * in parallel batches, updates detection fields, and re-exports to dashboard.
 *
 * Usage: npx tsx src/reclassify.ts results/run-2026-02-11T08-35-40
 *        npx tsx src/reclassify.ts --concurrency 8 results/run-*
 */

import { loadResults } from "./storage/json-store.js";
import { llmDetect } from "./analysis/llm-detector.js";
import { buildGrid } from "./reporting/summary-grid.js";
import { exportDashboardData } from "./reporting/dashboard-exporter.js";
import type { BenchmarkResult } from "./providers/types.js";

const DEFAULT_CONCURRENCY = 6;

function parseArgs() {
  const args = process.argv.slice(2);
  let concurrency = DEFAULT_CONCURRENCY;
  const dirs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--concurrency" || args[i] === "-c") {
      concurrency = parseInt(args[++i], 10);
      if (isNaN(concurrency) || concurrency < 1) {
        console.error("Invalid concurrency value");
        process.exit(1);
      }
    } else {
      dirs.push(args[i]);
    }
  }

  if (dirs.length === 0) {
    console.error("Usage: npx tsx src/reclassify.ts [-c <concurrency>] <results-dir> [<results-dir> ...]");
    process.exit(1);
  }

  return { concurrency, dirs };
}

async function reclassifyOne(
  r: BenchmarkResult,
  index: number,
  total: number,
): Promise<{ result: BenchmarkResult; changed: boolean }> {
  const progress = `[${index + 1}/${total}]`;
  const label = `${r.model.displayName} × "${r.promptId}"`;

  try {
    const detection = await llmDetect(r.response.content, r.promptText);

    const oldNetwork = r.analysis.detection.network;
    const newNetwork = detection.network;
    const changed = oldNetwork !== newNetwork;
    const changedStr = changed ? ` (was: ${oldNetwork})` : "";

    console.log(`${progress} ${label} → ${detection.ecosystem} / ${newNetwork}${changedStr}`);

    r.analysis.detection = detection;
    return { result: r, changed };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${progress} ${label} ✗ LLM failed, keeping original: ${message.slice(0, 100)}`);
    return { result: r, changed: false };
  }
}

async function runParallel(
  results: BenchmarkResult[],
  concurrency: number,
): Promise<BenchmarkResult[]> {
  const total = results.length;
  const reclassified: BenchmarkResult[] = new Array(total);
  let changedCount = 0;
  let doneCount = 0;

  // Process in batches of `concurrency`
  for (let batchStart = 0; batchStart < total; batchStart += concurrency) {
    const batchEnd = Math.min(batchStart + concurrency, total);
    const batchSize = batchEnd - batchStart;

    const batchPromises = [];
    for (let i = batchStart; i < batchEnd; i++) {
      batchPromises.push(reclassifyOne(results[i], i, total));
    }

    const batchResults = await Promise.all(batchPromises);

    for (let j = 0; j < batchResults.length; j++) {
      const { result, changed } = batchResults[j];
      reclassified[batchStart + j] = result;
      if (changed) changedCount++;
      doneCount++;
    }

    console.log(`--- Batch done: ${doneCount}/${total} complete, ${changedCount} changed so far ---\n`);
  }

  return reclassified;
}

async function main() {
  const { concurrency, dirs } = parseArgs();

  const results = loadResults(dirs);
  if (results.length === 0) {
    console.error("No results found in specified directories.");
    process.exit(1);
  }

  console.log(`Loaded ${results.length} results from ${dirs.length} dir(s)`);
  console.log(`Re-classifying with LLM detector (concurrency: ${concurrency})...\n`);

  const reclassified = await runParallel(results, concurrency);

  console.log(`\nRe-classification complete. Exporting to dashboard...`);

  const grid = buildGrid(reclassified);
  const exported = exportDashboardData(reclassified, grid);
  console.log(`Dashboard data exported: ${exported}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
