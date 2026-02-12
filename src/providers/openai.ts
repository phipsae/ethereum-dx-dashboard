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

  async send(prompt: string, model: string, webSearch?: boolean): Promise<ProviderResponse> {
    const start = Date.now();

    if (webSearch) {
      return this.sendWithWebSearch(prompt, model, start);
    }

    const isReasoning = REASONING_MODELS.has(model);
    const maxTokens = isReasoning ? MAX_TOKENS + REASONING_BUDGET : MAX_TOKENS;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {
      model,
      max_completion_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    };

    const response = await this.client.chat.completions.create(params);
    const latencyMs = Date.now() - start;

    const content = response.choices?.[0]?.message?.content ?? "";
    const usage = response.usage;

    return {
      content,
      model,
      provider: this.name,
      tokensUsed: usage ? usage.prompt_tokens + usage.completion_tokens : 0,
      latencyMs,
    };
  }

  private async sendWithWebSearch(
    prompt: string,
    model: string,
    start: number
  ): Promise<ProviderResponse> {
    const isReasoning = REASONING_MODELS.has(model);
    const maxTokens = isReasoning ? MAX_TOKENS + REASONING_BUDGET : MAX_TOKENS;

    // Use Responses API with web_search tool
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {
      model,
      max_output_tokens: maxTokens,
      input: prompt,
      tools: [{ type: "web_search" }],
    };

    const response = await this.client.responses.create(params);
    const latencyMs = Date.now() - start;

    // Extract text from output items
    let content = "";
    let tokensUsed = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of (response as any).output ?? []) {
      if (item.type === "message") {
        for (const part of item.content ?? []) {
          if (part.type === "output_text") content += part.text;
        }
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const usage = (response as any).usage;
    if (usage) {
      tokensUsed = (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0);
    }

    return {
      content,
      model,
      provider: this.name,
      tokensUsed,
      latencyMs,
    };
  }
}
