import type { NetworkDetection } from "../providers/types.js";

export const EVM_FAMILY_CHAINS = new Set([
  "Ethereum",
  "Polygon",
  "Base",
  "Avalanche",
  "BSC",
]);

interface NetworkSignal {
  pattern: RegExp;
  network: string;
  weight: number;
  label: string;
}

const SIGNALS: NetworkSignal[] = [
  // === Mainnet ===
  { pattern: /ethereum\s+mainnet/i, network: "Mainnet", weight: 10, label: "ethereum mainnet" },
  { pattern: /\bchain\s*id\s*[:=]?\s*1\b/, network: "Mainnet", weight: 8, label: "chainId 1" },
  { pattern: /mainnet\.infura/i, network: "Mainnet", weight: 9, label: "mainnet.infura" },
  { pattern: /etherscan\.io/i, network: "Mainnet", weight: 6, label: "etherscan.io" },
  { pattern: /\betherscan\b/i, network: "Mainnet", weight: 4, label: "etherscan" },
  { pattern: /ethereum\s+l1\b/i, network: "Mainnet", weight: 7, label: "Ethereum L1" },

  // === Base ===
  { pattern: /\bbase\s+(chain|network|l2)\b/i, network: "Base", weight: 10, label: "Base chain/network/l2" },
  { pattern: /base[- ]?sepolia/i, network: "Base", weight: 9, label: "base-sepolia" },
  { pattern: /\bchain\s*id\s*[:=]?\s*8453\b/, network: "Base", weight: 10, label: "chainId 8453" },
  { pattern: /basescan\.org/i, network: "Base", weight: 9, label: "basescan.org" },
  { pattern: /\bbasescan\b/i, network: "Base", weight: 7, label: "basescan" },
  { pattern: /deploy\s+(to|on)\s+base\b/i, network: "Base", weight: 9, label: "deploy to base" },
  { pattern: /\bbase\s+mainnet\b/i, network: "Base", weight: 9, label: "Base mainnet" },
  { pattern: /\bon\s+base\b/i, network: "Base", weight: 6, label: "on Base" },

  // === Arbitrum ===
  { pattern: /\barbitrum\b/i, network: "Arbitrum", weight: 8, label: "arbitrum" },
  { pattern: /arbitrum\s+one/i, network: "Arbitrum", weight: 9, label: "Arbitrum One" },
  { pattern: /arbitrum\s+nova/i, network: "Arbitrum", weight: 9, label: "Arbitrum Nova" },
  { pattern: /arbitrum[- ]?sepolia/i, network: "Arbitrum", weight: 8, label: "Arbitrum Sepolia" },
  { pattern: /\bchain\s*id\s*[:=]?\s*42161\b/, network: "Arbitrum", weight: 10, label: "chainId 42161" },
  { pattern: /arbiscan/i, network: "Arbitrum", weight: 8, label: "arbiscan" },
  { pattern: /arbitrum\s+sdk/i, network: "Arbitrum", weight: 7, label: "Arbitrum SDK" },

  // === Optimism ===
  { pattern: /\boptimism\b/i, network: "Optimism", weight: 8, label: "optimism" },
  { pattern: /\bop\s+mainnet\b/i, network: "Optimism", weight: 9, label: "OP Mainnet" },
  { pattern: /\bop\s+stack\b/i, network: "Optimism", weight: 7, label: "OP Stack" },
  { pattern: /\bchain\s*id\s*[:=]?\s*10\b/, network: "Optimism", weight: 8, label: "chainId 10" },
  { pattern: /optimistic\.etherscan/i, network: "Optimism", weight: 9, label: "optimistic.etherscan" },
  { pattern: /op[- ]?sepolia/i, network: "Optimism", weight: 8, label: "op-sepolia" },

  // === Polygon ===
  { pattern: /\bpolygon\b/i, network: "Polygon", weight: 7, label: "polygon" },
  { pattern: /\bmatic\b/i, network: "Polygon", weight: 6, label: "matic" },
  { pattern: /polygon\s+pos\b/i, network: "Polygon", weight: 8, label: "Polygon PoS" },
  { pattern: /polygon\s+zkevm/i, network: "Polygon", weight: 8, label: "Polygon zkEVM" },
  { pattern: /\bmumbai\b/i, network: "Polygon", weight: 6, label: "mumbai" },
  { pattern: /\bamoy\b/i, network: "Polygon", weight: 7, label: "amoy" },
  { pattern: /\bchain\s*id\s*[:=]?\s*137\b/, network: "Polygon", weight: 10, label: "chainId 137" },
  { pattern: /polygonscan/i, network: "Polygon", weight: 8, label: "polygonscan" },

  // === BSC ===
  { pattern: /\bbsc\b/i, network: "BSC", weight: 8, label: "BSC" },
  { pattern: /\bbnb\s+chain\b/i, network: "BSC", weight: 9, label: "BNB Chain" },
  { pattern: /binance\s+smart\s+chain/i, network: "BSC", weight: 9, label: "Binance Smart Chain" },
  { pattern: /\bchain\s*id\s*[:=]?\s*56\b/, network: "BSC", weight: 10, label: "chainId 56" },
  { pattern: /bscscan/i, network: "BSC", weight: 8, label: "bscscan" },
  { pattern: /pancakeswap/i, network: "BSC", weight: 6, label: "PancakeSwap" },

  // === Avalanche ===
  { pattern: /\bavalanche\b/i, network: "Avalanche", weight: 8, label: "avalanche" },
  { pattern: /\bavax\b/i, network: "Avalanche", weight: 7, label: "AVAX" },
  { pattern: /\bc-chain\b/i, network: "Avalanche", weight: 7, label: "C-Chain" },
  { pattern: /\bchain\s*id\s*[:=]?\s*43114\b/, network: "Avalanche", weight: 10, label: "chainId 43114" },
  { pattern: /snowtrace/i, network: "Avalanche", weight: 8, label: "snowtrace" },

  // === zkSync ===
  { pattern: /\bzksync\b/i, network: "zkSync", weight: 9, label: "zkSync" },
  { pattern: /zksync\s+era/i, network: "zkSync", weight: 9, label: "zkSync Era" },
  { pattern: /zksync\s+lite/i, network: "zkSync", weight: 8, label: "zkSync Lite" },
  { pattern: /\bchain\s*id\s*[:=]?\s*324\b/, network: "zkSync", weight: 10, label: "chainId 324" },

  // === Scroll ===
  { pattern: /\bscroll\b(?!\s*(down|up|bar|to\s+the|through|ing))/i, network: "Scroll", weight: 6, label: "scroll" },
  { pattern: /scroll\s+mainnet/i, network: "Scroll", weight: 9, label: "Scroll mainnet" },
  { pattern: /scroll[- ]?sepolia/i, network: "Scroll", weight: 8, label: "Scroll Sepolia" },
  { pattern: /scrollscan/i, network: "Scroll", weight: 8, label: "scrollscan" },
  { pattern: /\bchain\s*id\s*[:=]?\s*534352\b/, network: "Scroll", weight: 10, label: "chainId 534352" },

  // === Linea ===
  { pattern: /\blinea\b/i, network: "Linea", weight: 8, label: "linea" },
  { pattern: /linea\s+mainnet/i, network: "Linea", weight: 9, label: "Linea mainnet" },
  { pattern: /linea[- ]?sepolia/i, network: "Linea", weight: 8, label: "Linea Sepolia" },
  { pattern: /\bchain\s*id\s*[:=]?\s*59144\b/, network: "Linea", weight: 10, label: "chainId 59144" },
  { pattern: /lineascan/i, network: "Linea", weight: 8, label: "lineascan" },
];

export function detectNetwork(text: string): NetworkDetection {
  const scores = new Map<string, number>();
  const evidence = new Map<string, string[]>();

  for (const signal of SIGNALS) {
    const matches = text.match(new RegExp(signal.pattern, "gi"));
    if (matches) {
      const count = Math.min(matches.length, 3);
      const score = signal.weight * count;
      scores.set(signal.network, (scores.get(signal.network) ?? 0) + score);
      const existing = evidence.get(signal.network) ?? [];
      existing.push(`${signal.label} (×${matches.length}, weight ${signal.weight})`);
      evidence.set(signal.network, existing);
    }
  }

  if (scores.size === 0) {
    return {
      primary: "Unspecified",
      confidence: 0,
      evidence: [],
      all: {},
    };
  }

  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const [topNetwork, topScore] = sorted[0];
  const totalScore = [...scores.values()].reduce((a, b) => a + b, 0);
  const confidence = Math.round((topScore / totalScore) * 100);

  const all: Record<string, number> = {};
  for (const [network, score] of sorted) {
    all[network] = score;
  }

  return {
    primary: topNetwork,
    confidence,
    evidence: evidence.get(topNetwork) ?? [],
    all,
  };
}
