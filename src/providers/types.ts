export interface ProviderResponse {
  content: string;
  model: string;
  provider: string;
  tokensUsed: number;
  latencyMs: number;
}

export interface Provider {
  name: string;
  send(prompt: string, model: string): Promise<ProviderResponse>;
}

export interface ModelConfig {
  id: string;
  provider: string;
  tier: "flagship" | "mid-tier";
  displayName: string;
}

export interface Detection {
  network: string;
  ecosystem: string;
  confidence: number;
  evidence: string[];
  all: Record<string, number>;
}

export interface BehaviorClassification {
  behavior: "asked-questions" | "just-built" | "mixed";
  questionsAsked: number;
  decisionsStated: string[];
}

export interface CompletenessScore {
  score: number;
  hasContract: boolean;
  hasDeployScript: boolean;
  hasFrontend: boolean;
  hasTests: boolean;
  todoCount: number;
}

export interface AnalysisResult {
  detection: Detection;
  behavior: BehaviorClassification;
  completeness: CompletenessScore;
}

export interface BenchmarkResult {
  promptId: string;
  promptText: string;
  promptCategory: string;
  model: ModelConfig;
  response: ProviderResponse;
  analysis: AnalysisResult;
  timestamp: string;
  runId: string;
}
