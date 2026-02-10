import OpenAI from "openai";
import { MAX_TOKENS } from "../config.js";
import type { Provider, ProviderResponse } from "./types.js";

export class OpenAIProvider implements Provider {
  name = "openai";
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async send(prompt: string, model: string): Promise<ProviderResponse> {
    const start = Date.now();
    const response = await this.client.chat.completions.create({
      model,
      max_completion_tokens: MAX_TOKENS,
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
