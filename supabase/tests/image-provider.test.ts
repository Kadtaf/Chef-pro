/**
 * Fallback chain of the image providers (edge function module, run under Node
 * with a stubbed Deno.env and fetch).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const WEBP = new Uint8Array(
  [...'RIFF']
    .map((c) => c.charCodeAt(0))
    .concat(
      [0, 0, 0, 0],
      [...'WEBP'].map((c) => c.charCodeAt(0)),
    ),
);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const base64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');

const brief = { prompt: 'a plated dish', negativePrompt: 'text', aspectRatio: '3:2' as const };

let env: Record<string, string>;
let fetchMock: ReturnType<typeof vi.fn>;

async function load() {
  vi.resetModules();
  return import('../functions/_shared/image-provider.ts');
}

beforeEach(() => {
  env = {
    STABILITY_API_KEY: 'sk-test',
    CLOUDFLARE_ACCOUNT_ID: 'acc',
    CLOUDFLARE_API_TOKEN: 'cf-test',
    HUGGINGFACE_API_TOKEN: 'hf-test',
  };
  vi.stubGlobal('Deno', { env: { get: (name: string) => env[name] } });
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const hostOf = (call: unknown[]) => new URL(String(call[0])).host;

describe('image provider chain', () => {
  it('uses Stability when it works', async () => {
    fetchMock.mockResolvedValueOnce(new Response(WEBP, { status: 200 }));
    const { generateImage } = await load();
    const image = await generateImage(brief);
    expect(image).toMatchObject({ provider: 'stability', contentType: 'image/webp' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to Cloudflare when Stability credits are exhausted', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('{"name":"payment_required"}', { status: 402 }))
      .mockResolvedValueOnce(Response.json({ success: true, result: { image: base64(JPEG) } }));
    const { generateImage } = await load();
    const image = await generateImage(brief);
    expect(image).toMatchObject({ provider: 'cloudflare', contentType: 'image/jpeg' });
    expect(fetchMock.mock.calls.map(hostOf)).toEqual(['api.stability.ai', 'api.cloudflare.com']);
  });

  it('falls back to Hugging Face on timeouts and invalid payloads', async () => {
    fetchMock
      .mockRejectedValueOnce(new DOMException('timeout', 'TimeoutError'))
      .mockResolvedValueOnce(Response.json({ success: false, errors: [] }))
      .mockResolvedValueOnce(new Response(JPEG, { status: 200 }));
    const { generateImage } = await load();
    expect(await generateImage(brief)).toMatchObject({ provider: 'huggingface' });
  });

  it('skips providers without credentials and honours IMAGE_PROVIDERS', async () => {
    delete env.STABILITY_API_KEY;
    env.IMAGE_PROVIDERS = 'huggingface,stability,cloudflare';
    fetchMock.mockResolvedValueOnce(new Response(JPEG, { status: 200 }));
    const { generateImage } = await load();
    expect(await generateImage(brief)).toMatchObject({ provider: 'huggingface' });
    expect(fetchMock.mock.calls.map(hostOf)).toEqual(['router.huggingface.co']);
  });

  it('rejects a response that is not an image', async () => {
    env = { STABILITY_API_KEY: 'sk-test' };
    fetchMock.mockResolvedValueOnce(new Response('<html>oops</html>', { status: 200 }));
    const { generateImage } = await load();
    await expect(generateImage(brief)).rejects.toThrow(/Stability : fichier image invalide/);
  });

  it('reports every reason when all providers fail', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(new Response('', { status: 401 }));
    const { generateImage } = await load();
    await expect(generateImage(brief)).rejects.toThrow(
      'Stability : quota atteint · Cloudflare : service indisponible · Hugging Face : clé refusée',
    );
  });

  it('explains how to configure a provider when none is set up', async () => {
    env = {};
    const { generateImage } = await load();
    await expect(generateImage(brief)).rejects.toThrow(/Aucun service d'images configuré/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
