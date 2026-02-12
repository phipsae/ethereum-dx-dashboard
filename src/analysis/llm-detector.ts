import { execFile } from "node:child_process";
import type { Detection } from "../providers/types.js";
import { getEcosystem } from "./detector.js";

const VALID_NETWORKS = new Set([
  "Mainnet", "Base", "Arbitrum", "Optimism", "Polygon", "zkSync", "Scroll",
  "Linea", "Mantle", "Unspecified", "BSC", "Avalanche", "Solana", "Sui",
  "Aptos", "Cosmos", "Near", "Polkadot", "TON", "Unknown",
]);

const JSON_SCHEMA = JSON.stringify({
  type: "object",
  properties: {
    network: { type: "string", description: "The primary network the response favors" },
    confidence: { type: "number", description: "0-100 confidence" },
    reasoning: { type: "string", description: "1-2 sentence explanation" },
    mentioned_chains: {
      type: "array",
      items: { type: "string" },
      description: "All blockchain networks mentioned or discussed in the response",
    },
  },
  required: ["network", "confidence", "reasoning", "mentioned_chains"],
});

function buildPrompt(promptText: string): string {
  return `Classify which blockchain this AI response favors. The original prompt was: "${promptText}"

Rules (in priority order):
1. Explicit recommendation: if the response recommends a specific chain by name, return that chain
2. Concrete example: if the response lists multiple chains but then provides a concrete tech stack, code snippet, or tutorial targeting one specific chain, that chain wins. The example reveals the model's default preference, even if alternatives were discussed earlier.
3. Code targeting a chain: if the response writes code (deploy scripts, contract addresses, chain IDs, RPC URLs) for one specific chain, return that chain
4. Generic Ethereum: if it says "Ethereum" or "an Ethereum L2" without picking a specific L2, or uses generic EVM/Solidity code with no specific network, return "Unspecified"
5. Multiple equal options: if it lists multiple chains equally and never narrows down to one (no concrete example, no code), return "Unspecified"
6. No blockchain: if no blockchain is mentioned at all, or the response refuses/is chain-agnostic, return "Unknown"
7. "Mainnet" means Ethereum L1 specifically

Valid networks: Mainnet, Base, Arbitrum, Optimism, Polygon, zkSync, Scroll, Linea, Mantle, Unspecified, BSC, Avalanche, Solana, Sui, Aptos, Cosmos, Near, Polkadot, TON, Unknown`;
}

interface LlmResult {
  network: string;
  confidence: number;
  reasoning: string;
  mentioned_chains: string[];
}

function spawnClaude(responseText: string, promptText: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      "claude",
      [
        "-p", buildPrompt(promptText),
        "--output-format", "json",
        "--json-schema", JSON_SCHEMA,
        "--no-session-persistence",
      ],
      { maxBuffer: 10 * 1024 * 1024, timeout: 60_000 },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`claude CLI failed: ${err.message}${stderr ? `\n${stderr}` : ""}`));
          return;
        }
        resolve(stdout);
      },
    );

    // Pipe response text via stdin to avoid shell escaping issues
    if (child.stdin) {
      child.stdin.write(responseText);
      child.stdin.end();
    }
  });
}

function parseResult(stdout: string): LlmResult {
  const parsed = JSON.parse(stdout);
  // The structured output lives under result.structured_output or directly in the object
  const result: LlmResult = parsed.result?.structured_output ?? parsed.structured_output ?? parsed;

  if (!result.network || typeof result.confidence !== "number" || !result.reasoning) {
    throw new Error(`Unexpected LLM output shape: ${JSON.stringify(result).slice(0, 200)}`);
  }
  return result;
}

function toDetection(result: LlmResult): Detection {
  // Normalize network name — if not in our valid set, fall through
  let network = result.network;
  if (!VALID_NETWORKS.has(network)) {
    // Try case-insensitive match
    for (const valid of VALID_NETWORKS) {
      if (valid.toLowerCase() === network.toLowerCase()) {
        network = valid;
        break;
      }
    }
    // Still not found → treat as Unknown
    if (!VALID_NETWORKS.has(network)) {
      console.warn(`       ⚠ LLM returned unknown network "${result.network}", treating as Unknown`);
      network = "Unknown";
    }
  }

  const all: Record<string, number> = {};
  // Winner gets score 100
  all[network] = 100;
  // Mentioned chains each get score 1
  for (const chain of result.mentioned_chains) {
    if (chain !== network && !all[chain]) {
      all[chain] = 1;
    }
  }

  return {
    network,
    ecosystem: getEcosystem(network),
    confidence: result.confidence,
    evidence: [result.reasoning],
    all,
    reasoning: result.reasoning,
  };
}

export async function llmDetect(responseText: string, promptText: string): Promise<Detection> {
  const stdout = await spawnClaude(responseText, promptText);
  const result = parseResult(stdout);
  return toDetection(result);
}
