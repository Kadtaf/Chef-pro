import { providerFetch, type ImageProvider } from './common.ts';

const API = 'https://api.stability.ai/v2beta/stable-image/generate/core';

/**
 * Stability AI — Stable Image Core. Best photo quality; free credits at sign-up
 * only. Returns WebP natively (4–5× lighter than PNG).
 */
export const stabilityProvider: ImageProvider = {
  id: 'stability',
  label: 'Stability',
  isConfigured: () => !!Deno.env.get('STABILITY_API_KEY'),
  async generate(brief) {
    const form = new FormData();
    form.append('prompt', brief.prompt.slice(0, 10_000));
    form.append('negative_prompt', brief.negativePrompt);
    form.append('aspect_ratio', brief.aspectRatio);
    form.append('output_format', 'webp');

    const response = await providerFetch(
      'Stability',
      API,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${Deno.env.get('STABILITY_API_KEY')}`, Accept: 'image/*' },
        body: form,
      },
      60_000,
    );
    return { bytes: new Uint8Array(await response.arrayBuffer()), model: 'stability-core' };
  },
};
