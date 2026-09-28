import { MAX_OUTPUT_TOKENS, ProviderError, providerFetch, type TextProvider } from './common.ts';

const MODEL = () => Deno.env.get('CLOUDFLARE_TEXT_MODEL') ?? '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

/**
 * Cloudflare Workers AI — Llama 3.3 70B. Same free daily allowance and
 * credentials as the image fallback (CLOUDFLARE_ACCOUNT_ID / _API_TOKEN).
 * No native JSON mode is relied on: the system prompt demands pure JSON and the
 * caller validates (and retries) the answer.
 */
export const cloudflareTextProvider: TextProvider = {
  id: 'cloudflare',
  label: 'Cloudflare',
  isConfigured: () => !!Deno.env.get('CLOUDFLARE_ACCOUNT_ID') && !!Deno.env.get('CLOUDFLARE_API_TOKEN'),
  async chatJson(params) {
    const model = MODEL();
    const account = encodeURIComponent(Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!);
    const response = await providerFetch(
      'Cloudflare',
      `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('CLOUDFLARE_API_TOKEN')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: params.system },
            { role: 'user', content: params.user },
          ],
          temperature: params.temperature,
          // Workers AI defaults to 256 tokens: far too short for a recipe.
          max_tokens: MAX_OUTPUT_TOKENS,
        }),
      },
      60_000,
    );
    const data = (await response.json()) as {
      success?: boolean;
      result?: { response?: unknown; usage?: unknown };
    };
    if (!data.success || data.result?.response == null)
      throw new ProviderError('Cloudflare', null, 'aucune réponse renvoyée');
    const raw = data.result.response;
    // Some models already return parsed JSON.
    const content = typeof raw === 'string' ? raw : JSON.stringify(raw);
    return { content, usage: data.result.usage, model: `cloudflare:${model}` };
  },
};
