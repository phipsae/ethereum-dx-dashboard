import type { AnalysisResult } from "../providers/types.js";
import { classifyBehavior } from "./behavior-classifier.js";
import { detect } from "./detector.js";
import { scoreCompleteness } from "./completeness-scorer.js";

export function analyzeResponse(text: string): AnalysisResult {
  return {
    detection: detect(text),
    behavior: classifyBehavior(text),
    completeness: scoreCompleteness(text),
  };
}
