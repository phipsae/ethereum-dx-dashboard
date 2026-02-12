import { loadResults } from "./storage/json-store.js";
import { buildGrid } from "./reporting/summary-grid.js";
import { exportDashboardData } from "./reporting/dashboard-exporter.js";

// Combine only the two full 72-result runs
const dirs = [
  "results/run-2026-02-10T21-00-03-standard",
  "results/run-2026-02-10T21-19-48-standard",
];

const allResults = loadResults(dirs);
console.log(`Loaded ${allResults.length} results from ${dirs.length} dirs`);

const grid = buildGrid(allResults);
const exported = exportDashboardData(allResults, grid);
console.log(`Exported combined data: ${exported}`);
