import OpenAI from "openai";
import { MAX_TOKENS } from "../config.js";
import type { Provider, ProviderResponse } from "./types.js";

// Reasoning models need extra tokens for internal chain-of-thought
const REASONING_MODELS = new Set(["gpt-5.2", "gpt-5-mini", "o3", "o3-mini", "o4-mini"]);
const REASONING_BUDGET = 8192;

export class OpenAIProvider implements Provider {
  name = "openai";
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async send(prompt: string, model: string): Promise<ProviderResponse> {
    const start = Date.now();

    const isReasoning = REASONING_MODELS.has(model);
    const maxTokens = isReasoning ? MAX_TOKENS + REASONING_BUDGET : MAX_TOKENS;

    const response = await this.client.chat.completions.create({
      model,
      max_completion_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });
    const latencyMs = Date.now() - start;

    const content = response.choices[0]?.message?.content ?? "";
    const usage = response.usage;

    return {
      content,
      model,
      provider: this.name,
      tokensUsed: usage ? usage.prompt_tokens + usage.completion_tokens : 0,
      latencyMs,
    };
  }
}
