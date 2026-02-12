import type { AnalysisResult } from "../providers/types.js";
import { classifyBehavior } from "./behavior-classifier.js";
import { llmDetect } from "./llm-detector.js";
import { scoreCompleteness } from "./completeness-scorer.js";

export async function analyzeResponse(text: string, promptText: string): Promise<AnalysisResult> {
  return {
    detection: await llmDetect(text, promptText),
    behavior: classifyBehavior(text),
    completeness: scoreCompleteness(text),
  };
}
