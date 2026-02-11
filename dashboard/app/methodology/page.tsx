const PROMPTS = [
  { id: "token-launch", category: "DeFi", text: "Build me a platform where creators can launch their own cryptocurrency and let people trade it." },
  { id: "memecoin", category: "DeFi", text: "Help me create and launch a meme coin with a website where people can buy it directly." },
  { id: "prediction-market", category: "DeFi", text: "Create a platform where users can place bets on real-world events using crypto, with automatic payouts." },
  { id: "nft-marketplace", category: "NFT", text: "Create a marketplace for digital collectibles where artists can sell their work and earn on resales." },
  { id: "dao-voting", category: "Governance", text: "Build a community voting system where coin holders can submit proposals and vote on decisions." },
  { id: "onchain-game", category: "Gaming", text: "Build a blockchain game where players can collect, trade, and battle with digital creatures." },
  { id: "which-chain", category: "Recommendation", text: "I want to build a crypto app. Which blockchain should I build on and why?" },
  { id: "ai-agent", category: "Agent", text: "Build me an AI agent that can autonomously trade crypto and manage a wallet." },
  { id: "token-bridge", category: "Infrastructure", text: "Build a way for users to move their crypto between two different blockchains." },
  { id: "block-explorer", category: "Infrastructure", text: "Create a website that lets people look up transactions, wallet balances, and activity on a blockchain." },
  { id: "social-tipping", category: "Social", text: "Build a platform where fans can send crypto tips to their favorite content creators." },
  { id: "name-service", category: "Registry", text: "Create a service where people can register a readable name for their crypto wallet instead of a long address." },
];

const MODELS = [
  { name: "Claude Opus 4.6", provider: "Anthropic", tier: "Flagship" },
  { name: "Claude Sonnet 4.5", provider: "Anthropic", tier: "Mid-tier" },
  { name: "GPT-5.2", provider: "OpenAI", tier: "Flagship" },
  { name: "GPT-5 Mini", provider: "OpenAI", tier: "Mid-tier" },
  { name: "Gemini 3 Pro", provider: "Google", tier: "Flagship" },
  { name: "Gemini 3 Flash", provider: "Google", tier: "Mid-tier" },
];

const CHAINS = [
  "Ethereum", "Solana", "Sui", "Aptos", "Cosmos", "Near", "Polkadot",
  "Polygon", "Base", "Avalanche", "TON",
];

export default function MethodologyPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white">Methodology</h1>
        <p className="mt-2 text-[#a0a0b0]">
          How we measure blockchain ecosystem bias in AI model responses.
        </p>
      </div>

      {/* What is chain bias */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          What is Chain Bias?
        </h2>
        <div className="space-y-3 text-sm leading-relaxed text-[#e0e0e0]">
          <p>
            When you ask an AI model to &quot;build me a DeFi app&quot; or &quot;create an NFT marketplace&quot;
            without specifying a blockchain, the model must choose one. This choice reveals an
            implicit bias toward certain blockchain ecosystems in the model&apos;s training data and
            response tendencies.
          </p>
          <p>
            <strong className="text-white">Why it matters:</strong> AI coding assistants are
            increasingly used to scaffold blockchain projects. If models consistently default to
            one chain (e.g., Ethereum), they may inadvertently steer developers away from
            alternatives that could be better suited for their use case. This has implications for
            ecosystem diversity, developer onboarding, and the competitive landscape of
            blockchain platforms.
          </p>
          <p>
            This benchmark measures which blockchain each model defaults to across a variety of
            chain-agnostic prompts, providing transparency into these tendencies.
          </p>
        </div>
      </section>

      {/* The prompts */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          The 12 Prompts
        </h2>
        <p className="mb-4 text-sm text-[#a0a0b0]">
          Each prompt is deliberately chain-agnostic &mdash; none mentions a specific blockchain.
          They span 8 categories to cover different use cases.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse overflow-hidden rounded-lg bg-[#16213e]">
            <thead>
              <tr className="bg-[#0f3460]">
                <th className="border-b border-[#0f3460] px-3 py-2 text-left text-sm font-semibold text-white">#</th>
                <th className="border-b border-[#0f3460] px-3 py-2 text-left text-sm font-semibold text-white">ID</th>
                <th className="border-b border-[#0f3460] px-3 py-2 text-left text-sm font-semibold text-white">Category</th>
                <th className="border-b border-[#0f3460] px-3 py-2 text-left text-sm font-semibold text-white">Prompt</th>
              </tr>
            </thead>
            <tbody>
              {PROMPTS.map((p, i) => (
                <tr key={p.id} className="border-b border-[#0f3460]">
                  <td className="px-3 py-2 text-sm text-[#a0a0b0]">{i + 1}</td>
                  <td className="px-3 py-2 font-mono text-sm text-[#e94560]">{p.id}</td>
                  <td className="px-3 py-2 text-sm">
                    <span className="rounded-full bg-[#0f3460] px-2 py-0.5 text-xs text-[#e0e0e0]">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm text-[#e0e0e0]">{p.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detection */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          How Detection Works
        </h2>
        <div className="space-y-4 text-sm leading-relaxed text-[#e0e0e0]">
          <div>
            <h3 className="mb-2 font-semibold text-white">Chain Detection</h3>
            <p>
              Each model response is analyzed for chain-specific signals using weighted pattern
              matching. Signals include:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-[#a0a0b0]">
              <li>Language/framework references (e.g., <code className="text-[#e94560]">pragma solidity</code>, <code className="text-[#e94560]">anchor_lang</code>)</li>
              <li>SDK imports (e.g., <code className="text-[#e94560]">ethers.js</code>, <code className="text-[#e94560]">@solana/web3.js</code>)</li>
              <li>Tool mentions (e.g., Hardhat, Foundry, Metaplex)</li>
              <li>Token standards (e.g., ERC-20, SPL Token)</li>
              <li>Explicit chain names</li>
            </ul>
            <p className="mt-2">
              Each signal has a weight (3&ndash;10). The chain with the highest total weighted
              score is selected. Confidence = top chain score / total score across all chains.
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-white">Chains Detected</h3>
            <div className="flex flex-wrap gap-2">
              {CHAINS.map((chain) => (
                <span
                  key={chain}
                  className="rounded-full border border-[#0f3460] px-3 py-1 text-xs"
                >
                  {chain}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-white">EVM Network Detection</h3>
            <p>
              For EVM-family chains (Ethereum, Polygon, Base, Avalanche, BSC), a secondary
              analysis detects the specific network via chain IDs, block explorer URLs, RPC
              endpoints, and explicit network names (e.g., &quot;Base Sepolia&quot;, &quot;Arbitrum One&quot;).
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-white">Behavior Classification</h3>
            <p>Responses are classified as one of:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-[#a0a0b0]">
              <li><strong className="text-[#4bc0c0]">just-built</strong> &mdash; Model immediately produced code for a specific chain</li>
              <li><strong className="text-[#ff6384]">asked-questions</strong> &mdash; Model asked clarifying questions before choosing</li>
              <li><strong className="text-[#ffcd56]">mixed</strong> &mdash; Model discussed options but also produced code</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Models */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          Models Tested
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse overflow-hidden rounded-lg bg-[#16213e]">
            <thead>
              <tr className="bg-[#0f3460]">
                <th className="border-b border-[#0f3460] px-3 py-2 text-left text-sm font-semibold text-white">Model</th>
                <th className="border-b border-[#0f3460] px-3 py-2 text-left text-sm font-semibold text-white">Provider</th>
                <th className="border-b border-[#0f3460] px-3 py-2 text-left text-sm font-semibold text-white">Tier</th>
              </tr>
            </thead>
            <tbody>
              {MODELS.map((m) => (
                <tr key={m.name} className="border-b border-[#0f3460]">
                  <td className="px-3 py-2 text-sm text-[#e0e0e0]">{m.name}</td>
                  <td className="px-3 py-2 text-sm text-[#a0a0b0]">{m.provider}</td>
                  <td className="px-3 py-2 text-sm">
                    <span className="rounded-full bg-[#0f3460] px-2 py-0.5 text-xs text-[#e0e0e0]">
                      {m.tier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Limitations */}
      <section>
        <h2 className="mb-4 border-b-2 border-[#0f3460] pb-2 text-lg font-semibold text-white">
          Limitations & Caveats
        </h2>
        <div className="space-y-3 text-sm leading-relaxed text-[#e0e0e0]">
          <ul className="list-inside list-disc space-y-2 text-[#a0a0b0]">
            <li>
              <strong className="text-white">Prompt design:</strong> The 12 prompts are
              intentionally generic but may not cover all possible blockchain use cases. Results
              may differ with more specific or technical prompts.
            </li>
            <li>
              <strong className="text-white">Detection accuracy:</strong> Pattern matching
              cannot capture every nuance. A response mentioning Ethereum&apos;s EVM while building
              on Polygon might be misclassified. Confidence scores help indicate certainty.
            </li>
            <li>
              <strong className="text-white">Temporal variance:</strong> Model responses can
              vary between runs. Multiple runs help establish statistical significance, but
              single-run results should be interpreted cautiously.
            </li>
            <li>
              <strong className="text-white">Model updates:</strong> AI models are regularly
              updated. Results from one version may not apply to future versions. Each run is
              timestamped for reference.
            </li>
            <li>
              <strong className="text-white">Not a quality judgment:</strong> Defaulting to
              Ethereum (or any chain) is not inherently &quot;wrong&quot; &mdash; Ethereum has the largest
              developer ecosystem. This benchmark measures tendency, not correctness.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
