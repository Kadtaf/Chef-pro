import { aiGenerateRequestSchema, aiSchemas } from '../_shared/ai-schemas.ts';
import { handler, HttpError, json, requireEnv } from '../_shared/http.ts';
import { CHAT_MODEL, chatJson } from '../_shared/mistral.ts';
import { enforceAiQuota, logGeneration, requireAdmin } from '../_shared/supabase.ts';
import { describeRequest, systemPrompt, userPrompt } from './prompts.ts';

const RETRY_REMINDER =
  'RAPPEL : ta réponse précédente était invalide. Retourne exactement un objet JSON conforme au schéma, tous les champs requis présents.';

function parseCandidate(raw: string): unknown {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  return JSON.parse(cleaned);
}

Deno.serve(
  handler(async (req, body) => {
    const { user, admin } = await requireAdmin(req);
    const request = aiGenerateRequestSchema.parse(body);
    await enforceAiQuota(admin, user.id);

    const apiKey = requireEnv('MISTRAL_API_KEY');
    const schema = aiSchemas[request.type];
    const system = systemPrompt(request.type);
    const prompt = userPrompt(request);

    let lastIssue: unknown;
    for (const [attempt, temperature] of [0.5, 0.2].entries()) {
      const { content, usage } = await chatJson(apiKey, {
        system,
        user: attempt === 0 ? prompt : `${prompt}\n${RETRY_REMINDER}`,
        temperature,
      });

      let candidate: unknown;
      try {
        candidate = parseCandidate(content);
      } catch {
        lastIssue = 'JSON non parseable';
        continue;
      }

      const parsed = schema.safeParse(candidate);
      if (!parsed.success) {
        lastIssue = parsed.error.issues;
        continue;
      }

      const generationId = await logGeneration(admin, {
        userId: user.id,
        type: request.type,
        prompt: describeRequest(request),
        result: parsed.data,
        model: CHAT_MODEL,
        usage,
        status: 'success',
      });
      return json(req, { result: parsed.data, generationId });
    }

    console.error('AI output rejected after retries', JSON.stringify(lastIssue));
    await logGeneration(admin, {
      userId: user.id,
      type: request.type,
      prompt: describeRequest(request),
      model: CHAT_MODEL,
      status: 'error',
    });
    throw new HttpError(502, "La réponse de l'IA est invalide, veuillez réessayer");
  }),
);
