import { GoogleGenerativeAI } from "@google/generative-ai";
import { MAX_TOKENS } from "../config.js";
import type { Provider, ProviderResponse } from "./types.js";

export class GeminiProvider implements Provider {
  name = "google";
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async send(prompt: string, model: string): Promise<ProviderResponse> {
    const genModel = this.genAI.getGenerativeModel({
      model,
      generationConfig: { maxOutputTokens: MAX_TOKENS },
    });

    const start = Date.now();
    const result = await genModel.generateContent(prompt);
    const latencyMs = Date.now() - start;

    const response = result.response;
    const content = response.text();
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
