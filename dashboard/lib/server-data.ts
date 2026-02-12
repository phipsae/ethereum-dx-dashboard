import fs from "node:fs";
import path from "node:path";
import type { DashboardRunData, RunIndexEntry, ToolDashboardRunData } from "./types";

export function loadRunDataFromFile(): DashboardRunData | null {
  const filePath = path.join(process.cwd(), "public", "data", "latest.json");
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function loadRunsIndexFromFile(): RunIndexEntry[] {
  const filePath = path.join(process.cwd(), "public", "data", "runs.json");
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function loadRunFromFile(filename: string): DashboardRunData | null {
  const filePath = path.join(process.cwd(), "public", "data", filename);
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function loadComparisonData(): {
  standard: DashboardRunData | null;
  webSearch: DashboardRunData | null;
} {
  const index = loadRunsIndexFromFile();
  if (index.length === 0) {
    // No index - fall back to latest.json as standard
    return { standard: loadRunDataFromFile(), webSearch: null };
  }

  // Find latest standard run (webSearch falsy) and latest web search run
  const standardEntry = index.find((e) => !e.webSearch);
  const webSearchEntry = index.find((e) => e.webSearch === true);

  const standard = standardEntry ? loadRunFromFile(standardEntry.filename) : null;
  const webSearch = webSearchEntry ? loadRunFromFile(webSearchEntry.filename) : null;

  // If neither matched (old index without webSearch field), fall back to latest
  if (!standard && !webSearch) {
    return { standard: loadRunDataFromFile(), webSearch: null };
  }

  return { standard, webSearch };
}

export function loadToolData(): {
  toolStandard: ToolDashboardRunData | null;
  toolWebSearch: ToolDashboardRunData | null;
} {
  // Try loading from tools/latest.json
  const latestPath = path.join(process.cwd(), "public", "data", "tools", "latest.json");
  try {
    if (!fs.existsSync(latestPath)) {
      return { toolStandard: null, toolWebSearch: null };
    }
    const raw = fs.readFileSync(latestPath, "utf-8");
    const data: ToolDashboardRunData = JSON.parse(raw);

    // Check if it has webSearch results
    const hasWebSearch = data.results.some(r => r.webSearch);
    const hasStandard = data.results.some(r => !r.webSearch);

    if (hasWebSearch && hasStandard) {
      // Split into standard and web search
      const standardResults = data.results.filter(r => !r.webSearch);
      const webSearchResults = data.results.filter(r => r.webSearch);

      const toolStandard: ToolDashboardRunData = {
        ...data,
        meta: { ...data.meta, resultCount: standardResults.length, webSearch: false },
        results: standardResults,
      };
      const toolWebSearch: ToolDashboardRunData = {
        ...data,
        meta: { ...data.meta, resultCount: webSearchResults.length, webSearch: true },
        results: webSearchResults,
      };
      return { toolStandard, toolWebSearch };
    }

    // Single mode
    if (hasWebSearch) {
      return { toolStandard: null, toolWebSearch: data };
    }
    return { toolStandard: data, toolWebSearch: null };
  } catch {
    return { toolStandard: null, toolWebSearch: null };
  }
}
