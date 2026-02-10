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

  // Prompts used
  lines.push("## Prompts");
  lines.push("");
  lines.push("| # | ID | Category | Prompt |");
  lines.push("| --- | --- | --- | --- |");
  for (let i = 0; i < promptIds.length; i++) {
    const pid = promptIds[i];
    const cat = grid.promptCategories.get(pid) ?? "—";
    const text = grid.promptTexts.get(pid) ?? "—";
    lines.push(`| ${i + 1} | ${pid} | ${cat} | ${text} |`);
  }
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
      const net = cell.network && cell.network !== "N/A" && cell.network !== "Unspecified"
        ? ` → ${cell.network}` : "";
      return `**${cell.chain}${net}** (${cell.confidence}%) ${(cell.latencyMs / 1000).toFixed(1)}s`;
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

  // EVM Network Summary
  const hasNetworkData = models.some((m) =>
    promptIds.some((pid) => {
      const cell = getCell(grid, pid, m.id);
      return cell?.network && cell.network !== "N/A" && cell.network !== "Unspecified";
    })
  );

  if (hasNetworkData) {
    lines.push("## EVM Network Summary");
    lines.push("");

    // Collect all networks across all models
    const allNetworks = new Set<string>();
    for (const m of models) {
      for (const pid of promptIds) {
        const cell = getCell(grid, pid, m.id);
        if (cell?.networkCounts) {
          for (const net of Object.keys(cell.networkCounts)) {
            if (net !== "N/A") allNetworks.add(net);
          }
        }
      }
    }
    const networkList = [...allNetworks].sort();

    lines.push(`| Model | ${networkList.join(" | ")} |`);
    lines.push(`| --- | ${networkList.map(() => "---").join(" | ")} |`);

    for (const m of models) {
      const counts: Record<string, number> = {};
      for (const pid of promptIds) {
        const cell = getCell(grid, pid, m.id);
        if (cell?.networkCounts) {
          for (const [net, cnt] of Object.entries(cell.networkCounts)) {
            if (net !== "N/A") {
              counts[net] = (counts[net] ?? 0) + cnt;
            }
          }
        }
      }
      const row = networkList.map((net) => String(counts[net] ?? 0));
      lines.push(`| ${m.displayName} | ${row.join(" | ")} |`);
    }
    lines.push("");
  }

  // Chain choice by category
  const categories = [...new Set([...grid.promptCategories.values()])];
  if (categories.length > 1) {
    lines.push("## Chain Choice by Category");
    lines.push("");
    lines.push(`| Category | ${models.map((m) => m.displayName).join(" | ")} |`);
    lines.push(`| --- | ${models.map(() => "---").join(" | ")} |`);

    for (const cat of categories) {
      const catPrompts = promptIds.filter((pid) => grid.promptCategories.get(pid) === cat);
      const row = models.map((m) => {
        const chains: Record<string, number> = {};
        for (const pid of catPrompts) {
          const cell = getCell(grid, pid, m.id);
          if (cell) {
            chains[cell.chain] = (chains[cell.chain] ?? 0) + 1;
          }
        }
        const sorted = Object.entries(chains).sort((a, b) => b[1] - a[1]);
        if (sorted.length === 0) return "—";
        return sorted.map(([c, n]) => `${c} (${n})`).join(", ");
      });
      lines.push(`| ${cat} | ${row.join(" | ")} |`);
    }
    lines.push("");
  }

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
