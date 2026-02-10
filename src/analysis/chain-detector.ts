import type { ChainDetection } from "../providers/types.js";

interface ChainSignal {
  pattern: RegExp;
  chain: string;
  weight: number;
  label: string;
}

const SIGNALS: ChainSignal[] = [
  // === Ethereum / EVM — high weight ===
  { pattern: /pragma solidity/i, chain: "Ethereum", weight: 10, label: "pragma solidity" },
  { pattern: /\.sol\b/i, chain: "Ethereum", weight: 5, label: ".sol file reference" },
  { pattern: /hardhat/i, chain: "Ethereum", weight: 7, label: "Hardhat" },
  { pattern: /foundry|forge/i, chain: "Ethereum", weight: 7, label: "Foundry/Forge" },
  { pattern: /truffle/i, chain: "Ethereum", weight: 6, label: "Truffle" },
  { pattern: /remix/i, chain: "Ethereum", weight: 4, label: "Remix" },
  { pattern: /ethers\.js|ethers\./i, chain: "Ethereum", weight: 6, label: "ethers.js" },
  { pattern: /web3\.js|web3\./i, chain: "Ethereum", weight: 5, label: "web3.js" },
  { pattern: /ERC-?20|ERC-?721|ERC-?1155/i, chain: "Ethereum", weight: 8, label: "ERC standard" },
  { pattern: /openzeppelin/i, chain: "Ethereum", weight: 7, label: "OpenZeppelin" },
  { pattern: /\babi\b.*encode|abi\.encode/i, chain: "Ethereum", weight: 6, label: "ABI encoding" },
  { pattern: /msg\.sender/i, chain: "Ethereum", weight: 8, label: "msg.sender" },
  { pattern: /require\s*\(.*,\s*["']/i, chain: "Ethereum", weight: 5, label: "Solidity require()" },
  { pattern: /mapping\s*\(/i, chain: "Ethereum", weight: 5, label: "Solidity mapping" },
  { pattern: /modifier\s+\w+/i, chain: "Ethereum", weight: 5, label: "Solidity modifier" },
  { pattern: /emit\s+\w+\s*\(/i, chain: "Ethereum", weight: 4, label: "Solidity emit" },
  { pattern: /payable/i, chain: "Ethereum", weight: 4, label: "payable keyword" },
  { pattern: /scaffold[- ]?eth/i, chain: "Ethereum", weight: 7, label: "Scaffold-ETH" },
  { pattern: /wagmi/i, chain: "Ethereum", weight: 6, label: "wagmi" },
  { pattern: /viem/i, chain: "Ethereum", weight: 6, label: "viem" },
  { pattern: /infura|alchemy/i, chain: "Ethereum", weight: 4, label: "Infura/Alchemy" },
  { pattern: /sepolia|goerli|mainnet/i, chain: "Ethereum", weight: 5, label: "Ethereum network name" },
  { pattern: /metamask/i, chain: "Ethereum", weight: 4, label: "MetaMask" },

  // === Solana — high weight ===
  { pattern: /anchor_lang|use anchor/i, chain: "Solana", weight: 10, label: "anchor_lang" },
  { pattern: /\bsolana[_-]?program\b/i, chain: "Solana", weight: 9, label: "solana_program" },
  { pattern: /\bspl[_-]token\b/i, chain: "Solana", weight: 9, label: "SPL token" },
  { pattern: /\bPubkey\b/i, chain: "Solana", weight: 6, label: "Pubkey type" },
  { pattern: /\b(solana|sol)\s+cli\b/i, chain: "Solana", weight: 7, label: "Solana CLI" },
  { pattern: /metaplex/i, chain: "Solana", weight: 8, label: "Metaplex" },
  { pattern: /\bdevnet\b/i, chain: "Solana", weight: 3, label: "devnet" },
  { pattern: /@solana\/web3/i, chain: "Solana", weight: 8, label: "@solana/web3.js" },
  { pattern: /borsh/i, chain: "Solana", weight: 5, label: "Borsh serialization" },
  { pattern: /phantom\s*wallet/i, chain: "Solana", weight: 5, label: "Phantom wallet" },
  { pattern: /\bAccountInfo\b/i, chain: "Solana", weight: 5, label: "AccountInfo" },
  { pattern: /program_id/i, chain: "Solana", weight: 6, label: "program_id" },

  // === Sui ===
  { pattern: /\bsui::/i, chain: "Sui", weight: 10, label: "sui:: module" },
  { pattern: /move\.toml/i, chain: "Sui", weight: 8, label: "Move.toml" },
  { pattern: /\bmove\s+language\b/i, chain: "Sui", weight: 6, label: "Move language" },
  { pattern: /sui\s+move/i, chain: "Sui", weight: 9, label: "Sui Move" },
  { pattern: /\bobject::new\b/i, chain: "Sui", weight: 7, label: "object::new" },

  // === Aptos ===
  { pattern: /aptos::/i, chain: "Aptos", weight: 10, label: "aptos:: module" },
  { pattern: /aptos\s+move/i, chain: "Aptos", weight: 9, label: "Aptos Move" },
  { pattern: /\baptos_framework\b/i, chain: "Aptos", weight: 8, label: "aptos_framework" },

  // === Cosmos ===
  { pattern: /cosmwasm/i, chain: "Cosmos", weight: 10, label: "CosmWasm" },
  { pattern: /cosmos[- ]?sdk/i, chain: "Cosmos", weight: 9, label: "Cosmos SDK" },
  { pattern: /tendermint/i, chain: "Cosmos", weight: 7, label: "Tendermint" },
  { pattern: /\bibc\b/i, chain: "Cosmos", weight: 4, label: "IBC" },

  // === Near ===
  { pattern: /near[_-]?sdk/i, chain: "Near", weight: 10, label: "near-sdk" },
  { pattern: /#\[near_bindgen\]/i, chain: "Near", weight: 10, label: "near_bindgen" },
  { pattern: /near\s+protocol/i, chain: "Near", weight: 7, label: "NEAR Protocol" },

  // === Polkadot / Substrate ===
  { pattern: /substrate/i, chain: "Polkadot", weight: 8, label: "Substrate" },
  { pattern: /ink!/i, chain: "Polkadot", weight: 9, label: "ink!" },
  { pattern: /polkadot/i, chain: "Polkadot", weight: 7, label: "Polkadot" },

  // === Polygon (still EVM but distinct chain) ===
  { pattern: /polygon|matic/i, chain: "Polygon", weight: 5, label: "Polygon/Matic" },
  { pattern: /mumbai\s*testnet/i, chain: "Polygon", weight: 6, label: "Mumbai testnet" },

  // === Base ===
  { pattern: /\bbase\s+(chain|network|l2)\b/i, chain: "Base", weight: 7, label: "Base chain" },
  { pattern: /base[- ]?sepolia/i, chain: "Base", weight: 7, label: "Base Sepolia" },

  // === Avalanche ===
  { pattern: /avalanche|avax/i, chain: "Avalanche", weight: 6, label: "Avalanche/AVAX" },
  { pattern: /c-chain/i, chain: "Avalanche", weight: 5, label: "C-Chain" },

  // === TON ===
  { pattern: /\bton\b.*\bblockchain\b|\bton\b.*\bcontract/i, chain: "TON", weight: 7, label: "TON blockchain" },
  { pattern: /\bfunc\b.*\bton\b|\btact\b/i, chain: "TON", weight: 8, label: "FunC/Tact" },

  // === Generic low-weight ===
  { pattern: /\bsolidity\b/i, chain: "Ethereum", weight: 6, label: "Solidity mention" },
  { pattern: /\brust\b.*\bcontract/i, chain: "Solana", weight: 3, label: "Rust contract" },
  { pattern: /\bethereumj?\b/i, chain: "Ethereum", weight: 3, label: "Ethereum mention" },
  { pattern: /\bsolana\b/i, chain: "Solana", weight: 5, label: "Solana mention" },
];

export function detectChain(text: string): ChainDetection {
  const scores = new Map<string, number>();
  const evidence = new Map<string, string[]>();

  for (const signal of SIGNALS) {
    const matches = text.match(new RegExp(signal.pattern, "gi"));
    if (matches) {
      const count = Math.min(matches.length, 3); // cap per-signal contribution
      const score = signal.weight * count;
      scores.set(signal.chain, (scores.get(signal.chain) ?? 0) + score);
      const existing = evidence.get(signal.chain) ?? [];
      existing.push(`${signal.label} (×${matches.length}, weight ${signal.weight})`);
      evidence.set(signal.chain, existing);
    }
  }

  if (scores.size === 0) {
    return { chain: "Unknown", confidence: 0, evidence: [] };
  }

  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const [topChain, topScore] = sorted[0];
  const secondScore = sorted.length > 1 ? sorted[1][1] : 0;

  // Confidence: how dominant is the top chain vs runner-up
  const totalScore = [...scores.values()].reduce((a, b) => a + b, 0);
  const confidence = Math.round((topScore / totalScore) * 100);

  return {
    chain: topChain,
    confidence,
    evidence: evidence.get(topChain) ?? [],
  };
}
