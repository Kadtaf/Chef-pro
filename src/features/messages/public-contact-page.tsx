import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router';
import { z } from 'zod';
import { usePublicSubmit } from '@/features/comments/api';
import { Container, PageHero } from '@/features/public-site/components/sections';
import { Honeypot, Turnstile, captchaEnabled } from '@/features/public-site/components/turnstile';
import { DEFAULT_SETTINGS, useSiteSettings } from '@/features/settings/api';
import { toUserMessage } from '@/shared/lib/errors';
import { Button } from '@/shared/ui/button';
import { Badge, Card } from '@/shared/ui/feedback';
import { Field, Input, Select, Textarea } from '@/shared/ui/form';
import { Seo } from '@/shared/ui/seo';

const SUBJECTS = ['Chef de cuisine', 'Second de cuisine', 'Consulting culinaire', 'Formation', 'Événementiel', 'Autre'];
const ZONES = ['Bordeaux', 'Métropole', 'Gironde', 'Nouvelle-Aquitaine', 'France'];

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Votre nom est requis').max(120),
  email: z.email('Adresse email invalide'),
  phone: z
    .string()
    .trim()
    .max(40)
    .regex(/^[+\d\s().-]*$/, 'Numéro invalide'),
  subject: z.string().max(200),
  message: z.string().trim().min(10, 'Décrivez votre projet (10 caractères minimum)').max(5000),
  website: z.string().optional(),
});
type ContactValues = z.infer<typeof contactSchema>;

export function Component() {
  const [params] = useSearchParams();
  const { data: settings } = useSiteSettings();
  const site = { ...DEFAULT_SETTINGS, ...settings };
  const submit = usePublicSubmit();
  const [captchaToken, setCaptchaToken] = useState<string>();
  const onToken = useCallback((token: string | undefined) => setCaptchaToken(token), []);

  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', phone: '', subject: params.get('sujet') ?? '', message: '', website: '' },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    submit.mutate({ kind: 'contact', ...values, captchaToken }, { onSuccess: () => form.reset() }),
  );

  return (
    <div className="animate-fade-in">
      <Seo
        title="Contact"
        description="Contactez un chef de cuisine freelance à Bordeaux pour un devis gratuit : restaurant, événement, consulting ou formation."
      />
      <PageHero title="Contact" subtitle="Discutons de votre projet culinaire" />

      <section className="bg-neutral-50 py-24">
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <Card className="relative p-6 sm:p-8">
            {submit.isSuccess ? (
              <div className="flex flex-col items-center gap-4 py-12 text-center" role="status">
                <span className="flex size-16 items-center justify-center rounded-full bg-success-100">
                  <CheckCircle className="size-8 text-success-600" aria-hidden />
                </span>
                <h2 className="text-2xl font-bold text-neutral-900">Message envoyé !</h2>
                <p className="text-neutral-600">
                  Merci pour votre message. Je vous réponds dans les plus brefs délais.
                </p>
                <Button variant="subtle" onClick={() => submit.reset()}>
                  Envoyer un autre message
                </Button>
              </div>
            ) : (
              <>
                <h2 className="mb-6 text-2xl font-semibold text-neutral-900">Envoyez-moi un message</h2>
                <form onSubmit={(e) => void onSubmit(e)} className="space-y-5" noValidate>
                  <Honeypot register={form.register('website')} />
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field label="Nom complet" required error={errors.name?.message}>
                      {(c) => <Input {...c} autoComplete="name" {...form.register('name')} />}
                    </Field>
                    <Field label="Email" required error={errors.email?.message}>
                      {(c) => <Input {...c} type="email" autoComplete="email" {...form.register('email')} />}
                    </Field>
                    <Field label="Téléphone" error={errors.phone?.message}>
                      {(c) => <Input {...c} type="tel" autoComplete="tel" {...form.register('phone')} />}
                    </Field>
                    <Field label="Sujet">
                      {(c) => (
                        <Select {...c} {...form.register('subject')}>
                          <option value="">Sélectionnez un sujet</option>
                          {SUBJECTS.map((subject) => (
                            <option key={subject}>{subject}</option>
                          ))}
                          {params.get('sujet') && !SUBJECTS.includes(params.get('sujet')!) && (
                            <option>{params.get('sujet')}</option>
                          )}
                        </Select>
                      )}
                    </Field>
                  </div>
                  <Field label="Message" required error={errors.message?.message}>
                    {(c) => (
                      <Textarea {...c} rows={6} placeholder="Décrivez votre projet…" {...form.register('message')} />
                    )}
                  </Field>
                  <Turnstile onToken={onToken} />
                  {submit.isError && (
                    <p className="rounded-lg bg-error-50 p-3 text-sm text-error-700" role="alert">
                      {toUserMessage(submit.error)}
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    loading={submit.isPending}
                    disabled={captchaEnabled && !captchaToken}
                  >
                    Envoyer
                    <Send />
                  </Button>
                  <p className="text-xs text-neutral-500">
                    Vos données servent uniquement à répondre à votre demande et sont conservées 3 ans au maximum.{' '}
                    <Link to="/mentions-legales#confidentialite" className="underline">
                      Politique de confidentialité
                    </Link>
                  </p>
                </form>
              </>
            )}
          </Card>

          <div className="space-y-8">
            <div>
              <h2 className="mb-6 text-2xl font-semibold text-neutral-900">Informations de contact</h2>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-100">
                    <MapPin className="size-6 text-primary-600" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold text-neutral-900">Adresse</span>
                    <span className="block text-neutral-600">{site.address}</span>
                    <span className="text-sm text-neutral-500">Interventions sur Bordeaux et sa région</span>
                  </span>
                </li>
                {site.phone && (
                  <li className="flex items-start gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-100">
                      <Phone className="size-6 text-primary-600" aria-hidden />
                    </span>
                    <span>
                      <span className="block font-semibold text-neutral-900">Téléphone</span>
                      <a
                        href={`tel:${site.phone.replace(/\s/g, '')}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {site.phone}
                      </a>
                    </span>
                  </li>
                )}
                <li className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-100">
                    <Mail className="size-6 text-primary-600" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold text-neutral-900">Email</span>
                    <a href={`mailto:${site.email}`} className="text-primary-600 hover:text-primary-700">
                      {site.email}
                    </a>
                  </span>
                </li>
              </ul>
            </div>
            <Card className="bg-linear-to-br from-primary-50 to-secondary-50 p-6">
              <h3 className="mb-2 font-sans font-semibold text-neutral-900">Disponibilité</h3>
              <p className="mb-4 text-sm text-neutral-600">Du lundi au samedi, de 8 h à 20 h. Réponse sous 24 h.</p>
              <p className="text-xs text-neutral-500">
                Les missions urgentes sont possibles, n&apos;hésitez pas à me contacter.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="mb-4 font-sans font-semibold text-neutral-900">Zone d&apos;intervention</h3>
              <ul className="flex flex-wrap gap-2">
                {ZONES.map((zone) => (
                  <li key={zone}>
                    <Badge>{zone}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Container>
      </section>
    </div>
  );
}
