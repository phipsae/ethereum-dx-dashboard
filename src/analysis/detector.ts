import type { Detection } from "../providers/types.js";

// === Ecosystem mapping (display-layer only) ===

export const NETWORK_TO_ECOSYSTEM: Record<string, string> = {
  Mainnet: "Ethereum Ecosystem",
  Base: "Ethereum Ecosystem",
  Arbitrum: "Ethereum Ecosystem",
  Optimism: "Ethereum Ecosystem",
  Polygon: "Ethereum Ecosystem",
  zkSync: "Ethereum Ecosystem",
  Scroll: "Ethereum Ecosystem",
  Linea: "Ethereum Ecosystem",
  Mantle: "Ethereum Ecosystem",
  Unspecified: "Ethereum Ecosystem", // generic Solidity, no network-specific signals
  BSC: "BSC",
  Avalanche: "Avalanche",
  Solana: "Solana",
  Sui: "Sui",
  Aptos: "Aptos",
  Cosmos: "Cosmos",
  Near: "Near",
  Polkadot: "Polkadot",
  TON: "TON",
};

export function getEcosystem(network: string): string {
  return NETWORK_TO_ECOSYSTEM[network] ?? "Unknown";
}

// Networks that receive the EVM-generic score boost
const EVM_NETWORKS = new Set([
  "Mainnet", "Base", "Arbitrum", "Optimism", "Polygon",
  "zkSync", "Scroll", "Linea", "Mantle", "BSC", "Avalanche",
]);

// === Signal definitions ===

interface Signal {
  pattern: RegExp;
  network: string; // target network, or "EVM" for generic EVM signals
  weight: number;
  label: string;
}

const SIGNALS: Signal[] = [
  // === EVM-generic signals (shared tooling, no specific network) ===
  { pattern: /pragma solidity/i, network: "EVM", weight: 10, label: "pragma solidity" },
  { pattern: /\.sol\b/i, network: "EVM", weight: 5, label: ".sol file reference" },
  { pattern: /hardhat/i, network: "EVM", weight: 7, label: "Hardhat" },
  { pattern: /foundry|forge/i, network: "EVM", weight: 7, label: "Foundry/Forge" },
  { pattern: /truffle/i, network: "EVM", weight: 6, label: "Truffle" },
  { pattern: /remix/i, network: "EVM", weight: 4, label: "Remix" },
  { pattern: /ethers\.js|ethers\./i, network: "EVM", weight: 6, label: "ethers.js" },
  { pattern: /web3\.js|web3\./i, network: "EVM", weight: 5, label: "web3.js" },
  { pattern: /ERC-?20|ERC-?721|ERC-?1155/i, network: "EVM", weight: 8, label: "ERC standard" },
  { pattern: /openzeppelin/i, network: "EVM", weight: 7, label: "OpenZeppelin" },
  { pattern: /\babi\b.*encode|abi\.encode/i, network: "EVM", weight: 6, label: "ABI encoding" },
  { pattern: /msg\.sender/i, network: "EVM", weight: 8, label: "msg.sender" },
  { pattern: /require\s*\(.*,\s*["']/i, network: "EVM", weight: 5, label: "Solidity require()" },
  { pattern: /mapping\s*\(/i, network: "EVM", weight: 5, label: "Solidity mapping" },
  { pattern: /modifier\s+\w+/i, network: "EVM", weight: 5, label: "Solidity modifier" },
  { pattern: /emit\s+\w+\s*\(/i, network: "EVM", weight: 4, label: "Solidity emit" },
  { pattern: /payable/i, network: "EVM", weight: 4, label: "payable keyword" },
  { pattern: /scaffold[- ]?eth/i, network: "EVM", weight: 7, label: "Scaffold-ETH" },
  { pattern: /wagmi/i, network: "EVM", weight: 6, label: "wagmi" },
  { pattern: /viem/i, network: "EVM", weight: 6, label: "viem" },
  { pattern: /infura|alchemy/i, network: "EVM", weight: 4, label: "Infura/Alchemy" },
  { pattern: /metamask/i, network: "EVM", weight: 4, label: "MetaMask" },
  { pattern: /\bsolidity\b/i, network: "EVM", weight: 6, label: "Solidity mention" },
  { pattern: /\bethereumj?\b/i, network: "EVM", weight: 3, label: "Ethereum mention" },

  // === Mainnet-specific ===
  { pattern: /ethereum\s+mainnet/i, network: "Mainnet", weight: 10, label: "ethereum mainnet" },
  { pattern: /\bchain\s*id\s*[:=]?\s*1\b/, network: "Mainnet", weight: 8, label: "chainId 1" },
  { pattern: /mainnet\.infura/i, network: "Mainnet", weight: 9, label: "mainnet.infura" },
  { pattern: /etherscan\.io/i, network: "Mainnet", weight: 6, label: "etherscan.io" },
  { pattern: /\betherscan\b/i, network: "Mainnet", weight: 4, label: "etherscan" },
  { pattern: /ethereum\s+l1\b/i, network: "Mainnet", weight: 7, label: "Ethereum L1" },
  { pattern: /sepolia|goerli/i, network: "Mainnet", weight: 5, label: "Ethereum testnet" },

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
  { pattern: /mumbai\s*testnet/i, network: "Polygon", weight: 6, label: "Mumbai testnet" },

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

  // === Mantle ===
  { pattern: /\bmantle\b/i, network: "Mantle", weight: 8, label: "mantle" },
  { pattern: /mantle\s+mainnet/i, network: "Mantle", weight: 9, label: "Mantle mainnet" },
  { pattern: /mantle[- ]?sepolia/i, network: "Mantle", weight: 8, label: "Mantle Sepolia" },
  { pattern: /\bchain\s*id\s*[:=]?\s*5000\b/, network: "Mantle", weight: 10, label: "chainId 5000" },
  { pattern: /mantlescan/i, network: "Mantle", weight: 8, label: "mantlescan" },

  // === BSC (network-specific) ===
  { pattern: /\bbsc\b|bnb\s+chain|binance\s+smart\s+chain/i, network: "BSC", weight: 7, label: "BSC/BNB Chain" },
  { pattern: /bscscan/i, network: "BSC", weight: 8, label: "bscscan" },
  { pattern: /\bchain\s*id\s*[:=]?\s*56\b/, network: "BSC", weight: 10, label: "chainId 56" },
  { pattern: /pancakeswap/i, network: "BSC", weight: 7, label: "PancakeSwap" },

  // === Avalanche (network-specific) ===
  { pattern: /avalanche|avax/i, network: "Avalanche", weight: 6, label: "Avalanche/AVAX" },
  { pattern: /c-chain/i, network: "Avalanche", weight: 5, label: "C-Chain" },
  { pattern: /snowtrace/i, network: "Avalanche", weight: 8, label: "Snowtrace" },
  { pattern: /\bchain\s*id\s*[:=]?\s*43114\b/, network: "Avalanche", weight: 10, label: "chainId 43114" },

  // === Solana ===
  { pattern: /anchor_lang|use anchor/i, network: "Solana", weight: 10, label: "anchor_lang" },
  { pattern: /\bsolana[_-]?program\b/i, network: "Solana", weight: 9, label: "solana_program" },
  { pattern: /\bspl[_-]token\b/i, network: "Solana", weight: 9, label: "SPL token" },
  { pattern: /\bPubkey\b/i, network: "Solana", weight: 6, label: "Pubkey type" },
  { pattern: /\b(solana|sol)\s+cli\b/i, network: "Solana", weight: 7, label: "Solana CLI" },
  { pattern: /metaplex/i, network: "Solana", weight: 8, label: "Metaplex" },
  { pattern: /\bdevnet\b/i, network: "Solana", weight: 3, label: "devnet" },
  { pattern: /@solana\/web3/i, network: "Solana", weight: 8, label: "@solana/web3.js" },
  { pattern: /borsh/i, network: "Solana", weight: 5, label: "Borsh serialization" },
  { pattern: /phantom\s*wallet/i, network: "Solana", weight: 5, label: "Phantom wallet" },
  { pattern: /\bAccountInfo\b/i, network: "Solana", weight: 5, label: "AccountInfo" },
  { pattern: /program_id/i, network: "Solana", weight: 6, label: "program_id" },
  { pattern: /\bsolana\b/i, network: "Solana", weight: 5, label: "Solana mention" },
  { pattern: /\brust\b.*\bcontract/i, network: "Solana", weight: 3, label: "Rust contract" },

  // === Sui ===
  { pattern: /\bsui::/i, network: "Sui", weight: 10, label: "sui:: module" },
  { pattern: /move\.toml/i, network: "Sui", weight: 8, label: "Move.toml" },
  { pattern: /\bmove\s+language\b/i, network: "Sui", weight: 6, label: "Move language" },
  { pattern: /sui\s+move/i, network: "Sui", weight: 9, label: "Sui Move" },
  { pattern: /\bobject::new\b/i, network: "Sui", weight: 7, label: "object::new" },

  // === Aptos ===
  { pattern: /aptos::/i, network: "Aptos", weight: 10, label: "aptos:: module" },
  { pattern: /aptos\s+move/i, network: "Aptos", weight: 9, label: "Aptos Move" },
  { pattern: /\baptos_framework\b/i, network: "Aptos", weight: 8, label: "aptos_framework" },

  // === Cosmos ===
  { pattern: /cosmwasm/i, network: "Cosmos", weight: 10, label: "CosmWasm" },
  { pattern: /cosmos[- ]?sdk/i, network: "Cosmos", weight: 9, label: "Cosmos SDK" },
  { pattern: /tendermint/i, network: "Cosmos", weight: 7, label: "Tendermint" },
  { pattern: /\bibc\b/i, network: "Cosmos", weight: 4, label: "IBC" },

  // === Near ===
  { pattern: /near[_-]?sdk/i, network: "Near", weight: 10, label: "near-sdk" },
  { pattern: /#\[near_bindgen\]/i, network: "Near", weight: 10, label: "near_bindgen" },
  { pattern: /near\s+protocol/i, network: "Near", weight: 7, label: "NEAR Protocol" },

  // === Polkadot / Substrate ===
  { pattern: /substrate/i, network: "Polkadot", weight: 8, label: "Substrate" },
  { pattern: /ink!/i, network: "Polkadot", weight: 9, label: "ink!" },
  { pattern: /polkadot/i, network: "Polkadot", weight: 7, label: "Polkadot" },

  // === TON ===
  { pattern: /\bton\b.*\bblockchain\b|\bton\b.*\bcontract/i, network: "TON", weight: 7, label: "TON blockchain" },
  { pattern: /\bfunc\b.*\bton\b|\btact\b/i, network: "TON", weight: 8, label: "FunC/Tact" },
];

export function detect(text: string): Detection {
  const scores = new Map<string, number>();
  const evidence = new Map<string, string[]>();
  let evmGenericScore = 0;
  const evmGenericEvidence: string[] = [];

  for (const signal of SIGNALS) {
    const matches = text.match(new RegExp(signal.pattern, "gi"));
    if (!matches) continue;

    const count = Math.min(matches.length, 3);
    const score = signal.weight * count;
    const evidenceStr = `${signal.label} (×${matches.length}, weight ${signal.weight})`;

    if (signal.network === "EVM") {
      // Accumulate in separate EVM-generic bucket
      evmGenericScore += score;
      evmGenericEvidence.push(evidenceStr);
    } else {
      scores.set(signal.network, (scores.get(signal.network) ?? 0) + score);
      const existing = evidence.get(signal.network) ?? [];
      existing.push(evidenceStr);
      evidence.set(signal.network, existing);
    }
  }

  // Find the top EVM-compatible network (if any)
  let topEvmNetwork: string | null = null;
  let topEvmScore = 0;
  for (const [network, score] of scores) {
    if (EVM_NETWORKS.has(network) && score > topEvmScore) {
      topEvmNetwork = network;
      topEvmScore = score;
    }
  }

  // Apply EVM-generic boost
  if (evmGenericScore > 0) {
    if (topEvmNetwork) {
      // Add EVM-generic score to the top EVM network
      scores.set(topEvmNetwork, (scores.get(topEvmNetwork) ?? 0) + evmGenericScore);
      const existing = evidence.get(topEvmNetwork) ?? [];
      existing.push(...evmGenericEvidence);
      evidence.set(topEvmNetwork, existing);
    } else {
      // No specific EVM network detected → "Unspecified"
      scores.set("Unspecified", (scores.get("Unspecified") ?? 0) + evmGenericScore);
      const existing = evidence.get("Unspecified") ?? [];
      existing.push(...evmGenericEvidence);
      evidence.set("Unspecified", existing);
    }
  }

  if (scores.size === 0) {
    return {
      network: "Unknown",
      ecosystem: "Unknown",
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
    network: topNetwork,
    ecosystem: getEcosystem(topNetwork),
    confidence,
    evidence: evidence.get(topNetwork) ?? [],
    all,
  };
}
