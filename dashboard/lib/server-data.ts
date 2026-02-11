import fs from "node:fs";
import path from "node:path";
import type { DashboardRunData, RunIndexEntry } from "./types";

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
    // No index — fall back to latest.json as standard
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
