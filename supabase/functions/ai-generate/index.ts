import { aiGenerateRequestSchema, aiSchemas } from '../_shared/ai-schemas.ts';
import { handler, HttpError, json } from '../_shared/http.ts';
import { parseModelJson } from '../_shared/json-repair.ts';
import { enforceAiQuota, logGeneration, requireAdmin } from '../_shared/supabase.ts';
import { assertTextProviderConfigured, chatJson } from '../_shared/text-provider.ts';
import { describeRequest, systemPrompt, userPrompt } from './prompts.ts';

const RETRY_REMINDER =
  'RAPPEL : ta réponse précédente était invalide. Retourne exactement un objet JSON conforme au schéma, tous les champs requis présents.';

/** Candidates to validate: the object itself, then its content when wrapped ({ "article": {…} }). */
function unwrapCandidates(candidate: unknown): unknown[] {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return [candidate];
  const values = Object.values(candidate);
  const inner = values.length === 1 && values[0] && typeof values[0] === 'object' ? values[0] : null;
  return inner && !Array.isArray(inner) ? [candidate, inner] : [candidate];
}

/** Human summary of the first validation problem, e.g. « body » : trop court. */
function describeIssue(issue: unknown): string {
  if (typeof issue === 'string') return issue;
  const first = (issue as { path?: PropertyKey[]; message?: string }[] | undefined)?.[0];
  if (!first) return 'format inattendu';
  const field = first.path?.length ? `champ « ${first.path.join('.')} »` : 'objet';
  return `${field} : ${first.message ?? 'invalide'}`;
}

Deno.serve(
  handler(async (req, body) => {
    const { user, admin } = await requireAdmin(req);
    const request = aiGenerateRequestSchema.parse(body);
    assertTextProviderConfigured();
    await enforceAiQuota(admin, user.id);

    const schema = aiSchemas[request.type];
    const system = systemPrompt(request.type);
    const prompt = userPrompt(request);

    let lastIssue: unknown;
    let lastModel = 'text-provider-chain';
    for (const [attempt, temperature] of [0.5, 0.2].entries()) {
      // Gemini first, then Groq / Cloudflare when it is overloaded (see _shared/text-provider.ts).
      const { content, usage, model, provider } = await chatJson({
        system,
        // The retry tells the model what was wrong, which fixes most rejections.
        user: attempt === 0 ? prompt : `${prompt}\n${RETRY_REMINDER} Problème constaté : ${describeIssue(lastIssue)}.`,
        temperature,
      });
      lastModel = model;

      let candidate: unknown;
      try {
        candidate = parseModelJson(content);
      } catch (error) {
        const trimmed = content.trim();
        lastIssue = !trimmed
          ? `réponse vide de ${model}`
          : trimmed
                .replace(/```\s*$/, '')
                .trimEnd()
                .endsWith('}')
            ? `JSON mal formé renvoyé par ${model}`
            : `réponse coupée avant la fin par ${model}`;
        console.error('Unparseable AI answer', model, String(error), trimmed.slice(0, 300), '…', trimmed.slice(-200));
        continue;
      }

      const parsed = unwrapCandidates(candidate)
        .map((value) => schema.safeParse(value))
        .reduce((best, next) => (best.success ? best : next));
      if (!parsed.success) {
        lastIssue = parsed.error.issues;
        continue;
      }

      const generationId = await logGeneration(admin, {
        userId: user.id,
        type: request.type,
        prompt: describeRequest(request),
        result: parsed.data,
        model,
        usage,
        status: 'success',
      });
      return json(req, { result: parsed.data, generationId, provider });
    }

    console.error('AI output rejected after retries', JSON.stringify(lastIssue));
    await logGeneration(admin, {
      userId: user.id,
      type: request.type,
      prompt: describeRequest(request),
      // Kept for diagnosis in the generation history.
      result: { issue: describeIssue(lastIssue) },
      model: lastModel,
      status: 'error',
    });
    throw new HttpError(502, `La réponse de l'IA est invalide (${describeIssue(lastIssue)}), veuillez réessayer`);
  }),
);
