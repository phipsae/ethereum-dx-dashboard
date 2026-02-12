import type { DashboardRunData, RunIndexEntry } from "./types";
import { TOOL_LABELS } from "./types";

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
export function computeOverallEcosystems(data: DashboardRunData): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of data.results) {
    const eco = r.ecosystem || "Chain-Agnostic";
    counts[eco] = (counts[eco] ?? 0) + 1;
  }
  return counts;
}

export function computePerModelEcosystems(
  data: DashboardRunData
): Array<{ model: string; ecosystems: Record<string, number> }> {
  const byModel = new Map<string, { display: string; ecosystems: Record<string, number> }>();
  for (const r of data.results) {
    let entry = byModel.get(r.model);
    if (!entry) {
      entry = { display: r.modelDisplayName, ecosystems: {} };
      byModel.set(r.model, entry);
    }
    const eco = r.ecosystem || "Chain-Agnostic";
    entry.ecosystems[eco] = (entry.ecosystems[eco] ?? 0) + 1;
  }
  return Array.from(byModel.values()).map((e) => ({
    model: e.display,
    ecosystems: e.ecosystems,
  }));
}

export function computeOverallNetworks(data: DashboardRunData): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of data.results) {
    if (r.ecosystem !== "Ethereum Ecosystem") continue;
    const net = r.network || "Ethereum Ecosystem";
    counts[net] = (counts[net] ?? 0) + 1;
  }
  return counts;
}

export function computePerModelNetworks(
  data: DashboardRunData
): Array<{ model: string; networks: Record<string, number> }> {
  const byModel = new Map<string, { display: string; networks: Record<string, number> }>();
  for (const r of data.results) {
    if (r.ecosystem !== "Ethereum Ecosystem") continue;
    let entry = byModel.get(r.model);
    if (!entry) {
      entry = { display: r.modelDisplayName, networks: {} };
      byModel.set(r.model, entry);
    }
    const net = r.network || "Ethereum Ecosystem";
    entry.networks[net] = (entry.networks[net] ?? 0) + 1;
  }
  return Array.from(byModel.values()).map((e) => ({
    model: e.display,
    networks: e.networks,
  }));
}

export function computeLatencyPerModel(
  data: DashboardRunData
): Array<{ model: string; avg: number }> {
  const byModel = new Map<string, { display: string; total: number; count: number }>();
  for (const r of data.results) {
    let entry = byModel.get(r.model);
    if (!entry) {
      entry = { display: r.modelDisplayName, total: 0, count: 0 };
      byModel.set(r.model, entry);
    }
    entry.total += r.latencyMs;
    entry.count++;
  }
  return Array.from(byModel.values()).map((e) => ({
    model: e.display,
    avg: e.count > 0 ? Math.round(e.total / e.count) : 0,
  }));
}

export function computeDefaultEcosystems(
  data: DashboardRunData
): Array<{ model: string; tier: string; defaultEcosystem: string; timesChosen: string }> {
  const promptCount = new Set(data.results.map((r) => r.promptId)).size;
  const byModel = new Map<string, { display: string; tier: string; ecoCounts: Record<string, number> }>();
  for (const r of data.results) {
    let entry = byModel.get(r.model);
    if (!entry) {
      entry = { display: r.modelDisplayName, tier: r.modelTier, ecoCounts: {} };
      byModel.set(r.model, entry);
    }
    const eco = r.ecosystem || "Chain-Agnostic";
    entry.ecoCounts[eco] = (entry.ecoCounts[eco] ?? 0) + 1;
  }
  return Array.from(byModel.values()).map((e) => {
    const sorted = Object.entries(e.ecoCounts).sort((a, b) => b[1] - a[1]);
    return {
      model: e.display,
      tier: e.tier,
      defaultEcosystem: sorted[0]?.[0] ?? "Chain-Agnostic",
      timesChosen: `${sorted[0]?.[1] ?? 0}/${promptCount}`,
    };
  });
}

export function computeCategoryBreakdown(
  data: DashboardRunData
): Array<{ category: string; networks: Record<string, number> }> {
  const categories = [...new Set(data.prompts.map((p) => p.category))];
  return categories.map((cat) => {
    const networks: Record<string, number> = {};
    for (const r of data.results) {
      if (r.promptCategory !== cat) continue;
      const net = r.network || r.ecosystem || "Chain-Agnostic";
      networks[net] = (networks[net] ?? 0) + 1;
    }
    return { category: cat, networks };
  });
}

export function computePerPromptNetworks(
  data: DashboardRunData
): Array<{ promptId: string; networks: Record<string, number> }> {
  const promptIds = data.prompts.map((p) => p.id);
  return promptIds.map((pid) => {
    const networks: Record<string, number> = {};
    for (const r of data.results) {
      if (r.promptId !== pid) continue;
      const net = r.network || r.ecosystem || "Chain-Agnostic";
      networks[net] = (networks[net] ?? 0) + 1;
    }
    return { promptId: pid, networks };
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
