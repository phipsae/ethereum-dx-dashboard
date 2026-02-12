import type { ModelConfig } from "../providers/types.js";
import type { Provider, ProviderResponse } from "../providers/types.js";
import { getProvider } from "../providers/index.js";
import type { Prompt } from "../prompts.js";
import { saveResponse, type RawResponse } from "../storage/response-store.js";
import { delay, getDelay } from "./rate-limiter.js";

const MAX_RETRIES = 3;
const RETRY_DELAYS = [5000, 15000, 30000];

async function sendWithRetry(provider: Provider, prompt: string, modelId: string, webSearch?: boolean): Promise<ProviderResponse> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await provider.send(prompt, modelId, webSearch);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isRetryable = /503|429|overloaded|high demand|rate limit/i.test(message);

      if (!isRetryable || attempt === MAX_RETRIES) throw err;

      const waitMs = RETRY_DELAYS[attempt];
      console.log(`       ↻ Retry ${attempt + 1}/${MAX_RETRIES} in ${waitMs / 1000}s (${message.slice(0, 80)})`);
      await delay(waitMs);
    }
  }
  throw new Error("unreachable");
}

export interface CollectOptions {
  prompts: Prompt[];
  models: ModelConfig[];
  runs: number;
  dryRun: boolean;
  outputDir: string;
  webSearch?: boolean;
}

export async function runCollect(options: CollectOptions): Promise<RawResponse[]> {
  const { prompts, models, runs, dryRun, outputDir, webSearch } = options;
  const totalCalls = prompts.length * models.length * runs;

  if (dryRun) {
    console.log("\n=== DRY RUN (collect) ===\n");
    console.log(`Prompts (${prompts.length}):`);
    for (const p of prompts) {
      console.log(`  - [${p.id}] ${p.text.slice(0, 80)}...`);
    }
    console.log(`\nModels (${models.length}):`);
    for (const m of models) {
      console.log(`  - ${m.displayName} (${m.id}) [${m.tier}]`);
    }
    console.log(`\nRuns: ${runs}`);
    console.log(`Web search: ${webSearch ? "ON" : "OFF"}`);
    console.log(`Total API calls: ${totalCalls}`);
    console.log(`Output: ${outputDir}`);
    return [];
  }

  const responses: RawResponse[] = [];
  let completed = 0;

  // Group models by provider for parallel execution
  const providerGroups = new Map<string, ModelConfig[]>();
  for (const m of models) {
    const group = providerGroups.get(m.provider) ?? [];
    group.push(m);
    providerGroups.set(m.provider, group);
  }

  const providerNames = [...providerGroups.keys()];
  console.log(`\nCollecting responses from ${providerNames.length} providers in parallel: ${providerNames.join(", ")}`);
  console.log(`Total API calls: ${totalCalls}`);
  console.log(`Output: ${outputDir}\n`);

  for (let run = 0; run < runs; run++) {
    const runId = `run-${Date.now()}-${run}`;
    console.log(`--- Run ${run + 1}/${runs} (${runId}) ---\n`);

    const providerTasks = [...providerGroups.entries()].map(
      async ([providerName, providerModels]) => {
        const provider = getProvider(providerName);
        if (!provider) {
          for (const m of providerModels) {
            for (const _p of prompts) {
              completed++;
              console.log(`[${completed}/${totalCalls}] SKIP ${m.displayName} - no API key`);
            }
          }
          return;
        }

        for (const prompt of prompts) {
          for (const model of providerModels) {
            completed++;
            const progress = `[${completed}/${totalCalls}]`;
            console.log(`${progress} ${model.displayName} x "${prompt.id}" ...`);

            try {
              const response = await sendWithRetry(provider, prompt.text, model.id, webSearch);

              const raw: RawResponse = {
                promptId: prompt.id,
                promptText: prompt.text,
                promptCategory: prompt.category,
                model,
                response,
                timestamp: new Date().toISOString(),
                runId,
                webSearch: webSearch ?? false,
              };

              responses.push(raw);
              saveResponse(outputDir, raw);

              console.log(
                `       -> ${response.provider}/${response.model} | ${(response.latencyMs / 1000).toFixed(1)}s | ${response.tokensUsed} tokens`
              );
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err);
              console.error(`       x ERROR: ${message}`);
            }

            await delay(getDelay(model.provider));
          }
        }
      }
    );

    await Promise.all(providerTasks);
  }

  return responses;
}
