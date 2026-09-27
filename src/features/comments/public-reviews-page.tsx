import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, MessageSquare, Quote, Star } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Container, PageHero } from '@/features/public-site/components/sections';
import { StarRating } from '@/features/public-site/components/star-rating';
import { Honeypot, Turnstile, captchaEnabled } from '@/features/public-site/components/turnstile';
import { cn } from '@/shared/lib/cn';
import { toUserMessage } from '@/shared/lib/errors';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Card, EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Field, Input, Textarea } from '@/shared/ui/form';
import { Seo } from '@/shared/ui/seo';
import { usePublicReviews, usePublicSubmit } from './api';

const reviewSchema = z.object({
  author_name: z.string().trim().min(1, 'Votre nom est requis').max(120),
  author_email: z.union([z.email('Email invalide'), z.literal('')]),
  rating: z.number().int().min(1, 'Choisissez une note').max(5),
  content: z.string().trim().min(10, '10 caractères minimum').max(3000),
  website: z.string().optional(),
  consent: z.literal(true, { error: 'Votre accord est nécessaire' }),
});
type ReviewValues = z.infer<typeof reviewSchema>;

function ReviewForm() {
  const submit = usePublicSubmit();
  const [captchaToken, setCaptchaToken] = useState<string>();
  const onToken = useCallback((token: string | undefined) => setCaptchaToken(token), []);
  const form = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { author_name: '', author_email: '', rating: 0, content: '', website: '' },
  });
  const { errors } = form.formState;

  if (submit.isSuccess) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center" role="status">
        <CheckCircle className="size-12 text-success-500" aria-hidden />
        <p className="text-lg font-semibold text-neutral-900">Merci pour votre avis !</p>
        <p className="text-neutral-600">Il sera publié après modération.</p>
      </div>
    );
  }

  const onSubmit = form.handleSubmit(({ consent: _consent, ...values }) =>
    submit.mutate({ kind: 'review', ...values, captchaToken }),
  );

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="relative space-y-5" noValidate>
      <Honeypot register={form.register('website')} />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Nom ou établissement" required error={errors.author_name?.message}>
          {(c) => <Input {...c} autoComplete="name" {...form.register('author_name')} />}
        </Field>
        <Field label="Email (non publié)" error={errors.author_email?.message}>
          {(c) => <Input {...c} type="email" autoComplete="email" {...form.register('author_email')} />}
        </Field>
      </div>
      <Controller
        control={form.control}
        name="rating"
        render={({ field }) => (
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-neutral-700">
              Note <span className="text-error-600">*</span>
            </legend>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
                  aria-pressed={field.value === value}
                  onClick={() => field.onChange(value)}
                  className="rounded p-0.5"
                >
                  <Star
                    className={cn(
                      'size-8 transition-colors',
                      value <= field.value
                        ? 'fill-accent-400 text-accent-400'
                        : 'text-neutral-300 hover:text-accent-300',
                    )}
                  />
                </button>
              ))}
            </div>
            {errors.rating && <p className="mt-1 text-sm text-error-600">{errors.rating.message}</p>}
          </fieldset>
        )}
      />
      <Field label="Votre avis" required error={errors.content?.message}>
        {(c) => <Textarea {...c} rows={5} {...form.register('content')} />}
      </Field>
      <label className="flex items-start gap-2 text-sm text-neutral-600">
        <input type="checkbox" className="mt-1 accent-primary-600" {...form.register('consent')} />
        J&apos;accepte que mon nom et mon avis soient publiés sur ce site après modération.
      </label>
      {errors.consent && <p className="text-sm text-error-600">{errors.consent.message}</p>}
      <Turnstile onToken={onToken} />
      {submit.isError && (
        <p className="rounded-lg bg-error-50 p-3 text-sm text-error-700" role="alert">
          {toUserMessage(submit.error)}
        </p>
      )}
      <Button type="submit" loading={submit.isPending} disabled={captchaEnabled && !captchaToken}>
        <MessageSquare />
        Envoyer mon avis
      </Button>
    </form>
  );
}

export function Component() {
  const { data: reviews = [], isPending, isError, error, refetch } = usePublicReviews();

  const stats = useMemo(() => {
    const rated = reviews.filter((r) => r.rating);
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: rated.filter((r) => r.rating === star).length,
    }));
    const average = rated.length ? rated.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rated.length : 0;
    return { total: rated.length, average: Math.round(average * 10) / 10, distribution };
  }, [reviews]);

  return (
    <div className="animate-fade-in">
      <Seo
        title="Avis clients"
        description="Avis vérifiés et modérés des clients d'un chef de cuisine freelance à Bordeaux."
        jsonLd={
          stats.total > 0
            ? {
                '@context': 'https://schema.org',
                '@type': 'ProfessionalService',
                name: 'Chef Pro Bordeaux',
                aggregateRating: { '@type': 'AggregateRating', ratingValue: stats.average, reviewCount: stats.total },
              }
            : undefined
        }
      />
      <PageHero title="Avis clients" subtitle="Ce que mes clients disent de mes prestations" />

      {stats.total > 0 && (
        <section className="border-b border-neutral-200 bg-white py-16">
          <Container className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div className="text-center md:text-left">
              <p className="mb-4 flex items-baseline justify-center gap-3 md:justify-start">
                <span className="font-display text-6xl font-bold text-primary-600">
                  {stats.average.toLocaleString('fr-FR')}
                </span>
                <StarRating rating={Math.round(stats.average)} />
              </p>
              <p className="text-neutral-600">Basé sur {stats.total} avis</p>
            </div>
            <ul className="space-y-3">
              {stats.distribution.map(({ star, count }) => (
                <li key={star} className="flex items-center gap-3">
                  <span className="w-12 text-sm text-neutral-600">{star} ★</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                    <span
                      className="block h-full rounded-full bg-primary-500"
                      style={{ width: `${(count / stats.total) * 100}%` }}
                    />
                  </span>
                  <span className="w-8 text-sm text-neutral-500">{count}</span>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <section className="bg-neutral-50 py-24">
        <Container>
          {isPending ? (
            <PageLoader />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : reviews.length === 0 ? (
            <EmptyState
              title="Aucun avis publié pour le moment"
              description="Soyez le premier à partager votre expérience."
            />
          ) : (
            <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => (
                <li key={review.id}>
                  <Card className="flex h-full flex-col p-8">
                    <Quote className="mb-6 size-10 text-primary-400/30" aria-hidden />
                    <blockquote className="mb-6 flex-1 leading-relaxed text-neutral-700">{review.content}</blockquote>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-12 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-secondary-500 font-semibold text-white">
                          {review.author_name.charAt(0).toUpperCase()}
                        </span>
                        <span>
                          <span className="block font-semibold text-neutral-900">{review.author_name}</span>
                          <time className="text-sm text-neutral-500" dateTime={review.created_at}>
                            {formatDate(review.created_at)}
                          </time>
                        </span>
                      </div>
                      {review.rating && <StarRating rating={review.rating} size="sm" />}
                    </div>
                    {review.response && (
                      <div className="mt-6 rounded-lg bg-neutral-50 p-4 text-sm">
                        <p className="mb-1 font-medium text-neutral-900">Réponse du chef</p>
                        <p className="text-neutral-600">{review.response}</p>
                      </div>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      <section className="bg-white py-24">
        <Container className="max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="section-title">Votre avis m&apos;importe</h2>
            <p className="mx-auto section-subtitle">Vous avez travaillé avec moi ? Partagez votre expérience.</p>
          </div>
          <Card className="p-6 sm:p-8">
            <ReviewForm />
          </Card>
        </Container>
      </section>
    </div>
  );
}
