import { ProviderError, providerFetch, sleep, type ChatParams, type TextProvider } from './common.ts';

const API = 'https://generativelanguage.googleapis.com/v1beta/models';
/**
 * `gemini-flash-latest` always points to Google's current Flash model, so the
 * Studio keeps working when a dated version is retired (gemini-1.5-flash was).
 * Pin a version with the GEMINI_MODEL secret if you need reproducible output.
 */
const MODEL = () => Deno.env.get('GEMINI_MODEL') ?? 'gemini-flash-latest';
/** Lighter Gemini model tried when the main one is saturated. */
const LITE_MODEL = () => Deno.env.get('GEMINI_FALLBACK_MODEL') ?? 'gemini-flash-lite-latest';

/** Overloads and short-lived rate limits are worth a retry; a daily quota is not. */
function isTransient(error: ProviderError): boolean {
  if (error.status === 429) return !/per ?day|PerDay/i.test(error.body);
  return error.status === null || error.status === 500 || error.status === 503;
}

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: unknown;
};

async function callModel(model: string, params: ChatParams) {
  let response: Response;
  try {
    response = await providerFetch(
      'Gemini',
      `${API}/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        // Key in a header rather than the URL, so it never ends up in logs.
        headers: { 'x-goog-api-key': Deno.env.get('GEMINI_API_KEY')!, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: params.system }] },
          contents: [{ role: 'user', parts: [{ text: params.user }] }],
          generationConfig: {
            temperature: params.temperature,
            responseMimeType: 'application/json',
            // Generous: recent Flash models "think" and that counts as output.
            maxOutputTokens: 16_384,
          },
        }),
      },
      60_000,
    );
  } catch (error) {
    if (error instanceof ProviderError && error.status === 400 && error.body.includes('API_KEY_INVALID'))
      throw new ProviderError('Gemini', 401, 'clé refusée', error.body);
    if (error instanceof ProviderError && error.status === 404)
      throw new ProviderError('Gemini', 404, `modèle ${model} introuvable`, error.body);
    if (error instanceof ProviderError && error.status && error.status >= 500)
      throw new ProviderError('Gemini', error.status, 'surchargé', error.body);
    throw error;
  }

  const data = (await response.json()) as GeminiResponse;
  if (data.promptFeedback?.blockReason)
    throw new ProviderError('Gemini', null, `demande bloquée par le filtre (${data.promptFeedback.blockReason})`);
  const candidate = data.candidates?.[0];
  const content = (candidate?.content?.parts ?? [])
    .filter((part) => !part.thought)
    .map((part) => part.text ?? '')
    .join('');
  if (!content && candidate?.finishReason) console.error('Gemini returned no content', candidate.finishReason);
  // An empty or truncated answer fails JSON parsing and triggers the caller's retry.
  return { content, usage: data.usageMetadata };
}

/**
 * Google Gemini Flash (free tier) — main text provider. Free-tier overloads are
 * frequent and short: the main model is tried twice, then the lighter model,
 * before the chain moves on to another provider.
 */
export const geminiProvider: TextProvider = {
  id: 'gemini',
  label: 'Gemini',
  isConfigured: () => !!Deno.env.get('GEMINI_API_KEY'),
  async chatJson(params) {
    const plan = [
      { model: MODEL(), wait: 0 },
      { model: MODEL(), wait: 2_000 },
      { model: LITE_MODEL(), wait: 1_000 },
    ].filter((step, index) => index < 2 || step.model !== MODEL());

    let last: ProviderError | undefined;
    for (const { model, wait } of plan) {
      if (last && wait) await sleep(wait);
      try {
        return { ...(await callModel(model, params)), model };
      } catch (error) {
        if (!(error instanceof ProviderError) || !isTransient(error)) throw error;
        console.warn(`Gemini ${model} unavailable (${error.reason}), retrying`);
        last = error;
      }
    }
    throw last!;
  },
};
