import fs from "node:fs";
import path from "node:path";
import type { BenchmarkResult } from "../providers/types.js";
import type { Grid } from "./summary-grid.js";
import { getCell } from "./summary-grid.js";

export function generateMarkdown(grid: Grid, results: BenchmarkResult[]): string {
  const { promptIds, models } = grid;
  const lines: string[] = [];

  lines.push("# Chain Bias Benchmark Results");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Total results: ${results.length}`);
  lines.push("");

  // Main grid table
  lines.push("## Results Grid");
  lines.push("");

  // Header
  const modelHeaders = models.map((m) => `${m.displayName} (${m.tier})`);
  lines.push(`| Prompt | ${modelHeaders.join(" | ")} |`);
  lines.push(`| --- | ${models.map(() => "---").join(" | ")} |`);

  // Rows
  for (const promptId of promptIds) {
    const cells = models.map((m) => {
      const cell = getCell(grid, promptId, m.id);
      if (!cell) return "—";
      return `**${cell.chain}** (${cell.confidence}%) ${(cell.latencyMs / 1000).toFixed(1)}s`;
    });
    lines.push(`| ${promptId} | ${cells.join(" | ")} |`);
  }
  lines.push("");

  // Behavior grid
  lines.push("## Behavior Grid");
  lines.push("");
  lines.push(`| Prompt | ${modelHeaders.join(" | ")} |`);
  lines.push(`| --- | ${models.map(() => "---").join(" | ")} |`);

  for (const promptId of promptIds) {
    const cells = models.map((m) => {
      const cell = getCell(grid, promptId, m.id);
      if (!cell) return "—";
      return `${cell.behavior} (score: ${cell.completeness})`;
    });
    lines.push(`| ${promptId} | ${cells.join(" | ")} |`);
  }
  lines.push("");

  // Chain summary per model
  lines.push("## Default Chain Summary");
  lines.push("");
  lines.push("| Model | Tier | Default Chain | Times Chosen |");
  lines.push("| --- | --- | --- | --- |");

  for (const m of models) {
    const chainCounts: Record<string, number> = {};
    for (const pid of promptIds) {
      const cell = getCell(grid, pid, m.id);
      if (cell) {
        chainCounts[cell.chain] = (chainCounts[cell.chain] ?? 0) + 1;
      }
    }
    const sorted = Object.entries(chainCounts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      lines.push(
        `| ${m.displayName} | ${m.tier} | **${sorted[0][0]}** | ${sorted[0][1]}/${promptIds.length} |`
      );
    }
  }
  lines.push("");

  // Provider comparison
  lines.push("## Provider Comparison (Flagship vs Mid-tier)");
  lines.push("");

  const providers = [...new Set(models.map((m) => m.provider))];
  for (const provider of providers) {
    const providerModels = models.filter((m) => m.provider === provider);
    lines.push(`### ${provider}`);
    lines.push("");
    for (const m of providerModels) {
      const chains: string[] = [];
      for (const pid of promptIds) {
        const cell = getCell(grid, pid, m.id);
        if (cell) chains.push(cell.chain);
      }
      lines.push(`- **${m.displayName}** (${m.tier}): ${chains.join(", ")}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function saveMarkdownReport(outputDir: string, markdown: string): string {
  const filepath = path.join(outputDir, "report.md");
  fs.writeFileSync(filepath, markdown);
  return filepath;
}
