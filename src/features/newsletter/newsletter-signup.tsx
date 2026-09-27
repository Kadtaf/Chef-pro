import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { MailCheck, Send } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { z } from 'zod';
import type { NewsletterRequest } from '@ai-contract';
import { Honeypot, Turnstile, captchaEnabled } from '@/features/public-site/components/turnstile';
import { cn } from '@/shared/lib/cn';
import { toUserMessage } from '@/shared/lib/errors';
import { invokeFunction } from '@/shared/lib/functions';
import { Button } from '@/shared/ui/button';

const schema = z.object({
  email: z.email('Adresse email invalide'),
  consent: z.literal(true, { error: 'Votre accord est nécessaire' }),
  website: z.string().optional(),
});
type Values = z.infer<typeof schema>;

/** "Les inspirations du Chef" sign-up (Brevo double opt-in). */
export function NewsletterSignup({ tone = 'dark', compact = false }: { tone?: 'dark' | 'light'; compact?: boolean }) {
  const [captchaToken, setCaptchaToken] = useState<string>();
  const onToken = useCallback((token: string | undefined) => setCaptchaToken(token), []);
  const subscribe = useMutation({
    meta: { toastOnError: false },
    mutationFn: (payload: NewsletterRequest) => invokeFunction<{ ok: boolean }>('newsletter', payload),
  });
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', website: '' } });
  const { errors } = form.formState;
  const dark = tone === 'dark';

  if (subscribe.isSuccess) {
    return (
      <div className={cn('flex items-start gap-3', dark ? 'text-cream-100' : 'text-neutral-800')} role="status">
        <MailCheck className="mt-0.5 size-6 shrink-0 text-secondary-400" aria-hidden />
        <p>
          <strong className="font-semibold">Presque terminé !</strong> Confirmez votre inscription en cliquant sur le
          lien que nous venons de vous envoyer par email.
        </p>
      </div>
    );
  }

  const onSubmit = form.handleSubmit(({ email, consent, website }) =>
    subscribe.mutate({ email, consent, website, captchaToken }),
  );

  return (
    <form onSubmit={(e) => void onSubmit(e)} noValidate className="relative space-y-3">
      <Honeypot register={form.register('website')} />
      <div className={cn('flex gap-2', compact ? 'flex-col sm:flex-row' : 'flex-col sm:flex-row')}>
        <label className="sr-only" htmlFor="newsletter-email">
          Votre adresse email
        </label>
        <input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          placeholder="Votre adresse email"
          aria-invalid={errors.email ? true : undefined}
          className={cn(
            'h-12 flex-1 rounded-full border px-5 text-sm transition-colors focus:ring-2 focus:ring-secondary-400 focus:outline-none',
            dark
              ? 'border-white/15 bg-white/5 text-cream-50 placeholder:text-neutral-400'
              : 'border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400',
          )}
          {...form.register('email')}
        />
        <Button
          type="submit"
          loading={subscribe.isPending}
          disabled={captchaEnabled && !captchaToken}
          className="h-12 rounded-full bg-secondary-500 px-6 text-neutral-950 shadow-none hover:bg-secondary-400"
        >
          S&apos;inscrire
          <Send />
        </Button>
      </div>
      <label className={cn('flex items-start gap-2 text-xs', dark ? 'text-neutral-400' : 'text-neutral-500')}>
        <input type="checkbox" className="mt-0.5 accent-secondary-500" {...form.register('consent')} />
        <span>
          J&apos;accepte de recevoir « Les inspirations du Chef » (une à deux fois par mois). Désinscription en un clic.{' '}
          <Link to="/mentions-legales#confidentialite" className="underline">
            Confidentialité
          </Link>
        </span>
      </label>
      {(errors.email || errors.consent || subscribe.isError) && (
        <p className="text-sm text-error-400" role="alert">
          {errors.email?.message ?? errors.consent?.message ?? toUserMessage(subscribe.error)}
        </p>
      )}
      <Turnstile onToken={onToken} />
    </form>
  );
}
