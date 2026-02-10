export interface DashboardRunMeta {
  timestamp: string;
  runId: string;
  modelCount: number;
  promptCount: number;
  resultCount: number;
}

export interface SlimResult {
  promptId: string;
  promptCategory: string;
  model: string;
  modelDisplayName: string;
  modelTier: string;
  chain: string;
  chainConfidence: number;
  network: string | null;
  behavior: string;
  completeness: number;
  latencyMs: number;
  tokensUsed: number;
}

export interface SerializedGridCell {
  chain: string;
  confidence: number;
  behavior: string;
  completeness: number;
  latencyMs: number;
  chainCounts: Record<string, number>;
  networkCounts: Record<string, number>;
  network: string | null;
  runCount: number;
}

export interface DashboardPrompt {
  id: string;
  category: string;
  text: string;
}

export interface ModelInfo {
  id: string;
  displayName: string;
  tier: string;
  provider: string;
}

export interface DashboardRunData {
  meta: DashboardRunMeta;
  results: SlimResult[];
  grid: {
    promptIds: string[];
    models: ModelInfo[];
    cells: Record<string, SerializedGridCell>;
  };
  prompts: DashboardPrompt[];
}

export interface RunIndexEntry {
  timestamp: string;
  runId: string;
  filename: string;
  modelCount: number;
  promptCount: number;
  resultCount: number;
}

export const CHAIN_COLORS: Record<string, string> = {
  Ethereum: "#627eea",
  Solana: "#9945ff",
  Sui: "#4da2ff",
  Aptos: "#2dd8a3",
  Cosmos: "#2e3148",
  Near: "#000000",
  Polkadot: "#e6007a",
  Polygon: "#8247e5",
  Base: "#0052ff",
  Avalanche: "#e84142",
  TON: "#0098ea",
  Unknown: "#888888",
};

export const NETWORK_COLORS: Record<string, string> = {
  Mainnet: "#627eea",
  Base: "#0052ff",
  Arbitrum: "#28a0f0",
  Optimism: "#ff0420",
  Polygon: "#8247e5",
  BSC: "#f0b90b",
  Avalanche: "#e84142",
  zkSync: "#8c8dfc",
  Scroll: "#ffeeda",
  Linea: "#61dfff",
  Unspecified: "#888888",
  "N/A": "#555555",
};

export const BEHAVIOR_COLORS: Record<string, string> = {
  "just-built": "#4bc0c0",
  "asked-questions": "#ff6384",
  mixed: "#ffcd56",
};

export function getChainColor(chain: string): string {
  return CHAIN_COLORS[chain] ?? "#888888";
}

export function getNetworkColor(network: string): string {
  return NETWORK_COLORS[network] ?? "#888888";
}
