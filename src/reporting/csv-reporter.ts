import fs from "node:fs";
import path from "node:path";
import type { BenchmarkResult } from "../providers/types.js";

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const COLUMNS = [
  "prompt_id",
  "model_id",
  "model_name",
  "model_tier",
  "provider",
  "network",
  "ecosystem",
  "confidence",
  "evidence",
  "behavior",
  "questions_asked",
  "completeness_score",
  "has_contract",
  "has_deploy_script",
  "has_frontend",
  "has_tests",
  "todo_count",
  "latency_ms",
  "latency_s",
  "tokens_used",
  "timestamp",
  "run_id",
] as const;

export function generateCsv(results: BenchmarkResult[]): string {
  const rows: string[] = [COLUMNS.join(",")];

  for (const r of results) {
    const fields: string[] = [
      escapeCsvField(r.promptId),
      escapeCsvField(r.model.id),
      escapeCsvField(r.model.displayName),
      escapeCsvField(r.model.tier),
      escapeCsvField(r.model.provider),
      escapeCsvField(r.analysis.detection.network),
      escapeCsvField(r.analysis.detection.ecosystem),
      String(r.analysis.detection.confidence),
      escapeCsvField(r.analysis.detection.evidence.join("; ")),
      escapeCsvField(r.analysis.behavior.behavior),
      String(r.analysis.behavior.questionsAsked),
      String(r.analysis.completeness.score),
      String(r.analysis.completeness.hasContract),
      String(r.analysis.completeness.hasDeployScript),
      String(r.analysis.completeness.hasFrontend),
      String(r.analysis.completeness.hasTests),
      String(r.analysis.completeness.todoCount),
      String(r.response.latencyMs),
      (r.response.latencyMs / 1000).toFixed(1),
      String(r.response.tokensUsed),
      escapeCsvField(r.timestamp),
      escapeCsvField(r.runId),
    ];
    rows.push(fields.join(","));
  }

  return rows.join("\n") + "\n";
}

export function saveCsvReport(outputDir: string, csv: string): string {
  const filepath = path.join(outputDir, "report.csv");
  fs.writeFileSync(filepath, csv);
  return filepath;
}
