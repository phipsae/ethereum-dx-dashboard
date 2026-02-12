import fs from "node:fs";
import path from "node:path";
import type { BenchmarkResult } from "../providers/types.js";

export function createOutputDir(baseDir: string, webSearch?: boolean): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const suffix = webSearch ? "-web-search" : "-standard";
  const dir = path.join(baseDir, `run-${timestamp}${suffix}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function saveResult(outputDir: string, result: BenchmarkResult): void {
  fs.mkdirSync(outputDir, { recursive: true });

  // Save individual result file
  const filename = `${result.runId}_${result.promptId}_${result.model.id}.json`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(result, null, 2));

  // Also append to a combined results file
  const combinedPath = path.join(outputDir, "results.jsonl");
  fs.appendFileSync(combinedPath, JSON.stringify(result) + "\n");
}

export function loadResults(dirs: string[]): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];

  for (const dir of dirs) {
    const resolvedDir = path.resolve(dir);
    if (!fs.existsSync(resolvedDir)) {
      console.warn(`Directory not found: ${resolvedDir}`);
      continue;
    }

    const jsonlPath = path.join(resolvedDir, "results.jsonl");
    if (fs.existsSync(jsonlPath)) {
      const lines = fs.readFileSync(jsonlPath, "utf-8").split("\n").filter(Boolean);
      for (const line of lines) {
        results.push(JSON.parse(line));
      }
      continue;
    }

    // Fallback: read individual JSON files
    const files = fs.readdirSync(resolvedDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const content = fs.readFileSync(path.join(resolvedDir, file), "utf-8");
      results.push(JSON.parse(content));
    }
  }

  return results;
}
