# Chain Bias Dashboard

When you ask an AI to "build me a token launch platform" without specifying a blockchain, which chain does it pick? Ethereum? Solana? Base?

This project measures that default bias across major LLMs.

**Live dashboard**: [chain-bias-dashboard.vercel.app](https://chain-bias-dashboard.vercel.app)

## Key Findings

- **Ethereum dominates**: Across all models (Gemini, ChatGPT, Claude), the Ethereum ecosystem (Mainnet + L2s) is the default recommendation in 83% of cases. Solana gets just 5%, and the rest is chain-agnostic.

- **Implicit by default**: In 75% of those Ethereum-biased responses, models don't even name a chain - they just write Solidity with OpenZeppelin and ethers.js. Only 25% explicitly recommend a specific network like Mainnet, Base, or Polygon.

- **Memecoins break the pattern**: The one prompt that consistently pulls models toward Solana (12 of 14 total Solana picks come from here). Gemini Flash picks Solana every single time - biggest fanboy.

- **Mid-tier models are more biased**: Mid-tier models (GPT-5 mini, Sonnet 4.5, Gemini Flash) show stronger Ethereum bias (73-90%) than flagship models (GPT-5.2, Opus 4.6, Gemini Pro), which are more likely to stay chain-agnostic or suggest alternatives.

- **Web search barely matters**: Surprisingly, enabling web search barely shifts the results compared to base models.

- **The invisible hand of Solidity**: Models don't say "use Ethereum" - they just write Solidity. Developers may not even realize they're being steered. This implicit bias is the most significant finding.
  - Base is a "Gemini brand" - 9 of 11 Base picks come from Google's models.
  - Claude Opus is uniquely cautious - the only model that refuses memecoin/prediction market prompts (with web search on), and sometimes builds Web2 apps instead of blockchain apps.
  - No model ever picks Avalanche, Cosmos, or any non-EVM chain besides Solana.

## Methodology

12 chain-agnostic blockchain prompts sent to 6 AI models (2 runs each, with and without web search). An LLM classifier detects which chain and tools each response defaults to. 287 total responses.

## Caveats

Small sample size (2 runs per model), single LLM classifier, and API-only testing - chat products (ChatGPT, Claude.ai, Gemini) may behave differently due to system prompts and moderation layers.

## Next Steps

Expand prompt coverage beyond blockchain use cases, increase sample size with more runs per model, run benchmarks monthly to see how model defaults shift, and explore new dimensions that matter for developer experience.

## How it works

1. **Vague prompts** - 12 blockchain-related prompts (DeFi, NFTs, DAOs, etc.) that deliberately never mention a specific chain
2. **Multiple models** - Each prompt is sent to 6 models (Claude, GPT, Gemini) across flagship and mid-tier variants
3. **Standard & Web Search modes** - Runs can optionally enable web search to see how real-time info shifts chain preferences
4. **Parse & classify** - Responses are classified by an LLM to extract which blockchain, network, and tools each model defaults to
5. **Dashboard** - Results visualized at [chain-bias-dashboard.vercel.app](https://chain-bias-dashboard.vercel.app)

## Quick start

```bash
# Run the benchmark
cp .env.example .env  # add your API keys
npm install
npx tsx src/index.ts run --runs 2

# Start the dashboard
cd dashboard
npm install
npm run dev
```

## Project structure

```
src/          # Benchmark runner, prompt definitions, model providers, parsers
dashboard/    # Next.js dashboard (deployed to Vercel)
results/      # Raw benchmark output (JSON)
```
