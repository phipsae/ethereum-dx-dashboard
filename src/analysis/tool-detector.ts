import { spawnClaude } from "./claude-cli.js";

export interface ToolDetection {
  tools: string[];
  reasoning: string;
}

const JSON_SCHEMA = JSON.stringify({
  type: "object",
  properties: {
    tools: {
      type: "array",
      items: { type: "string" },
      description: "Developer tools and frameworks the response recommends or builds with",
    },
    reasoning: {
      type: "string",
      description: "1-2 sentence explanation of which tools are recommended and why",
    },
  },
  required: ["tools", "reasoning"],
});

const SYSTEM_PROMPT = `Identify which developer tools, frameworks, and libraries this AI response recommends or uses to build with.

Rules:
1. Only include tools the response actually recommends, builds with, or uses in code examples
2. Do NOT include tools that are merely mentioned in passing, listed as alternatives without endorsement, or advised against
3. Use canonical tool names. Examples:
   - Ethereum/EVM: Hardhat, Foundry, Truffle, Remix, ethers.js, web3.js, viem, wagmi, OpenZeppelin, Scaffold-ETH, thirdweb, Alchemy, Infura, MetaMask, IPFS, The Graph
   - Solana: Anchor, @solana/web3.js, Metaplex, Solana CLI, Phantom
   - Sui: Sui Move, Sui SDK
   - Aptos: Aptos Move, Aptos SDK
   - Cosmos: CosmWasm, Cosmos SDK, Tendermint
   - Near: near-sdk-rs, near-api-js
   - Polkadot: Substrate, ink!
   - General: React, Next.js, Node.js, TypeScript, Solidity, Rust, Move
4. Don't limit yourself to the examples above - include any developer tool or framework the response recommends
5. If the response doesn't recommend any specific tools (e.g. it's a high-level comparison or refuses to answer), return an empty tools array
6. Include programming languages only when the response specifically chooses them as part of the tech stack (e.g. "use Solidity" or "write in Rust"), not when they're incidentally mentioned`;

function parseResult(stdout: string): ToolDetection {
  const parsed = JSON.parse(stdout);
  const result = parsed.result?.structured_output ?? parsed.structured_output ?? parsed;

  if (!Array.isArray(result.tools) || typeof result.reasoning !== "string") {
    throw new Error(`Unexpected tool detection output shape: ${JSON.stringify(result).slice(0, 200)}`);
  }

  return {
    tools: result.tools,
    reasoning: result.reasoning,
  };
}

export async function llmDetectTools(responseText: string): Promise<ToolDetection> {
  const stdout = await spawnClaude(responseText, SYSTEM_PROMPT, JSON_SCHEMA);
  return parseResult(stdout);
}
