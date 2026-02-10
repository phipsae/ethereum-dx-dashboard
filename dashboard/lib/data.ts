import type { DashboardRunData, RunIndexEntry, SerializedGridCell } from "./types";
import { TOOL_LABELS } from "./types";

const DATA_BASE = "/data";

// Compat helpers for old JSON data that used `chain`/`chainCounts`
function cellEcosystem(cell: SerializedGridCell): string {
  return cell.ecosystem ?? cell.chain ?? "Unknown";
}
function cellEcosystemCounts(cell: SerializedGridCell): Record<string, number> {
  return cell.ecosystemCounts ?? cell.chainCounts ?? { [cellEcosystem(cell)]: 1 };
}

export async function fetchRunsIndex(): Promise<RunIndexEntry[]> {
  try {
    const res = await fetch(`${DATA_BASE}/runs.json`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchRun(filename: string): Promise<DashboardRunData | null> {
  try {
    const res = await fetch(`${DATA_BASE}/${filename}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Aggregate helpers — pure functions, safe for client and server
export function computeOverallEcosystems(data: DashboardRunData): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const cell of Object.values(data.grid.cells)) {
    for (const [eco, cnt] of Object.entries(cellEcosystemCounts(cell))) {
      counts[eco] = (counts[eco] ?? 0) + cnt;
    }
  }
  return counts;
}

export function computePerModelEcosystems(
  data: DashboardRunData
): Array<{ model: string; ecosystems: Record<string, number> }> {
  return data.grid.models.map((m) => {
    const ecosystems: Record<string, number> = {};
    for (const pid of data.grid.promptIds) {
      const cell = data.grid.cells[`${pid}::${m.id}`];
      if (!cell) continue;
      for (const [eco, cnt] of Object.entries(cellEcosystemCounts(cell))) {
        ecosystems[eco] = (ecosystems[eco] ?? 0) + cnt;
      }
    }
    return { model: m.displayName, ecosystems };
  });
}

export function computeOverallNetworks(data: DashboardRunData): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const cell of Object.values(data.grid.cells)) {
    if (cellEcosystem(cell) !== "Ethereum Ecosystem") continue;
    for (const [net, cnt] of Object.entries(cell.networkCounts ?? {})) {
      counts[net] = (counts[net] ?? 0) + cnt;
    }
  }
  return counts;
}

export function computePerModelNetworks(
  data: DashboardRunData
): Array<{ model: string; networks: Record<string, number> }> {
  return data.grid.models.map((m) => {
    const networks: Record<string, number> = {};
    for (const pid of data.grid.promptIds) {
      const cell = data.grid.cells[`${pid}::${m.id}`];
      if (!cell || cellEcosystem(cell) !== "Ethereum Ecosystem") continue;
      for (const [net, cnt] of Object.entries(cell.networkCounts ?? {})) {
        networks[net] = (networks[net] ?? 0) + cnt;
      }
    }
    return { model: m.displayName, networks };
  });
}

export function computeLatencyPerModel(
  data: DashboardRunData
): Array<{ model: string; avg: number }> {
  return data.grid.models.map((m) => {
    let total = 0;
    let count = 0;
    for (const pid of data.grid.promptIds) {
      const cell = data.grid.cells[`${pid}::${m.id}`];
      if (!cell) continue;
      total += cell.latencyMs;
      count++;
    }
    return { model: m.displayName, avg: count > 0 ? Math.round(total / count) : 0 };
  });
}

export function computeDefaultEcosystems(
  data: DashboardRunData
): Array<{ model: string; tier: string; defaultEcosystem: string; timesChosen: string }> {
  return data.grid.models.map((m) => {
    const ecoCounts: Record<string, number> = {};
    for (const pid of data.grid.promptIds) {
      const cell = data.grid.cells[`${pid}::${m.id}`];
      if (cell) {
        const eco = cellEcosystem(cell);
        ecoCounts[eco] = (ecoCounts[eco] ?? 0) + 1;
      }
    }
    const sorted = Object.entries(ecoCounts).sort((a, b) => b[1] - a[1]);
    return {
      model: m.displayName,
      tier: m.tier,
      defaultEcosystem: sorted[0]?.[0] ?? "Unknown",
      timesChosen: `${sorted[0]?.[1] ?? 0}/${data.grid.promptIds.length}`,
    };
  });
}

export function computeCategoryBreakdown(
  data: DashboardRunData
): Array<{ category: string; models: Array<{ model: string; ecosystems: Record<string, number> }> }> {
  const categories = [...new Set(data.prompts.map((p) => p.category))];
  return categories.map((cat) => {
    const catPrompts = data.prompts.filter((p) => p.category === cat).map((p) => p.id);
    const models = data.grid.models.map((m) => {
      const ecosystems: Record<string, number> = {};
      for (const pid of catPrompts) {
        const cell = data.grid.cells[`${pid}::${m.id}`];
        if (cell) {
          const eco = cellEcosystem(cell);
          ecosystems[eco] = (ecosystems[eco] ?? 0) + 1;
        }
      }
      return { model: m.displayName, ecosystems };
    });
    return { category: cat, models };
  });
}

const EVIDENCE_RE = /^(.+?) \(×(\d+), weight (\d+)\)$/;

export function computeToolFrequency(
  data: DashboardRunData
): Array<{ tool: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const r of data.results) {
    if (!r.evidence) continue;
    for (const e of r.evidence) {
      const m = EVIDENCE_RE.exec(e);
      if (m && TOOL_LABELS.has(m[1])) {
        counts[m[1]] = (counts[m[1]] ?? 0) + parseInt(m[2], 10);
      }
    }
  }
  return Object.entries(counts)
    .map(([tool, count]) => ({ tool, count }))
    .sort((a, b) => b.count - a.count);
}
