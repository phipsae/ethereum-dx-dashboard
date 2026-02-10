import { API_KEYS } from "../config.js";
import { AnthropicProvider } from "./anthropic.js";
import { GeminiProvider } from "./gemini.js";
import { OpenAIProvider } from "./openai.js";
import type { Provider } from "./types.js";

const providers = new Map<string, Provider>();

export function getProvider(providerName: string): Provider | undefined {
  if (providers.has(providerName)) {
    return providers.get(providerName);
  }

  const key = API_KEYS[providerName as keyof typeof API_KEYS];
  if (!key) return undefined;

  let provider: Provider;
  switch (providerName) {
    case "anthropic":
      provider = new AnthropicProvider(key);
      break;
    case "openai":
      provider = new OpenAIProvider(key);
      break;
    case "google":
      provider = new GeminiProvider(key);
      break;
    default:
      return undefined;
  }

  providers.set(providerName, provider);
  return provider;
}
