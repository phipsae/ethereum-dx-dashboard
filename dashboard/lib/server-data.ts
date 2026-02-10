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
