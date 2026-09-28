/** Types and helpers shared by the image providers and the fallback chain. */
import type { IMAGE_ASPECT_RATIOS } from '../vocabulary.ts';

export type AspectRatio = (typeof IMAGE_ASPECT_RATIOS)[number];

export type ImageBrief = {
  /** Positive prompt (English works best for every model). */
  prompt: string;
  /** What to avoid: sent natively when supported, appended as an instruction otherwise. */
  negativePrompt: string;
  aspectRatio: AspectRatio;
};

export type GeneratedImage = { bytes: Uint8Array; contentType: ImageContentType; provider: string; model: string };
export type ImageContentType = 'image/webp' | 'image/jpeg' | 'image/png';

export type ImageProvider = {
  id: string;
  label: string;
  /** False when the provider's secrets are missing: it is skipped silently. */
  isConfigured(): boolean;
  generate(brief: ImageBrief): Promise<{ bytes: Uint8Array; model: string }>;
};

export { ProviderError as ImageProviderError, describeStatus, providerFetch } from '../provider-http.ts';
