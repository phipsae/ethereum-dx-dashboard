# Chain Bias Benchmark

When you ask an AI to "build me a token launch platform" without specifying a blockchain, which chain does it pick? Ethereum? Solana? Base?

This project measures that default bias across major LLMs.

## How it works

1. **Vague prompts** — 12 blockchain-related prompts (DeFi, NFTs, DAOs, etc.) that deliberately never mention a specific chain
2. **Multiple models** — Each prompt is sent to 6 models (Claude, GPT, Gemini) across flagship and mid-tier variants
3. **Standard & Web Search modes** — Runs can optionally enable web search to see how real-time info shifts chain preferences
4. **Parse & classify** — Responses are parsed to extract which blockchain, network, and tools each model defaults to
5. **Dashboard** — Results visualized at [chain-bias-dashboard.vercel.app](https://chain-bias-dashboard.vercel.app) with a toggle to compare Standard vs Web Search results

> **Note:** This benchmark uses direct API calls, not the ChatGPT/Claude web apps. Results may differ from those interfaces due to hidden system prompts, extra tools, and moderation layers. See the dashboard for details.

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
