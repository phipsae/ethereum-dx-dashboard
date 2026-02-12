import { GoogleGenAI } from "@google/genai";
import { MAX_TOKENS } from "../config.js";
import type { Provider, ProviderResponse } from "./types.js";

export class GeminiProvider implements Provider {
  name = "google";
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async send(prompt: string, model: string, webSearch?: boolean): Promise<ProviderResponse> {
    const config: Record<string, unknown> = {
      maxOutputTokens: MAX_TOKENS,
    };

    if (webSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const start = Date.now();
    const response = await this.client.models.generateContent({
      model,
      contents: prompt,
      config,
    });
    const latencyMs = Date.now() - start;

    const content = response.text ?? "";
    const usage = response.usageMetadata;

    return {
      content,
      model,
      provider: this.name,
      tokensUsed: usage
        ? (usage.promptTokenCount ?? 0) + (usage.candidatesTokenCount ?? 0)
        : 0,
      latencyMs,
    };
  }
}
