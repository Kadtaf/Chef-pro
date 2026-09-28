import { MAX_OUTPUT_TOKENS, providerFetch, type TextProvider } from './common.ts';

const API = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = () => Deno.env.get('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';

/**
 * Groq — Llama 3.3 70B, free tier (rate-limited per minute and per day).
 * OpenAI-compatible API with a native JSON mode; very fast.
 */
export const groqProvider: TextProvider = {
  id: 'groq',
  label: 'Groq',
  isConfigured: () => !!Deno.env.get('GROQ_API_KEY'),
  async chatJson(params) {
    const model = MODEL();
    const response = await providerFetch(
      'Groq',
      API,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${Deno.env.get('GROQ_API_KEY')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: params.system },
            { role: 'user', content: params.user },
          ],
          response_format: { type: 'json_object' },
          temperature: params.temperature,
          max_tokens: MAX_OUTPUT_TOKENS,
        }),
      },
      60_000,
    );
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[]; usage?: unknown };
    return { content: data.choices?.[0]?.message?.content ?? '', usage: data.usage, model: `groq:${model}` };
  },
};
