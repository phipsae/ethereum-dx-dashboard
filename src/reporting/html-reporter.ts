import fs from "node:fs";
import path from "node:path";
import type { BenchmarkResult } from "../providers/types.js";
import type { Grid } from "./summary-grid.js";
import { getCell } from "./summary-grid.js";

const CHAIN_COLORS: Record<string, string> = {
  "Ethereum Ecosystem": "#627eea",
  Solana: "#9945ff",
  Sui: "#4da2ff",
  Aptos: "#2dd8a3",
  Cosmos: "#2e3148",
  Near: "#000000",
  Polkadot: "#e6007a",
  Polygon: "#8247e5",
  Base: "#0052ff",
  Avalanche: "#e84142",
  TON: "#0098ea",
  "Chain-Agnostic": "#888888",
};

const NETWORK_COLORS: Record<string, string> = {
  Mainnet: "#627eea",
  Base: "#0052ff",
  Arbitrum: "#28a0f0",
  Optimism: "#ff0420",
  Polygon: "#8247e5",
  BSC: "#f0b90b",
  Avalanche: "#e84142",
  zkSync: "#8c8dfc",
  Scroll: "#ffeeda",
  Linea: "#61dfff",
  "Ethereum Ecosystem": "#888888",
  "N/A": "#555555",
};

const BEHAVIOR_COLORS: Record<string, string> = {
  "just-built": "#4bc0c0",
  "asked-questions": "#ff6384",
  mixed: "#ffcd56",
};

const TOOL_LABELS = new Set([
  "Hardhat",
  "Foundry/Forge",
  "Truffle",
  "Remix",
  "ethers.js",
  "web3.js",
  "OpenZeppelin",
  "Scaffold-ETH",
  "wagmi",
  "viem",
  "Infura/Alchemy",
  "MetaMask",
  "anchor_lang",
  "@solana/web3.js",
  "Metaplex",
  "Solana CLI",
  "Phantom wallet",
  "Sui Move",
  "Aptos Move",
  "CosmWasm",
  "Cosmos SDK",
  "Tendermint",
  "near-sdk",
  "Substrate",
  "ink!",
]);

const TOOL_COLORS = [
  "#4bc0c0", "#ff6384", "#ffcd56", "#36a2eb", "#9966ff",
  "#ff9f40", "#c9cbcf", "#e94560", "#2dd8a3", "#627eea",
  "#9945ff", "#4da2ff", "#e84142", "#0098ea", "#8247e5",
];

function parseEvidence(evidence: string[]): Array<{ name: string; count: number; weight: number }> {
  const parsed: Array<{ name: string; count: number; weight: number }> = [];
  const re = /^(.+?) \(×(\d+), weight (\d+)\)$/;
  for (const e of evidence) {
    const m = re.exec(e);
    if (m && TOOL_LABELS.has(m[1])) {
      parsed.push({ name: m[1], count: parseInt(m[2], 10), weight: parseInt(m[3], 10) });
    }
  }
  return parsed;
}

function getChainColor(chain: string): string {
  return CHAIN_COLORS[chain] ?? `hsl(${Math.abs(hashCode(chain)) % 360}, 60%, 55%)`;
}

function getNetworkColor(network: string): string {
  return NETWORK_COLORS[network] ?? `hsl(${Math.abs(hashCode(network)) % 360}, 60%, 55%)`;
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

interface ChartData {
  perModelEcosystems: Array<{ model: string; ecosystems: Record<string, number> }>;
  overallEcosystems: Record<string, number>;
  behaviorPerModel: Array<{ model: string; behaviors: Record<string, number> }>;
  completenessPerModel: Array<{ model: string; avg: number }>;
  latencyPerModel: Array<{ model: string; avg: number }>;
  summaryRows: Array<{
    prompt: string;
    cells: Array<{
      ecosystem: string;
      network: string;
      strength: string;
      latency: string;
      behavior: string;
      completeness: number;
    } | null>;
  }>;
  defaultEcosystemRows: Array<{
    model: string;
    tier: string;
    defaultEcosystem: string;
    timesChosen: string;
  }>;
  modelHeaders: string[];
  toolFrequencyOverall: Record<string, number>;
  toolFrequencyPerModel: Array<{ model: string; tools: Record<string, number> }>;
  networkPerModel: Array<{ model: string; networks: Record<string, number> }>;
  overallNetworks: Record<string, number>;
}

function extractChartData(grid: Grid, results: BenchmarkResult[]): ChartData {
  const { promptIds, models } = grid;

  const perModelEcosystems: ChartData["perModelEcosystems"] = [];
  const overallEcosystems: Record<string, number> = {};
  const behaviorPerModel: ChartData["behaviorPerModel"] = [];
  const completenessPerModel: ChartData["completenessPerModel"] = [];
  const latencyPerModel: ChartData["latencyPerModel"] = [];
  const networkPerModel: ChartData["networkPerModel"] = [];
  const overallNetworks: Record<string, number> = {};

  for (const m of models) {
    const ecosystems: Record<string, number> = {};
    const behaviors: Record<string, number> = {};
    const networks: Record<string, number> = {};
    let totalCompleteness = 0;
    let totalLatency = 0;
    let count = 0;

    for (const pid of promptIds) {
      const cell = getCell(grid, pid, m.id);
      if (!cell) continue;

      // Ecosystem counts (use aggregated if available)
      if (cell.ecosystemCounts) {
        for (const [eco, cnt] of Object.entries(cell.ecosystemCounts)) {
          ecosystems[eco] = (ecosystems[eco] ?? 0) + cnt;
          overallEcosystems[eco] = (overallEcosystems[eco] ?? 0) + cnt;
        }
      } else {
        ecosystems[cell.ecosystem] = (ecosystems[cell.ecosystem] ?? 0) + 1;
        overallEcosystems[cell.ecosystem] = (overallEcosystems[cell.ecosystem] ?? 0) + 1;
      }

      // Network counts
      if (cell.networkCounts) {
        for (const [net, cnt] of Object.entries(cell.networkCounts)) {
          networks[net] = (networks[net] ?? 0) + cnt;
          overallNetworks[net] = (overallNetworks[net] ?? 0) + cnt;
        }
      }

      behaviors[cell.behavior] = (behaviors[cell.behavior] ?? 0) + 1;
      totalCompleteness += cell.completeness;
      totalLatency += cell.latencyMs;
      count++;
    }

    perModelEcosystems.push({ model: m.displayName, ecosystems });
    networkPerModel.push({ model: m.displayName, networks });
    behaviorPerModel.push({ model: m.displayName, behaviors });
    completenessPerModel.push({
      model: m.displayName,
      avg: count > 0 ? Math.round(totalCompleteness / count) : 0,
    });
    latencyPerModel.push({
      model: m.displayName,
      avg: count > 0 ? Math.round(totalLatency / count) : 0,
    });
  }

  // Summary table rows
  const summaryRows: ChartData["summaryRows"] = [];
  for (const pid of promptIds) {
    const cells = models.map((m) => {
      const cell = getCell(grid, pid, m.id);
      if (!cell) return null;
      return {
        ecosystem: cell.ecosystem,
        network: cell.network,
        strength: cell.strength,
        latency: (cell.latencyMs / 1000).toFixed(1),
        behavior: cell.behavior,
        completeness: cell.completeness,
      };
    });
    summaryRows.push({ prompt: pid, cells });
  }

  // Default ecosystem rows
  const defaultEcosystemRows: ChartData["defaultEcosystemRows"] = [];
  for (const m of models) {
    const ecoCounts: Record<string, number> = {};
    for (const pid of promptIds) {
      const cell = getCell(grid, pid, m.id);
      if (cell) {
        ecoCounts[cell.ecosystem] = (ecoCounts[cell.ecosystem] ?? 0) + 1;
      }
    }
    const sorted = Object.entries(ecoCounts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      defaultEcosystemRows.push({
        model: m.displayName,
        tier: m.tier,
        defaultEcosystem: sorted[0][0],
        timesChosen: `${sorted[0][1]}/${promptIds.length}`,
      });
    }
  }

  const modelHeaders = models.map((m) => `${m.displayName} (${m.tier})`);

  // Tool/framework frequency from individual results
  const toolFrequencyOverall: Record<string, number> = {};
  const toolFrequencyPerModelMap: Record<string, Record<string, number>> = {};

  for (const r of results) {
    const tools = parseEvidence(r.analysis.detection.evidence);
    const modelName = r.model.displayName;
    if (!toolFrequencyPerModelMap[modelName]) {
      toolFrequencyPerModelMap[modelName] = {};
    }
    for (const t of tools) {
      toolFrequencyOverall[t.name] = (toolFrequencyOverall[t.name] ?? 0) + t.count;
      toolFrequencyPerModelMap[modelName][t.name] =
        (toolFrequencyPerModelMap[modelName][t.name] ?? 0) + t.count;
    }
  }

  const toolFrequencyPerModel = models.map((m) => ({
    model: m.displayName,
    tools: toolFrequencyPerModelMap[m.displayName] ?? {},
  }));

  return {
    perModelEcosystems,
    overallEcosystems,
    behaviorPerModel,
    completenessPerModel,
    latencyPerModel,
    summaryRows,
    defaultEcosystemRows,
    modelHeaders,
    toolFrequencyOverall,
    toolFrequencyPerModel,
    networkPerModel,
    overallNetworks,
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function generateHtml(grid: Grid, results: BenchmarkResult[]): string {
  const data = extractChartData(grid, results);

  // Build all unique ecosystems for consistent coloring
  const allEcosystems = new Set<string>();
  for (const entry of data.perModelEcosystems) {
    for (const eco of Object.keys(entry.ecosystems)) allEcosystems.add(eco);
  }
  for (const eco of Object.keys(data.overallEcosystems)) allEcosystems.add(eco);

  const chainColorMap: Record<string, string> = {};
  for (const eco of allEcosystems) {
    chainColorMap[eco] = getChainColor(eco);
  }

  // Build network color map
  const allNetworks = new Set<string>();
  for (const entry of data.networkPerModel) {
    for (const net of Object.keys(entry.networks)) allNetworks.add(net);
  }
  for (const net of Object.keys(data.overallNetworks)) allNetworks.add(net);

  const networkColorMap: Record<string, string> = {};
  for (const net of allNetworks) {
    networkColorMap[net] = getNetworkColor(net);
  }

  const hasNetworkData = Object.keys(data.overallNetworks).some(
    (n) => n !== "Ethereum Ecosystem" && data.overallNetworks[n] > 0
  );

  // Build the summary table HTML
  const tableHeaderCells = data.modelHeaders.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
  const tableRows = data.summaryRows
    .map((row) => {
      const cells = row.cells
        .map((c) => {
          if (!c) return "<td>—</td>";
          const netBadge = c.network && c.network !== "Ethereum Ecosystem" && c.network !== "Chain-Agnostic"
            ? ` <span style="color:${escapeHtml(getNetworkColor(c.network))}">→ ${escapeHtml(c.network)}</span>` : "";
          return `<td><strong>${escapeHtml(c.ecosystem)}</strong>${netBadge} [${escapeHtml(c.strength)}]<br><span class="detail">${c.latency}s</span></td>`;
        })
        .join("");
      return `<tr><td class="prompt-cell">${escapeHtml(row.prompt)}</td>${cells}</tr>`;
    })
    .join("\n");

  const defaultEcosystemTableRows = data.defaultEcosystemRows
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.model)}</td><td>${escapeHtml(r.tier)}</td><td><strong>${escapeHtml(r.defaultEcosystem)}</strong></td><td>${escapeHtml(r.timesChosen)}</td></tr>`
    )
    .join("\n");

  // Number of per-model pie charts to determine grid layout
  const pieCount = data.perModelEcosystems.length;
  const pieCols = pieCount <= 2 ? pieCount : pieCount <= 4 ? 2 : 3;

  // Tool chart dimensions
  const toolCount = Object.keys(data.toolFrequencyOverall).length;
  const toolChartHeight = Math.max(300, toolCount * 28);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chain Bias Benchmark Report</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
  :root {
    --bg: #1a1a2e;
    --surface: #16213e;
    --border: #0f3460;
    --text: #e0e0e0;
    --text-muted: #a0a0b0;
    --accent: #e94560;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    padding: 2rem;
    line-height: 1.6;
  }
  h1 {
    font-size: 1.8rem;
    margin-bottom: 0.25rem;
    color: #fff;
  }
  .subtitle {
    color: var(--text-muted);
    margin-bottom: 2rem;
    font-size: 0.9rem;
  }
  h2 {
    font-size: 1.3rem;
    margin: 2rem 0 1rem;
    color: #fff;
    border-bottom: 2px solid var(--border);
    padding-bottom: 0.4rem;
  }
  .chart-grid {
    display: grid;
    grid-template-columns: repeat(${pieCols}, 1fr);
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }
  .chart-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem;
  }
  .chart-card h3 {
    font-size: 0.95rem;
    text-align: center;
    margin-bottom: 0.5rem;
    color: var(--text-muted);
  }
  .chart-card canvas {
    max-height: 280px;
  }
  .chart-wide {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
  .chart-wide h3 {
    font-size: 0.95rem;
    text-align: center;
    margin-bottom: 0.5rem;
    color: var(--text-muted);
  }
  .chart-wide canvas {
    max-height: 350px;
  }
  .bar-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    background: var(--surface);
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 1.5rem;
  }
  th, td {
    padding: 0.6rem 0.8rem;
    text-align: left;
    border-bottom: 1px solid var(--border);
    font-size: 0.85rem;
  }
  th {
    background: var(--border);
    color: #fff;
    font-weight: 600;
  }
  td strong {
    color: #fff;
  }
  .prompt-cell {
    font-family: monospace;
    white-space: nowrap;
    color: var(--accent);
  }
  .detail {
    color: var(--text-muted);
    font-size: 0.78rem;
  }
  @media (max-width: 800px) {
    .chart-grid { grid-template-columns: 1fr; }
    .bar-row { grid-template-columns: 1fr; }
    body { padding: 1rem; }
  }
</style>
</head>
<body>

<h1>Chain Bias Benchmark Report</h1>
<p class="subtitle">Generated: ${new Date().toISOString()} &middot; ${results.length} results</p>

<h2>Prompts Used</h2>
<table>
  <thead><tr><th>#</th><th>ID</th><th>Category</th><th>Prompt</th></tr></thead>
  <tbody>${grid.promptIds.map((pid, i) => {
    const cat = grid.promptCategories.get(pid) ?? "—";
    const text = grid.promptTexts.get(pid) ?? "—";
    return `<tr><td>${i + 1}</td><td class="prompt-cell">${escapeHtml(pid)}</td><td>${escapeHtml(cat)}</td><td>${escapeHtml(text)}</td></tr>`;
  }).join("\n")}</tbody>
</table>

<h2>Chain Distribution (Overall)</h2>
<div class="chart-wide">
  <canvas id="overallPie"></canvas>
</div>

<h2>Chain Distribution (Per Model)</h2>
<div class="chart-grid">
${data.perModelEcosystems.map((_, i) => `  <div class="chart-card"><h3>${escapeHtml(data.perModelEcosystems[i].model)}</h3><canvas id="modelPie${i}"></canvas></div>`).join("\n")}
</div>

${hasNetworkData ? `<h2>EVM Network Distribution (Overall)</h2>
<div class="chart-wide">
  <canvas id="networkOverallPie"></canvas>
</div>

<h2>EVM Network Distribution (Per Model)</h2>
<div class="chart-wide">
  <canvas id="networkPerModelChart"></canvas>
</div>` : '<!-- No EVM network data -->'}

${toolCount > 0 ? `<h2>Tool/Framework Frequency (Overall)</h2>
<div class="chart-wide" style="height: ${toolChartHeight}px;">
  <canvas id="toolOverallChart"></canvas>
</div>

<h2>Tool/Framework Frequency (Per Model)</h2>
<div class="chart-wide" style="height: ${toolChartHeight + 40}px;">
  <canvas id="toolPerModelChart"></canvas>
</div>` : '<!-- No tool data detected -->'}

<div class="chart-wide">
  <h3>Average Latency (seconds)</h3>
  <canvas id="latencyChart"></canvas>
</div>

<h2>Results Grid</h2>
<table>
  <thead><tr><th>Prompt</th>${tableHeaderCells}</tr></thead>
  <tbody>${tableRows}</tbody>
</table>

<h2>Default Ecosystem Summary</h2>
<table>
  <thead><tr><th>Model</th><th>Tier</th><th>Default Ecosystem</th><th>Times Chosen</th></tr></thead>
  <tbody>${defaultEcosystemTableRows}</tbody>
</table>

${(() => {
  const categories = [...new Set([...grid.promptCategories.values()])];
  if (categories.length <= 1) return "<!-- No category breakdown -->";
  const { promptIds: pids, models: mods } = grid;
  const modelNames = mods.map((m) => m.displayName);
  const headerCells = modelNames.map((n) => `<th>${escapeHtml(n)}</th>`).join("");
  const rows = categories.map((cat) => {
    const catPrompts = pids.filter((pid) => grid.promptCategories.get(pid) === cat);
    const cells = mods.map((m) => {
      const chains: Record<string, number> = {};
      for (const pid of catPrompts) {
        const cell = getCell(grid, pid, m.id);
        if (cell) chains[cell.ecosystem] = (chains[cell.ecosystem] ?? 0) + 1;
      }
      const sorted = Object.entries(chains).sort((a, b) => b[1] - a[1]);
      if (sorted.length === 0) return "<td>—</td>";
      return `<td>${sorted.map(([c, n]) => `<strong>${escapeHtml(c)}</strong> (${n})`).join(", ")}</td>`;
    }).join("");
    return `<tr><td>${escapeHtml(cat)}</td>${cells}</tr>`;
  }).join("\n");
  return `<h2>Ecosystem Choice by Category</h2>
<table>
  <thead><tr><th>Category</th>${headerCells}</tr></thead>
  <tbody>${rows}</tbody>
</table>`;
})()}

<script>
const chartData = ${JSON.stringify({
    perModelEcosystems: data.perModelEcosystems,
    overallEcosystems: data.overallEcosystems,
    behaviorPerModel: data.behaviorPerModel,
    completenessPerModel: data.completenessPerModel,
    latencyPerModel: data.latencyPerModel,
    chainColorMap,
    behaviorColors: BEHAVIOR_COLORS,
    toolFrequencyOverall: data.toolFrequencyOverall,
    toolFrequencyPerModel: data.toolFrequencyPerModel,
    toolColors: TOOL_COLORS,
    networkPerModel: data.networkPerModel,
    overallNetworks: data.overallNetworks,
    networkColorMap,
  })};

Chart.defaults.color = '#a0a0b0';
Chart.defaults.borderColor = '#0f3460';

// Overall pie chart
{
  const labels = Object.keys(chartData.overallEcosystems);
  const values = Object.values(chartData.overallEcosystems);
  const colors = labels.map(l => chartData.chainColorMap[l] || '#888');
  new Chart(document.getElementById('overallPie'), {
    type: 'pie',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors, borderWidth: 1, borderColor: '#1a1a2e' }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'right' },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((ctx.parsed / total) * 100).toFixed(1);
              return ctx.label + ': ' + ctx.parsed + ' (' + pct + '%)';
            }
          }
        }
      }
    }
  });
}

// Per-model pie charts
chartData.perModelEcosystems.forEach((entry, i) => {
  const labels = Object.keys(entry.ecosystems);
  const values = Object.values(entry.ecosystems);
  const colors = labels.map(l => chartData.chainColorMap[l] || '#888');
  new Chart(document.getElementById('modelPie' + i), {
    type: 'pie',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors, borderWidth: 1, borderColor: '#16213e' }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8, font: { size: 11 } } }
      }
    }
  });
});

// Latency bar chart
{
  const models = chartData.latencyPerModel.map(e => e.model);
  const values = chartData.latencyPerModel.map(e => +(e.avg / 1000).toFixed(1));
  new Chart(document.getElementById('latencyChart'), {
    type: 'bar',
    data: {
      labels: models,
      datasets: [{
        label: 'Avg Latency',
        data: values,
        backgroundColor: '#ff6384',
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Seconds' } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

// Tool/Framework frequency charts
if (Object.keys(chartData.toolFrequencyOverall).length > 0) {
  // Overall tool frequency (horizontal bar)
  {
    const sorted = Object.entries(chartData.toolFrequencyOverall).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(e => e[0]);
    const values = sorted.map(e => e[1]);
    const colors = labels.map((_, i) => chartData.toolColors[i % chartData.toolColors.length]);
    new Chart(document.getElementById('toolOverallChart'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Mentions',
          data: values,
          backgroundColor: colors,
          borderRadius: 4,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { beginAtZero: true, title: { display: true, text: 'Total mentions' } },
          y: { ticks: { font: { size: 12 } } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // Per-model tool frequency (grouped horizontal bar)
  {
    const allTools = [...new Set(chartData.toolFrequencyPerModel.flatMap(e => Object.keys(e.tools)))];
    const sortedTools = allTools.sort((a, b) =>
      (chartData.toolFrequencyOverall[b] || 0) - (chartData.toolFrequencyOverall[a] || 0)
    );
    const datasets = chartData.toolFrequencyPerModel.map((entry, i) => ({
      label: entry.model,
      data: sortedTools.map(t => entry.tools[t] || 0),
      backgroundColor: chartData.toolColors[i % chartData.toolColors.length],
      borderRadius: 4,
    }));
    new Chart(document.getElementById('toolPerModelChart'), {
      type: 'bar',
      data: { labels: sortedTools, datasets },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { beginAtZero: true, title: { display: true, text: 'Mentions' } },
          y: { ticks: { font: { size: 12 } } }
        },
        plugins: { legend: { position: 'top' } }
      }
    });
  }
}

// EVM Network charts
if (chartData.overallNetworks && Object.keys(chartData.overallNetworks).some(n => n !== 'Ethereum Ecosystem' && chartData.overallNetworks[n] > 0)) {
  // Overall network pie
  {
    const labels = Object.keys(chartData.overallNetworks);
    const values = Object.values(chartData.overallNetworks);
    const colors = labels.map(l => chartData.networkColorMap[l] || '#888');
    new Chart(document.getElementById('networkOverallPie'), {
      type: 'pie',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: colors, borderWidth: 1, borderColor: '#1a1a2e' }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right' },
          tooltip: {
            callbacks: {
              label: ctx => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                return ctx.label + ': ' + ctx.parsed + ' (' + pct + '%)';
              }
            }
          }
        }
      }
    });
  }

  // Per-model network stacked bar
  {
    const models = chartData.networkPerModel.map(e => e.model);
    const allNets = [...new Set(chartData.networkPerModel.flatMap(e => Object.keys(e.networks)))];
    const datasets = allNets.map(net => ({
      label: net,
      data: chartData.networkPerModel.map(e => e.networks[net] || 0),
      backgroundColor: chartData.networkColorMap[net] || '#888',
    }));
    new Chart(document.getElementById('networkPerModelChart'), {
      type: 'bar',
      data: { labels: models, datasets },
      options: {
        responsive: true,
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Prompts' } }
        },
        plugins: { legend: { position: 'top' } }
      }
    });
  }
}
</script>
</body>
</html>`;
}

export function saveHtmlReport(outputDir: string, html: string): string {
  const filepath = path.join(outputDir, "report.html");
  fs.writeFileSync(filepath, html);
  return filepath;
}
