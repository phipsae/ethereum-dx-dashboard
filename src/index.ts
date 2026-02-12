import { getAvailableModels } from "./config.js";
import { PROMPTS } from "./prompts.js";
import { runBenchmark } from "./runner/benchmark-runner.js";
import { createOutputDir, loadResults } from "./storage/json-store.js";
import { buildGrid } from "./reporting/summary-grid.js";
import { printGrid } from "./reporting/console-reporter.js";
import { generateMarkdown, saveMarkdownReport } from "./reporting/markdown-reporter.js";
import { generateHtml, saveHtmlReport } from "./reporting/html-reporter.js";
import { generateCsv, saveCsvReport } from "./reporting/csv-reporter.js";
import { exportDashboardData } from "./reporting/dashboard-exporter.js";

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  const command = args[0] ?? "run";
  const flags: Record<string, string> = {};
  const positional: string[] = [];

  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = "true";
      }
    } else {
      positional.push(args[i]);
    }
  }

  return { command, flags, positional };
}

async function main() {
  const { command, flags, positional } = parseArgs(process.argv);

  if (command === "run") {
    const runs = parseInt(flags.runs ?? "1", 10);
    const dryRun = flags["dry-run"] === "true";
    const webSearch = flags["web-search"] === "true";
    const compare = flags["compare"] === "true";
    const modelFilter = flags.models?.split(",");

    const models = getAvailableModels(modelFilter);

    if (models.length === 0 && !dryRun) {
      console.error(
        "No models available. Set at least one API key in .env:\n" +
          "  ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY"
      );
      process.exit(1);
    }

    // For dry-run, show all configured models even without keys
    const dryRunModels = dryRun && models.length === 0
      ? (await import("./config.js")).MODELS
      : models;

    const effectiveModels = dryRun ? dryRunModels : models;

    // --compare runs both modes (no search, then with search)
    const searchModes: Array<{ label: string; webSearch: boolean }> = compare
      ? [
          { label: "without web search", webSearch: false },
          { label: "with web search", webSearch: true },
        ]
      : [{ label: webSearch ? "with web search" : "without web search", webSearch }];

    const allResults: import("./providers/types.js").BenchmarkResult[] = [];

    for (const mode of searchModes) {
      if (compare) {
        console.log(`\n${"=".repeat(60)}`);
        console.log(`  Running ${mode.label.toUpperCase()}`);
        console.log(`${"=".repeat(60)}`);
      }

      const outputDir = createOutputDir("results", mode.webSearch);

      const results = await runBenchmark({
        prompts: PROMPTS,
        models: effectiveModels,
        runs,
        dryRun,
        outputDir,
        webSearch: mode.webSearch,
      });

      allResults.push(...results);

      if (results.length > 0) {
        const grid = buildGrid(results);
        printGrid(grid);

        const markdown = generateMarkdown(grid, results);
        const reportPath = saveMarkdownReport(outputDir, markdown);
        const html = generateHtml(grid, results);
        const htmlPath = saveHtmlReport(outputDir, html);
        const csv = generateCsv(results);
        const csvPath = saveCsvReport(outputDir, csv);
        const dashboardPath = exportDashboardData(results, grid);
        console.log(`\nResults saved to: ${outputDir}`);
        console.log(`Markdown report: ${reportPath}`);
        console.log(`HTML report: ${htmlPath}`);
        console.log(`CSV report: ${csvPath}`);
        console.log(`Dashboard data: ${dashboardPath}`);
      }
    }
  } else if (command === "report") {
    if (positional.length === 0) {
      console.error("Usage: report <results-dir> [<results-dir> ...]");
      process.exit(1);
    }

    const results = loadResults(positional);
    if (results.length === 0) {
      console.error("No results found in specified directories.");
      process.exit(1);
    }

    console.log(`Loaded ${results.length} results from ${positional.length} dir(s)`);

    const grid = buildGrid(results);
    printGrid(grid);

    const markdown = generateMarkdown(grid, results);
    const reportPath = saveMarkdownReport(positional[0], markdown);
    const html = generateHtml(grid, results);
    const htmlPath = saveHtmlReport(positional[0], html);
    const csv = generateCsv(results);
    const csvPath = saveCsvReport(positional[0], csv);
    console.log(`\nMarkdown report: ${reportPath}`);
    console.log(`HTML report: ${htmlPath}`);
    console.log(`CSV report: ${csvPath}`);
  } else {
    console.log(`Usage:
  npx tsx src/index.ts run                              Full benchmark
  npx tsx src/index.ts run --runs 5                     Multiple runs
  npx tsx src/index.ts run --models claude-opus-4-6,o3  Subset of models
  npx tsx src/index.ts run --dry-run                    Preview what would run
  npx tsx src/index.ts run --web-search                 Enable web search for all providers
  npx tsx src/index.ts run --compare                    Run both with and without web search
  npx tsx src/index.ts report results/run-*             Report from saved data`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
