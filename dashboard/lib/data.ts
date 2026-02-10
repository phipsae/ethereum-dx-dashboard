import type { DashboardRunData, RunIndexEntry } from "./types";

const DATA_BASE = "/data";

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
export function computeOverallChains(data: DashboardRunData): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const cell of Object.values(data.grid.cells)) {
    for (const [chain, cnt] of Object.entries(cell.chainCounts)) {
      counts[chain] = (counts[chain] ?? 0) + cnt;
    }
  }
  return counts;
}

export function computePerModelChains(
  data: DashboardRunData
): Array<{ model: string; chains: Record<string, number> }> {
  return data.grid.models.map((m) => {
    const chains: Record<string, number> = {};
    for (const pid of data.grid.promptIds) {
      const cell = data.grid.cells[`${pid}::${m.id}`];
      if (!cell) continue;
      for (const [chain, cnt] of Object.entries(cell.chainCounts)) {
        chains[chain] = (chains[chain] ?? 0) + cnt;
      }
    }
    return { model: m.displayName, chains };
  });
}

export function computeOverallNetworks(data: DashboardRunData): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const cell of Object.values(data.grid.cells)) {
    for (const [net, cnt] of Object.entries(cell.networkCounts)) {
      if (net !== "N/A") {
        counts[net] = (counts[net] ?? 0) + cnt;
      }
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
      if (!cell) continue;
      for (const [net, cnt] of Object.entries(cell.networkCounts)) {
        if (net !== "N/A") {
          networks[net] = (networks[net] ?? 0) + cnt;
        }
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

export function computeDefaultChains(
  data: DashboardRunData
): Array<{ model: string; tier: string; defaultChain: string; timesChosen: string }> {
  return data.grid.models.map((m) => {
    const chainCounts: Record<string, number> = {};
    for (const pid of data.grid.promptIds) {
      const cell = data.grid.cells[`${pid}::${m.id}`];
      if (cell) {
        chainCounts[cell.chain] = (chainCounts[cell.chain] ?? 0) + 1;
      }
    }
    const sorted = Object.entries(chainCounts).sort((a, b) => b[1] - a[1]);
    return {
      model: m.displayName,
      tier: m.tier,
      defaultChain: sorted[0]?.[0] ?? "Unknown",
      timesChosen: `${sorted[0]?.[1] ?? 0}/${data.grid.promptIds.length}`,
    };
  });
}

export function computeCategoryBreakdown(
  data: DashboardRunData
): Array<{ category: string; models: Array<{ model: string; chains: Record<string, number> }> }> {
  const categories = [...new Set(data.prompts.map((p) => p.category))];
  return categories.map((cat) => {
    const catPrompts = data.prompts.filter((p) => p.category === cat).map((p) => p.id);
    const models = data.grid.models.map((m) => {
      const chains: Record<string, number> = {};
      for (const pid of catPrompts) {
        const cell = data.grid.cells[`${pid}::${m.id}`];
        if (cell) {
          chains[cell.chain] = (chains[cell.chain] ?? 0) + 1;
        }
      }
      return { model: m.displayName, chains };
    });
    return { category: cat, models };
  });
}
