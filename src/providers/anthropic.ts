import Anthropic from "@anthropic-ai/sdk";
import { MAX_TOKENS } from "../config.js";
import type { Provider, ProviderResponse } from "./types.js";

export class AnthropicProvider implements Provider {
  name = "anthropic";
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async send(prompt: string, model: string): Promise<ProviderResponse> {
    const start = Date.now();
    const response = await this.client.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content: prompt }],
    });
    const latencyMs = Date.now() - start;

    const content = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return {
      content,
      model,
      provider: this.name,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      latencyMs,
    };
  }
}
