import { ImageProviderError, providerFetch, type ImageProvider } from './common.ts';

const MODEL = '@cf/black-forest-labs/flux-1-schnell';

/**
 * Cloudflare Workers AI — FLUX.1 [schnell]. Free daily allowance (renewed every
 * day), no watermark. FLUX ignores negative prompts, so they are appended as an
 * instruction. Output is a square JPEG, cropped by the site's image frames.
 */
export const cloudflareProvider: ImageProvider = {
  id: 'cloudflare',
  label: 'Cloudflare',
  isConfigured: () => !!Deno.env.get('CLOUDFLARE_ACCOUNT_ID') && !!Deno.env.get('CLOUDFLARE_API_TOKEN'),
  async generate(brief) {
    const account = encodeURIComponent(Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!);
    const response = await providerFetch(
      'Cloudflare',
      `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${MODEL}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('CLOUDFLARE_API_TOKEN')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `${brief.prompt} Avoid: ${brief.negativePrompt}.`.slice(0, 2048),
          // Maximum allowed for schnell: best quality within the free allowance.
          steps: 8,
        }),
      },
      45_000,
    );
    const data = (await response.json()) as { success?: boolean; result?: { image?: string } };
    if (!data.success || !data.result?.image) throw new ImageProviderError('Cloudflare', null, 'aucune image renvoyée');
    return { bytes: Uint8Array.from(atob(data.result.image), (c) => c.charCodeAt(0)), model: `cloudflare:${MODEL}` };
  },
};
