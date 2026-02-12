import { execFile } from "node:child_process";
import type { Detection, Strength } from "../providers/types.js";
import { getEcosystem } from "./detector.js";

const VOTE_COUNT = 3;

const VALID_NETWORKS = new Set([
  "Mainnet", "Base", "Arbitrum", "Optimism", "Polygon", "zkSync", "Scroll",
  "Linea", "Mantle", "Unspecified", "BSC", "Avalanche", "Solana", "Sui",
  "Aptos", "Cosmos", "Near", "Polkadot", "TON", "Unknown",
]);

const VALID_STRENGTHS = new Set(["strong", "weak", "implicit"]);

const JSON_SCHEMA = JSON.stringify({
  type: "object",
  properties: {
    network: { type: "string", description: "The primary network the response favors" },
    strength: {
      type: "string",
      enum: ["strong", "weak", "implicit"],
      description: "How clear the chain preference is: strong = explicit recommendation or chain-specific code, weak = leans toward one chain but presents alternatives, implicit = bias only visible through code language/tooling (e.g. generic Solidity)",
    },
    reasoning: { type: "string", description: "1-2 sentence explanation" },
    mentioned_chains: {
      type: "array",
      items: { type: "string" },
      description: "All blockchain networks mentioned or discussed in the response",
    },
  },
  required: ["network", "strength", "reasoning", "mentioned_chains"],
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

Valid networks: Mainnet, Base, Arbitrum, Optimism, Polygon, zkSync, Scroll, Linea, Mantle, Unspecified, BSC, Avalanche, Solana, Sui, Aptos, Cosmos, Near, Polkadot, TON, Unknown

Strength (how clear the preference is):
- "strong": explicit recommendation by name, or code with chain-specific config (chain IDs, RPC URLs, deploy scripts)
- "weak": leans toward one chain but presents alternatives, or recommends a category ("use an L2") then picks one as example
- "implicit": bias only visible through code language or tooling choice (e.g. generic Solidity/EVM code without naming a chain)`;
}

interface LlmResult {
  network: string;
  strength: string;
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

  if (!result.network || !result.strength || !result.reasoning) {
    throw new Error(`Unexpected LLM output shape: ${JSON.stringify(result).slice(0, 200)}`);
  }
  return result;
}

function normalizeNetwork(network: string): string {
  if (VALID_NETWORKS.has(network)) return network;
  // Try case-insensitive match
  for (const valid of VALID_NETWORKS) {
    if (valid.toLowerCase() === network.toLowerCase()) return valid;
  }
  console.warn(`       ⚠ LLM returned unknown network "${network}", treating as Unknown`);
  return "Unknown";
}

function normalizeStrength(strength: string): Strength {
  const lower = strength.toLowerCase();
  if (VALID_STRENGTHS.has(lower)) return lower as Strength;
  // Fallback heuristic
  if (/strong|explicit|clear/i.test(strength)) return "strong";
  if (/weak|lean|alternative/i.test(strength)) return "weak";
  return "implicit";
}

function toDetection(result: LlmResult, voteCounts?: Map<string, number>): Detection {
  const network = normalizeNetwork(result.network);
  const strength = normalizeStrength(result.strength);

  const all: Record<string, number> = {};
  if (voteCounts) {
    // Use actual vote distribution (meaningful data)
    for (const [net, count] of voteCounts) {
      all[normalizeNetwork(net)] = count;
    }
  } else {
    all[network] = 1;
  }
  // Mentioned chains not already in vote counts
  for (const chain of result.mentioned_chains) {
    const normalized = normalizeNetwork(chain);
    if (!all[normalized]) {
      all[normalized] = 0;
    }
  }

  return {
    network,
    ecosystem: getEcosystem(network),
    strength,
    evidence: [result.reasoning],
    all,
    reasoning: result.reasoning,
  };
}

export async function llmDetect(responseText: string, promptText: string): Promise<Detection> {
  // Run classification multiple times concurrently for reliability
  const votePromises = Array.from({ length: VOTE_COUNT }, () =>
    spawnClaude(responseText, promptText).then(parseResult),
  );
  const votes = await Promise.all(votePromises);

  // Count network votes
  const networkCounts = new Map<string, number>();
  for (const vote of votes) {
    const net = normalizeNetwork(vote.network);
    networkCounts.set(net, (networkCounts.get(net) ?? 0) + 1);
  }

  // Find majority network
  const [majorityNetwork] = [...networkCounts.entries()]
    .sort((a, b) => b[1] - a[1])[0];

  // Use the first result that matches the majority
  const winningResult = votes.find(v => normalizeNetwork(v.network) === majorityNetwork) ?? votes[0];

  // Merge mentioned_chains from all votes (deduplicated)
  const allMentioned = new Set<string>();
  for (const vote of votes) {
    for (const chain of vote.mentioned_chains) allMentioned.add(chain);
  }
  winningResult.mentioned_chains = [...allMentioned];

  return toDetection(winningResult, networkCounts);
}
