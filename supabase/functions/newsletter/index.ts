import { newsletterRequestSchema } from '../_shared/ai-schemas.ts';
import { clientIp, handler, HttpError, json, sha256 } from '../_shared/http.ts';
import { serviceClient } from '../_shared/supabase.ts';

/**
 * "Les inspirations du Chef" — newsletter sign-up with Brevo double opt-in.
 * Brevo sends the confirmation e-mail and only adds the contact to the list
 * once the subscriber clicks the link (GDPR proof of consent is kept by Brevo).
 * No subscriber data is stored in our database.
 */
async function verifyCaptcha(token: string | undefined, ip: string): Promise<void> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  if (!secret) return;
  if (!token) throw new HttpError(400, 'Vérification anti-spam manquante');
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });
  const outcome = (await response.json()) as { success?: boolean };
  if (!outcome.success) throw new HttpError(400, 'Vérification anti-spam échouée');
}

Deno.serve(
  handler(async (req, body) => {
    const request = newsletterRequestSchema.parse(body);
    if (request.website) return json(req, { ok: true });

    const apiKey = Deno.env.get('BREVO_API_KEY');
    const listId = Number(Deno.env.get('BREVO_LIST_ID'));
    const templateId = Number(Deno.env.get('BREVO_DOI_TEMPLATE_ID'));
    const redirectionUrl = Deno.env.get('BREVO_REDIRECT_URL');
    if (!apiKey || !listId || !templateId || !redirectionUrl) {
      console.error('Brevo is not configured');
      throw new HttpError(503, "L'inscription à la newsletter est momentanément indisponible");
    }

    const ip = clientIp(req);
    await verifyCaptcha(request.captchaToken, ip);

    const { data: allowed, error: limitError } = await serviceClient().rpc('consume_rate_limit', {
      p_key: `newsletter:${await sha256(ip)}`,
      p_limit: 5,
      p_window_seconds: 3600,
    });
    if (limitError) throw limitError;
    if (!allowed) throw new HttpError(429, 'Trop de demandes, réessayez plus tard');

    const response = await fetch('https://api.brevo.com/v3/contacts/doubleOptinConfirmation', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        email: request.email,
        attributes: request.first_name ? { PRENOM: request.first_name } : undefined,
        includeListIds: [listId],
        templateId,
        redirectionUrl,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      console.error('Brevo DOI failed', response.status, await response.text());
      throw new HttpError(502, "L'inscription n'a pas pu aboutir, réessayez plus tard");
    }

    // Always the same answer (does not reveal whether the address was already subscribed).
    return json(req, { ok: true }, 201);
  }),
);
