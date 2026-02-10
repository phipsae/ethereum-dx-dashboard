import "dotenv/config";
import type { ModelConfig } from "./providers/types.js";

export const MODELS: ModelConfig[] = [
  {
    id: "claude-opus-4-6",
    provider: "anthropic",
    tier: "flagship",
    displayName: "Claude Opus 4.6",
  },
  {
    id: "claude-sonnet-4-5-20250929",
    provider: "anthropic",
    tier: "mid-tier",
    displayName: "Claude Sonnet 4.5",
  },
  {
    id: "gpt-5.2",
    provider: "openai",
    tier: "flagship",
    displayName: "GPT-5.2",
  },
  {
    id: "gpt-5-mini",
    provider: "openai",
    tier: "mid-tier",
    displayName: "GPT-5 mini",
  },
  {
    id: "gemini-3-pro-preview",
    provider: "google",
    tier: "flagship",
    displayName: "Gemini 3 Pro",
  },
  {
    id: "gemini-3-flash-preview",
    provider: "google",
    tier: "mid-tier",
    displayName: "Gemini 3 Flash",
  },
];

export const MAX_TOKENS = 4096;

export const API_KEYS = {
  anthropic: process.env.ANTHROPIC_API_KEY,
  openai: process.env.OPENAI_API_KEY,
  google: process.env.GEMINI_API_KEY,
};

export function getAvailableModels(filterIds?: string[]): ModelConfig[] {
  let models = MODELS.filter((m) => API_KEYS[m.provider as keyof typeof API_KEYS]);
  if (filterIds && filterIds.length > 0) {
    models = models.filter((m) => filterIds.includes(m.id));
  }
  return models;
}
