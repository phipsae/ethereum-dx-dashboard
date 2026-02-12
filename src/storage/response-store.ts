import fs from "node:fs";
import path from "node:path";
import type { ModelConfig, ProviderResponse } from "../providers/types.js";

export interface RawResponse {
  promptId: string;
  promptText: string;
  promptCategory: string;
  model: ModelConfig;
  response: ProviderResponse;
  timestamp: string;
  runId: string;
  webSearch: boolean;
}

export function createResponseDir(baseDir: string, webSearch?: boolean): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const suffix = webSearch ? "-web-search" : "-standard";
  const dir = path.join(baseDir, `run-${timestamp}${suffix}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function saveResponse(outputDir: string, response: RawResponse): void {
  fs.mkdirSync(outputDir, { recursive: true });

  // Save individual response file
  const filename = `${response.runId}_${response.promptId}_${response.model.id}.json`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(response, null, 2));

  // Also append to a combined file
  const combinedPath = path.join(outputDir, "responses.jsonl");
  fs.appendFileSync(combinedPath, JSON.stringify(response) + "\n");
}

export function loadResponses(dirs: string[]): RawResponse[] {
  const responses: RawResponse[] = [];

  for (const dir of dirs) {
    const resolvedDir = path.resolve(dir);
    if (!fs.existsSync(resolvedDir)) {
      console.warn(`Directory not found: ${resolvedDir}`);
      continue;
    }

    const jsonlPath = path.join(resolvedDir, "responses.jsonl");
    if (fs.existsSync(jsonlPath)) {
      const lines = fs.readFileSync(jsonlPath, "utf-8").split("\n").filter(Boolean);
      for (const line of lines) {
        responses.push(JSON.parse(line));
      }
      continue;
    }

    // Fallback: read individual JSON files (skip non-response files)
    const files = fs.readdirSync(resolvedDir).filter(
      (f) => f.endsWith(".json") && f !== "responses.jsonl"
    );
    for (const file of files) {
      const content = fs.readFileSync(path.join(resolvedDir, file), "utf-8");
      const parsed = JSON.parse(content);
      // Only include files that look like RawResponse (have response.content and no analysis)
      if (parsed.response?.content && !parsed.analysis) {
        responses.push(parsed);
      }
    }
  }

  return responses;
}

/**
 * Load either RawResponse files or BenchmarkResult files, extracting the fields
 * needed for classification. This allows classify commands to work on both
 * new responses/ dirs and existing results/ dirs.
 */
export function loadResponsesOrResults(dirs: string[]): RawResponse[] {
  const responses: RawResponse[] = [];

  for (const dir of dirs) {
    const resolvedDir = path.resolve(dir);
    if (!fs.existsSync(resolvedDir)) {
      console.warn(`Directory not found: ${resolvedDir}`);
      continue;
    }

    // Try responses.jsonl first (new format)
    const responsesJsonl = path.join(resolvedDir, "responses.jsonl");
    if (fs.existsSync(responsesJsonl)) {
      const lines = fs.readFileSync(responsesJsonl, "utf-8").split("\n").filter(Boolean);
      for (const line of lines) {
        responses.push(JSON.parse(line));
      }
      continue;
    }

    // Try results.jsonl (old format - BenchmarkResult)
    const resultsJsonl = path.join(resolvedDir, "results.jsonl");
    if (fs.existsSync(resultsJsonl)) {
      const lines = fs.readFileSync(resultsJsonl, "utf-8").split("\n").filter(Boolean);
      for (const line of lines) {
        const r = JSON.parse(line);
        responses.push({
          promptId: r.promptId,
          promptText: r.promptText,
          promptCategory: r.promptCategory,
          model: r.model,
          response: r.response,
          timestamp: r.timestamp,
          runId: r.runId,
          webSearch: r.webSearch ?? false,
        });
      }
      continue;
    }

    // Fallback: individual JSON files
    const files = fs.readdirSync(resolvedDir).filter(
      (f) => f.endsWith(".json") && !f.startsWith(".")
    );
    for (const file of files) {
      const content = fs.readFileSync(path.join(resolvedDir, file), "utf-8");
      const r = JSON.parse(content);
      if (!r.response?.content) continue;
      responses.push({
        promptId: r.promptId,
        promptText: r.promptText,
        promptCategory: r.promptCategory,
        model: r.model,
        response: r.response,
        timestamp: r.timestamp,
        runId: r.runId,
        webSearch: r.webSearch ?? false,
      });
    }
  }

  return responses;
}
