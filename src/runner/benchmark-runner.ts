import { analyzeResponse } from "../analysis/analyzer.js";
import type { ModelConfig, BenchmarkResult } from "../providers/types.js";
import { getProvider } from "../providers/index.js";
import type { Prompt } from "../prompts.js";
import { saveResult } from "../storage/json-store.js";
import { delay, getDelay } from "./rate-limiter.js";

export interface RunOptions {
  prompts: Prompt[];
  models: ModelConfig[];
  runs: number;
  dryRun: boolean;
  outputDir: string;
}

export async function runBenchmark(options: RunOptions): Promise<BenchmarkResult[]> {
  const { prompts, models, runs, dryRun, outputDir } = options;
  const totalCalls = prompts.length * models.length * runs;

  if (dryRun) {
    console.log("\n=== DRY RUN ===\n");
    console.log(`Prompts (${prompts.length}):`);
    for (const p of prompts) {
      console.log(`  - [${p.id}] ${p.text.slice(0, 80)}...`);
    }
    console.log(`\nModels (${models.length}):`);
    for (const m of models) {
      console.log(`  - ${m.displayName} (${m.id}) [${m.tier}]`);
    }
    console.log(`\nRuns: ${runs}`);
    console.log(`Total API calls: ${totalCalls}`);
    console.log(`Estimated cost: $${(totalCalls * 0.15).toFixed(2)} - $${(totalCalls * 0.30).toFixed(2)}`);
    return [];
  }

  const results: BenchmarkResult[] = [];
  let completed = 0;

  for (let run = 0; run < runs; run++) {
    const runId = `run-${Date.now()}-${run}`;
    console.log(`\n--- Run ${run + 1}/${runs} (${runId}) ---\n`);

    for (const prompt of prompts) {
      for (const model of models) {
        completed++;
        const progress = `[${completed}/${totalCalls}]`;

        const provider = getProvider(model.provider);
        if (!provider) {
          console.log(`${progress} SKIP ${model.displayName} — no API key`);
          continue;
        }

        console.log(`${progress} ${model.displayName} × "${prompt.id}" ...`);

        try {
          const response = await provider.send(prompt.text, model.id);
          const analysis = analyzeResponse(response.content);

          const result: BenchmarkResult = {
            promptId: prompt.id,
            promptText: prompt.text,
            model,
            response,
            analysis,
            timestamp: new Date().toISOString(),
            runId,
          };

          results.push(result);
          saveResult(outputDir, result);

          console.log(
            `       → ${analysis.chain.chain} (${analysis.chain.confidence}% confidence) | ` +
            `${analysis.behavior.behavior} | ` +
            `completeness: ${analysis.completeness.score} | ` +
            `${(response.latencyMs / 1000).toFixed(1)}s`
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`       ✗ ERROR: ${message}`);
        }

        // Rate limit delay between calls to the same provider
        await delay(getDelay(model.provider));
      }
    }
  }

  return results;
}
