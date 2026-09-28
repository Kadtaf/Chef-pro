/** Types shared by the text providers and the fallback chain. */
export { ProviderError, providerFetch } from '../provider-http.ts';

export type ChatParams = { system: string; user: string; temperature: number };
export type ChatResult = { content: string; usage: unknown; model: string };

export type TextProvider = {
  id: string;
  label: string;
  /** False when the provider's secrets are missing: it is skipped silently. */
  isConfigured(): boolean;
  /** Returns the raw text of a JSON object (validated by the caller). */
  chatJson(params: ChatParams): Promise<ChatResult>;
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Output budget for a full recipe / menu JSON. */
export const MAX_OUTPUT_TOKENS = 8_000;
