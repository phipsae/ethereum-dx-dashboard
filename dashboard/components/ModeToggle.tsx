"use client";

import type { SearchMode } from "@/lib/types";

interface ModeToggleProps {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
}

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex rounded-full bg-[#16213e] p-1">
      <button
        onClick={() => onChange("standard")}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          mode === "standard"
            ? "bg-[#e94560] text-white"
            : "text-[#a0a0b0] hover:text-white"
        }`}
      >
        Standard
      </button>
      <button
        onClick={() => onChange("webSearch")}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          mode === "webSearch"
            ? "bg-[#e94560] text-white"
            : "text-[#a0a0b0] hover:text-white"
        }`}
      >
        Web Search
      </button>
    </div>
  );
}
