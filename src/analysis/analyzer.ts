import type { AnalysisResult } from "../providers/types.js";
import { classifyBehavior } from "./behavior-classifier.js";
import { detectChain } from "./chain-detector.js";
import { scoreCompleteness } from "./completeness-scorer.js";

export function analyzeResponse(text: string): AnalysisResult {
  return {
    chain: detectChain(text),
    behavior: classifyBehavior(text),
    completeness: scoreCompleteness(text),
  };
}
