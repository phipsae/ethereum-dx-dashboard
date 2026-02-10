"use client";

import type { RunIndexEntry } from "@/lib/types";

interface RunSelectorProps {
  runs: RunIndexEntry[];
  selected: string | null;
  onChange: (filename: string) => void;
  label?: string;
}

export default function RunSelector({ runs, selected, onChange, label }: RunSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      {label && <span className="text-sm text-[#a0a0b0]">{label}</span>}
      <select
        value={selected ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-[#0f3460] bg-[#16213e] px-3 py-2 text-sm text-[#e0e0e0] focus:border-[#e94560] focus:outline-none"
      >
        <option value="" disabled>
          Select a run...
        </option>
        {runs.map((run) => (
          <option key={run.filename} value={run.filename}>
            {new Date(run.timestamp).toLocaleString()} — {run.modelCount} models, {run.resultCount} results
          </option>
        ))}
      </select>
    </div>
  );
}
