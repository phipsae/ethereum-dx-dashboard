export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const DEFAULT_DELAY_MS = 2000;

const PROVIDER_DELAYS: Record<string, number> = {
  anthropic: 2000,
  openai: 1500,
  google: 1000,
};

export function getDelay(provider: string): number {
  return PROVIDER_DELAYS[provider] ?? DEFAULT_DELAY_MS;
}
