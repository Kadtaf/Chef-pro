import { publicSubmitSchema, type PublicSubmitRequest } from '../_shared/ai-schemas.ts';
import { clientIp, handler, HttpError, json, sha256 } from '../_shared/http.ts';
import type { SupabaseClient } from '@supabase/supabase-js';
import { serviceClient } from '../_shared/supabase.ts';

const LIMIT_PER_HOUR = Number(Deno.env.get('PUBLIC_SUBMIT_LIMIT_PER_HOUR') ?? '5');

async function verifyCaptcha(token: string | undefined, ip: string): Promise<void> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  if (!secret) return; // captcha disabled (local development)
  if (!token) throw new HttpError(400, 'Vérification anti-spam manquante');

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });
  const outcome = await response.json();
  if (!outcome.success) throw new HttpError(400, 'Vérification anti-spam échouée');
}

async function notifyByEmail(subject: string, text: string): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const to = Deno.env.get('NOTIFY_EMAIL');
  if (!apiKey || !to) return;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('NOTIFY_FROM') ?? 'Chef Pro <onboarding@resend.dev>',
      to: [to],
      subject,
      text,
    }),
  });
  if (!response.ok) console.error('Email notification failed', response.status, await response.text());
}

async function persist(admin: SupabaseClient, submission: PublicSubmitRequest) {
  if (submission.kind === 'contact') {
    const { error } = await admin.from('contact_submissions').insert({
      name: submission.name,
      email: submission.email,
      phone: submission.phone || null,
      subject: submission.subject || null,
      message: submission.message,
    });
    if (error) throw error;
    return {
      notification: {
        title: `Nouveau message de ${submission.name}`,
        message: submission.subject ?? submission.message.slice(0, 140),
        link: '/admin/messages',
      },
      email: {
        subject: `[Chef Pro] Message de ${submission.name}`,
        text: `${submission.name} <${submission.email}> ${submission.phone ?? ''}\n\n${submission.subject ?? ''}\n\n${submission.message}`,
      },
    } as const;
  }
  const { error } = await admin.from('comments').insert({
    author_name: submission.author_name,
    author_email: submission.author_email || null,
    rating: submission.rating,
    content: submission.content,
    source: 'site',
    is_approved: false,
    is_public: true,
  });
  if (error) throw error;
  return {
    notification: {
      title: `Nouvel avis (${submission.rating}/5) à modérer`,
      message: submission.content.slice(0, 140),
      link: '/admin/comments',
    },
    email: {
      subject: `[Chef Pro] Nouvel avis ${submission.rating}/5 à modérer`,
      text: `${submission.author_name} : ${submission.content}`,
    },
  } as const;
}

Deno.serve(
  handler(async (req, body) => {
    const submission = publicSubmitSchema.parse(body);
    // Honeypot filled => silently accept to avoid teaching bots.
    if (submission.website) return json(req, { ok: true });

    const ip = clientIp(req);
    await verifyCaptcha(submission.captchaToken, ip);

    const admin = serviceClient();
    const { data: allowed, error: limitError } = await admin.rpc('consume_rate_limit', {
      p_key: `submit:${await sha256(ip)}`,
      p_limit: LIMIT_PER_HOUR,
      p_window_seconds: 3600,
    });
    if (limitError) throw limitError;
    if (!allowed) throw new HttpError(429, 'Trop de demandes, réessayez plus tard');

    const { notification, email } = await persist(admin, submission);

    await Promise.allSettled([
      admin.from('notifications').insert({ ...notification, type: 'info' }),
      notifyByEmail(email.subject, email.text),
    ]);

    return json(req, { ok: true }, 201);
  }),
);
