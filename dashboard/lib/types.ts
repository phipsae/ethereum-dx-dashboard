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
  ecosystem: string;
  network: string;
  confidence: number;
  behavior: string;
  completeness: number;
  latencyMs: number;
  tokensUsed: number;
  evidence?: string[];
}

export interface SerializedGridCell {
  ecosystem: string;
  network: string;
  confidence: number;
  behavior: string;
  completeness: number;
  latencyMs: number;
  ecosystemCounts: Record<string, number>;
  networkCounts: Record<string, number>;
  runCount: number;
  /** @deprecated Old format field — present in pre-migration JSON data */
  chain?: string;
  /** @deprecated Old format field — present in pre-migration JSON data */
  chainCounts?: Record<string, number>;
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
  "Ethereum Ecosystem": "#627eea",
  Solana: "#14f195",
  Sui: "#4da2ff",
  Aptos: "#2dd8a3",
  Cosmos: "#2e3148",
  Near: "#000000",
  Polkadot: "#e6007a",
  BSC: "#f0b90b",
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
  Mantle: "#000000",
  Unspecified: "#888888",
};

export const BEHAVIOR_COLORS: Record<string, string> = {
  "just-built": "#4bc0c0",
  "asked-questions": "#ff6384",
  mixed: "#ffcd56",
};

export const TOOL_LABELS = new Set([
  "Hardhat",
  "Foundry/Forge",
  "Truffle",
  "Remix",
  "ethers.js",
  "web3.js",
  "OpenZeppelin",
  "Scaffold-ETH",
  "wagmi",
  "viem",
  "Infura/Alchemy",
  "MetaMask",
  "anchor_lang",
  "@solana/web3.js",
  "Metaplex",
  "Solana CLI",
  "Phantom wallet",
  "Sui Move",
  "Aptos Move",
  "CosmWasm",
  "Cosmos SDK",
  "Tendermint",
  "near-sdk",
  "Substrate",
  "ink!",
]);

export const TOOL_COLORS = [
  "#4bc0c0", "#ff6384", "#ffcd56", "#36a2eb", "#9966ff",
  "#ff9f40", "#c9cbcf", "#e94560", "#2dd8a3", "#627eea",
  "#9945ff", "#4da2ff", "#e84142", "#0098ea", "#8247e5",
];

export function getToolColor(index: number): string {
  return TOOL_COLORS[index % TOOL_COLORS.length];
}

export function getChainColor(chain: string): string {
  return CHAIN_COLORS[chain] ?? "#888888";
}

export function getNetworkColor(network: string): string {
  return NETWORK_COLORS[network] ?? "#888888";
}
