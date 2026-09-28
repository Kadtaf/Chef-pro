/**
 * Fallback chain of the text providers (edge function module, run under Node
 * with a stubbed Deno.env, fetch and instant retry pauses).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const params = { system: 'Réponds en JSON', user: 'Une recette', temperature: 0.5 };
const gemini = (text: string) => Response.json({ candidates: [{ content: { parts: [{ text }] } }] });
const openAi = (text: string) => Response.json({ choices: [{ message: { content: text } }] });
const overloaded = () => new Response('{"error":{"status":"UNAVAILABLE"}}', { status: 503 });

let env: Record<string, string>;
let fetchMock: ReturnType<typeof vi.fn>;

async function load() {
  vi.resetModules();
  return import('../functions/_shared/text-provider.ts');
}

const hosts = () => fetchMock.mock.calls.map((call) => new URL(String(call[0])).host);

beforeEach(() => {
  env = {
    GEMINI_API_KEY: 'g-test',
    GROQ_API_KEY: 'groq-test',
    CLOUDFLARE_ACCOUNT_ID: 'acc',
    CLOUDFLARE_API_TOKEN: 'cf-test',
  };
  vi.stubGlobal('Deno', { env: { get: (name: string) => env[name] } });
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  // Retry pauses resolve immediately.
  vi.stubGlobal('setTimeout', (callback: () => void) => {
    callback();
    return 0;
  });
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('text provider chain', () => {
  it('uses Gemini when it answers', async () => {
    fetchMock.mockResolvedValueOnce(gemini('{"title":"Velouté"}'));
    const { chatJson } = await load();
    expect(await chatJson(params)).toMatchObject({ provider: 'gemini', content: '{"title":"Velouté"}' });
  });

  it('retries Gemini, tries the lite model, then switches to Groq when overloaded', async () => {
    fetchMock
      .mockResolvedValueOnce(overloaded())
      .mockResolvedValueOnce(overloaded())
      .mockResolvedValueOnce(overloaded())
      .mockResolvedValueOnce(openAi('{"title":"Velouté"}'));
    const { chatJson } = await load();
    const result = await chatJson(params);
    expect(result).toMatchObject({ provider: 'groq', model: 'groq:llama-3.3-70b-versatile' });
    expect(hosts()).toEqual([
      'generativelanguage.googleapis.com',
      'generativelanguage.googleapis.com',
      'generativelanguage.googleapis.com',
      'api.groq.com',
    ]);
    expect(String(fetchMock.mock.calls[2]![0])).toContain('gemini-flash-lite-latest');
  });

  it('does not retry Gemini when its daily quota is exhausted', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('{"error":{"message":"GenerateRequestsPerDay exceeded"}}', { status: 429 }))
      .mockResolvedValueOnce(openAi('{}'));
    const { chatJson } = await load();
    expect(await chatJson(params)).toMatchObject({ provider: 'groq' });
    expect(hosts()).toEqual(['generativelanguage.googleapis.com', 'api.groq.com']);
  });

  it('falls back to Cloudflare, accepting an already-parsed JSON answer', async () => {
    delete env.GEMINI_API_KEY;
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValueOnce(Response.json({ success: true, result: { response: { title: 'Velouté' } } }));
    const { chatJson } = await load();
    expect(await chatJson(params)).toMatchObject({ provider: 'cloudflare', content: '{"title":"Velouté"}' });
  });

  it('reports every reason when all providers fail', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('{"error":{"details":[{"reason":"API_KEY_INVALID"}]}}', { status: 400 }))
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValueOnce(Response.json({ success: false }));
    const { chatJson } = await load();
    await expect(chatJson(params)).rejects.toThrow(
      'Gemini : clé refusée · Groq : quota atteint · Cloudflare : aucune réponse renvoyée',
    );
  });

  it('explains how to configure a provider when none is set up', async () => {
    env = {};
    const { assertTextProviderConfigured } = await load();
    expect(() => assertTextProviderConfigured()).toThrow(/Aucune IA de rédaction configurée/);
  });
});
