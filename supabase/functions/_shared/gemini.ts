import { HttpError } from './http.ts';

const API = 'https://generativelanguage.googleapis.com/v1beta/models';
/**
 * `gemini-flash-latest` always points to Google's current Flash model, so the
 * Studio keeps working when a dated version is retired (gemini-1.5-flash was).
 * Pin a version with the GEMINI_MODEL secret if you need reproducible output.
 */
export const CHAT_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-flash-latest';
/** Lighter model used when the main one is saturated (HTTP 503/429). */
const FALLBACK_MODEL = Deno.env.get('GEMINI_FALLBACK_MODEL') ?? 'gemini-flash-lite-latest';

/** Statuses worth retrying: overload and short-lived rate limits. */
const TRANSIENT = new Set([429, 500, 503]);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Returns the API key, with an explicit message when the secret is missing. */
export function geminiKey(): string {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key)
    throw new HttpError(500, 'Secret GEMINI_API_KEY manquant : ajoutez-le dans Supabase → Edge Functions → Secrets');
  return key;
}

function providerError(status: number, body: string): HttpError {
  // Google's own reason (never contains the key) makes admin-side diagnosis possible.
  const detail = `Gemini → HTTP ${status} ${body.slice(0, 200)}`;
  if ((status === 400 && body.includes('API_KEY_INVALID')) || status === 401)
    return new HttpError(502, `Clé Gemini refusée : vérifiez le secret GEMINI_API_KEY (${detail})`);
  switch (status) {
    case 403:
      return new HttpError(
        502,
        `Accès Gemini refusé : activez l'API « Generative Language » du projet Google (${detail})`,
      );
    case 404:
      return new HttpError(502, `Modèle Gemini introuvable : vérifiez le secret GEMINI_MODEL (${detail})`);
    case 429:
      return new HttpError(503, `Quota gratuit Gemini atteint : réessayez dans une minute ou demain (${detail})`);
    case 500:
    case 503:
      return new HttpError(
        503,
        `Gemini est surchargé (modèle principal et modèle de secours) : réessayez dans quelques minutes (${detail})`,
      );
    default:
      return new HttpError(502, `Le service de rédaction IA a échoué (${detail})`);
  }
}

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: unknown;
};

type ChatParams = { system: string; user: string; temperature: number };

/**
 * Asks Gemini for a JSON object (JSON mode). Free-tier overloads are frequent
 * and short: each model is tried twice (with a pause), then the lighter
 * fallback model takes over, all within the edge function time budget.
 */
export async function chatJson(
  apiKey: string,
  params: ChatParams,
): Promise<{ content: string; usage: unknown; model: string }> {
  const plan = [
    { model: CHAT_MODEL, waitBefore: 0 },
    { model: CHAT_MODEL, waitBefore: 2_000 },
    { model: FALLBACK_MODEL, waitBefore: 1_000 },
    { model: FALLBACK_MODEL, waitBefore: 4_000 },
  ].filter((step, index, all) => index < 2 || step.model !== all[0]!.model);

  let lastError: HttpError | undefined;
  for (const { model, waitBefore } of plan) {
    if (lastError && waitBefore) await sleep(waitBefore);
    try {
      return { ...(await callModel(apiKey, model, params)), model };
    } catch (error) {
      if (!(error instanceof TransientError)) throw error;
      console.warn(`Gemini ${model} unavailable (HTTP ${error.status}), retrying`);
      lastError = error.httpError;
    }
  }
  throw lastError!;
}

class TransientError extends Error {
  constructor(
    readonly status: number,
    readonly httpError: HttpError,
  ) {
    super(httpError.message);
  }
}

async function callModel(
  apiKey: string,
  model: string,
  params: ChatParams,
): Promise<{ content: string; usage: unknown }> {
  let response: Response;
  try {
    response = await fetch(`${API}/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      // Key in a header rather than the URL, so it never ends up in logs.
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
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
      signal: AbortSignal.timeout(100_000),
    });
  } catch (error) {
    console.error('Gemini request failed', error);
    throw new HttpError(504, 'Gemini ne répond pas : réessayez dans quelques instants');
  }
  if (!response.ok) {
    const body = await response.text();
    console.error(`Gemini ${model} failed`, response.status, body);
    const httpError = providerError(response.status, body);
    // A daily quota exhaustion is not transient: retrying would only waste time.
    const dailyQuota = response.status === 429 && /per ?day|PerDay/i.test(body);
    if (TRANSIENT.has(response.status) && !dailyQuota) throw new TransientError(response.status, httpError);
    throw httpError;
  }

  const data = (await response.json()) as GeminiResponse;
  if (data.promptFeedback?.blockReason)
    throw new HttpError(
      422,
      `Demande bloquée par le filtre de Gemini (${data.promptFeedback.blockReason}) : reformulez`,
    );
  const candidate = data.candidates?.[0];
  const content = (candidate?.content?.parts ?? [])
    .filter((part) => !part.thought)
    .map((part) => part.text ?? '')
    .join('');
  if (!content && candidate?.finishReason) console.error('Gemini returned no content', candidate.finishReason);
  // An empty or truncated answer fails JSON parsing and triggers the caller's retry.
  return { content, usage: data.usageMetadata };
}
