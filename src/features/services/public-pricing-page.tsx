import { Check, HelpCircle } from 'lucide-react';
import { Link } from 'react-router';
import { Container, CtaBanner, PageHero } from '@/features/public-site/components/sections';
import { cn } from '@/shared/lib/cn';
import { formatCurrency } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Seo } from '@/shared/ui/seo';
import { serviceFeatures, usePublishedServices } from './api';

const INCLUDED = [
  { title: 'Accompagnement personnalisé', description: "Je m'adapte à votre établissement et à votre style" },
  { title: 'Support téléphonique', description: 'Disponible 7 j/7 pour vos questions' },
  { title: 'Suivi post-mission', description: 'Bilan et recommandations après chaque prestation' },
  { title: 'Flexibilité', description: 'Ajustement selon vos besoins en temps réel' },
];

const FAQ = [
  {
    q: 'Quels sont les délais de disponibilité ?',
    a: "Je suis généralement disponible sous 1 à 2 semaines. Pour les urgences, n'hésitez pas à me contacter directement.",
  },
  {
    q: 'Les tarifs incluent-ils le transport ?',
    a: 'Les tarifs sont pour une mission sur Bordeaux Métropole. Des frais de déplacement peuvent s’appliquer au-delà.',
  },
  {
    q: 'Proposez-vous des contrats récurrents ?',
    a: 'Oui, je propose des forfaits mensuels avec des tarifs préférentiels pour les engagements réguliers.',
  },
  {
    q: 'Comment se passe la facturation ?',
    a: 'Facturation en fin de mission avec un délai de paiement de 30 jours. Acompte de 30 % pour les missions longues.',
  },
];

export function Component() {
  const { data: services = [], isPending, isError, error, refetch } = usePublishedServices();

  return (
    <div className="animate-fade-in">
      <Seo
        title="Tarifs"
        description="Tarifs transparents d'un chef freelance à Bordeaux : prestations à la journée, forfaits consulting et formation."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
          })),
        }}
      />
      <PageHero title="Tarifs" subtitle="Des tarifs transparents adaptés à vos besoins" />

      <section className="bg-neutral-50 py-24">
        <Container>
          {isPending ? (
            <PageLoader />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : (
            <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {services.map((plan) => (
                <li
                  key={plan.id}
                  className={cn(
                    'relative flex flex-col overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-sm',
                    plan.is_featured && 'ring-2 ring-primary-500 lg:scale-105',
                  )}
                >
                  {plan.is_featured && (
                    <p className="absolute inset-x-0 top-0 bg-primary-500 py-2 text-center text-xs font-semibold text-white">
                      Recommandé
                    </p>
                  )}
                  <div className={cn('flex flex-1 flex-col p-8', plan.is_featured && 'pt-12')}>
                    <h2 className="mb-2 text-xl font-semibold text-neutral-900">{plan.title}</h2>
                    <p className="mb-6 text-sm text-neutral-500">{plan.description}</p>
                    <p className="mb-6 flex items-baseline gap-1">
                      <span className="font-display text-4xl font-bold text-primary-600">
                        {plan.price !== null ? formatCurrency(plan.price) : 'Sur devis'}
                      </span>
                      {plan.price !== null && <span className="text-neutral-500">/{plan.price_unit}</span>}
                    </p>
                    <ul className="mb-8 flex-1 space-y-3">
                      {serviceFeatures(plan.features).map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-sm text-neutral-600">
                          <Check className="size-4 text-success-500" aria-hidden />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button asChild variant={plan.is_featured ? 'primary' : 'outline'} className="w-full">
                      <Link to={`/contact?sujet=${encodeURIComponent(plan.title)}`}>Demander un devis</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-8 text-center text-sm text-neutral-500">
            Tarifs indicatifs hors taxes, hors frais de déplacement.
          </p>
        </Container>
      </section>

      <section className="bg-white py-24">
        <Container className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          <div>
            <h2 className="section-title mb-8">Ce qui est inclus</h2>
            <ul className="space-y-6">
              {INCLUDED.map((item) => (
                <li key={item.title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success-100">
                    <Check className="size-5 text-success-600" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold text-neutral-900">{item.title}</span>
                    <span className="text-sm text-neutral-600">{item.description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="section-title mb-8">Questions fréquentes</h2>
            <div className="space-y-4">
              {FAQ.map((item) => (
                <details key={item.q} className="group rounded-xl border border-neutral-100 bg-white p-6 shadow-sm">
                  <summary className="flex cursor-pointer list-none items-start gap-3 font-semibold text-neutral-900">
                    <HelpCircle className="mt-0.5 size-5 shrink-0 text-primary-600" aria-hidden />
                    {item.q}
                  </summary>
                  <p className="mt-3 pl-8 text-sm text-neutral-600">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <CtaBanner
        title="Besoin d'un devis personnalisé ?"
        text="Chaque projet est unique. Contactez-moi pour discuter de vos besoins."
        primary={{ label: 'Me contacter', to: '/contact' }}
      />
    </div>
  );
}
