import Anthropic from "@anthropic-ai/sdk";
import { MAX_TOKENS } from "../config.js";
import type { Provider, ProviderResponse } from "./types.js";

export class AnthropicProvider implements Provider {
  name = "anthropic";
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async send(prompt: string, model: string, webSearch?: boolean): Promise<ProviderResponse> {
    const start = Date.now();

    // Build params — conditionally add web_search tool
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {
      model,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content: prompt }],
    };

    if (webSearch) {
      params.tools = [
        { type: "web_search_20250305", name: "web_search", max_uses: 5 },
      ];
    }

    const response = await this.client.messages.create(params);
    const latencyMs = Date.now() - start;

    const content = (response as any).content
      .filter((block: any) => block.type === "text")
      .map((block: any) => block.text)
      .join("\n");

    return {
      content,
      model,
      provider: this.name,
      tokensUsed: (response as any).usage.input_tokens + (response as any).usage.output_tokens,
      latencyMs,
    };
  }
}
