import type { AnalysisResult } from "../providers/types.js";
import { classifyBehavior } from "./behavior-classifier.js";
import { detectChain } from "./chain-detector.js";
import { scoreCompleteness } from "./completeness-scorer.js";
import { detectNetwork, EVM_FAMILY_CHAINS } from "./network-detector.js";

export function analyzeResponse(text: string): AnalysisResult {
  const chain = detectChain(text);

  if (EVM_FAMILY_CHAINS.has(chain.chain)) {
    chain.network = detectNetwork(text);
  }

  return {
    chain,
    behavior: classifyBehavior(text),
    completeness: scoreCompleteness(text),
  };
}
