import { HttpError } from './http.ts';
import type { IMAGE_ASPECT_RATIOS } from './vocabulary.ts';

const API = 'https://api.stability.ai/v2beta/stable-image/generate/core';
export const IMAGE_MODEL = 'stability-core';

export type AspectRatio = (typeof IMAGE_ASPECT_RATIOS)[number];

/** Returns the API key, with an explicit message when the secret is missing. */
export function stabilityKey(): string {
  const key = Deno.env.get('STABILITY_API_KEY');
  if (!key)
    throw new HttpError(500, 'Secret STABILITY_API_KEY manquant : ajoutez-le dans Supabase → Edge Functions → Secrets');
  return key;
}

function providerError(status: number, body: string): HttpError {
  const detail = `Stability → HTTP ${status} ${body.slice(0, 200)}`;
  switch (status) {
    case 401:
      return new HttpError(502, `Clé Stability refusée : vérifiez le secret STABILITY_API_KEY (${detail})`);
    case 402:
      return new HttpError(502, `Crédits Stability épuisés : rechargez sur platform.stability.ai (${detail})`);
    case 403:
    case 422:
      return new HttpError(
        422,
        `Description refusée par le filtre de Stability : reformulez le titre ou la description (${detail})`,
      );
    case 429:
      return new HttpError(503, `Trop de requêtes Stability : réessayez dans une minute (${detail})`);
    default:
      return new HttpError(502, `La génération de la photo a échoué (${detail})`);
  }
}

/** Generates one WebP image (4–5× lighter than PNG, same visual quality) with Stable Image Core. */
export async function generateImage(
  apiKey: string,
  params: { prompt: string; negativePrompt: string; aspectRatio: AspectRatio },
): Promise<Uint8Array> {
  const form = new FormData();
  form.append('prompt', params.prompt.slice(0, 10_000));
  form.append('negative_prompt', params.negativePrompt);
  form.append('aspect_ratio', params.aspectRatio);
  form.append('output_format', 'webp');

  let response: Response;
  try {
    response = await fetch(API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'image/*' },
      body: form,
      signal: AbortSignal.timeout(90_000),
    });
  } catch (error) {
    console.error('Stability request failed', error);
    throw new HttpError(504, 'Stability ne répond pas : réessayez dans quelques instants');
  }
  if (!response.ok) {
    const body = await response.text();
    console.error('Stability failed', response.status, body);
    throw providerError(response.status, body);
  }
  return new Uint8Array(await response.arrayBuffer());
}
