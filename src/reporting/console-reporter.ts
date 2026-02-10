import type { Grid } from "./summary-grid.js";
import { getCell } from "./summary-grid.js";

function pad(s: string, len: number): string {
  return s.slice(0, len).padEnd(len);
}

export function printGrid(grid: Grid): void {
  const { promptIds, models } = grid;

  // Header
  const promptColWidth = 18;
  const cellWidth = 22;

  const header =
    pad("Prompt", promptColWidth) +
    " | " +
    models.map((m) => pad(m.displayName, cellWidth)).join(" | ");
  const separator = "-".repeat(header.length);

  console.log("\n" + separator);
  console.log("  CHAIN BIAS BENCHMARK RESULTS");
  console.log(separator);
  console.log(header);
  console.log(separator);

  for (const promptId of promptIds) {
    const cells = models.map((m) => {
      const cell = getCell(grid, promptId, m.id);
      if (!cell) return pad("—", cellWidth);

      const chain = cell.chain.slice(0, 10);
      const conf = `${cell.confidence}%`;
      const time = `${(cell.latencyMs / 1000).toFixed(1)}s`;
      return pad(`${chain} ${conf} ${time}`, cellWidth);
    });

    console.log(pad(promptId, promptColWidth) + " | " + cells.join(" | "));
  }

  console.log(separator);

  // Summary row: most common chain per model
  const summaryRow = models.map((m) => {
    const chainCounts: Record<string, number> = {};
    for (const pid of promptIds) {
      const cell = getCell(grid, pid, m.id);
      if (cell) {
        chainCounts[cell.chain] = (chainCounts[cell.chain] ?? 0) + 1;
      }
    }
    const sorted = Object.entries(chainCounts).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return pad("—", cellWidth);
    return pad(`${sorted[0][0]} (${sorted[0][1]}/${promptIds.length})`, cellWidth);
  });

  console.log(pad("DEFAULT CHAIN", promptColWidth) + " | " + summaryRow.join(" | "));
  console.log(separator);

  // Behavior summary
  console.log("\nBehavior Summary:");
  for (const m of models) {
    const behaviors: Record<string, number> = {};
    for (const pid of promptIds) {
      const cell = getCell(grid, pid, m.id);
      if (cell) {
        behaviors[cell.behavior] = (behaviors[cell.behavior] ?? 0) + 1;
      }
    }
    const behaviorStr = Object.entries(behaviors)
      .map(([b, c]) => `${b}: ${c}`)
      .join(", ");
    console.log(`  ${m.displayName}: ${behaviorStr}`);
  }
  console.log();
}
