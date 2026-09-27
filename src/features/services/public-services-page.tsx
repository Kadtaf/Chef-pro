import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router';
import { Container, CtaBanner, PageHero, SectionHeading } from '@/features/public-site/components/sections';
import { cn } from '@/shared/lib/cn';
import { formatCurrency } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Seo } from '@/shared/ui/seo';
import { serviceFeatures, usePublishedServices } from './api';
import { ServiceIcon } from './service-icon';

const PROCESS = [
  { step: '01', title: 'Contact', description: 'Vous me contactez via le formulaire ou par téléphone' },
  { step: '02', title: 'Échange', description: 'Nous discutons de vos besoins et objectifs' },
  { step: '03', title: 'Proposition', description: 'Je vous envoie un devis personnalisé' },
  { step: '04', title: 'Réalisation', description: 'Je concrétise la prestation avec excellence' },
];

export function Component() {
  const { data: services = [], isPending, isError, error, refetch } = usePublishedServices();

  return (
    <div className="animate-fade-in">
      <Seo
        title="Services"
        description="Chef de cuisine, second de cuisine, consulting, formation et événementiel à Bordeaux : des prestations culinaires sur mesure."
      />
      <PageHero
        title="Mes services"
        subtitle="Des prestations sur mesure pour répondre à tous vos besoins culinaires"
      />

      <section className="bg-neutral-50 py-24">
        <Container>
          {isPending ? (
            <PageLoader />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : services.length === 0 ? (
            <EmptyState title="Services bientôt disponibles" />
          ) : (
            <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <li
                  key={service.id}
                  className={cn(
                    'relative flex flex-col overflow-hidden rounded-xl border border-neutral-100 bg-white p-8 shadow-sm',
                    service.is_featured && 'ring-2 ring-primary-500',
                  )}
                >
                  {service.is_featured && (
                    <span className="absolute top-0 right-0 bg-primary-500 px-3 py-1 text-xs font-semibold text-white">
                      Populaire
                    </span>
                  )}
                  <div className="mb-6 flex size-14 items-center justify-center rounded-xl bg-linear-to-br from-primary-100 to-secondary-100">
                    <ServiceIcon category={service.category} className="size-7 text-primary-600" />
                  </div>
                  <h2 className="mb-3 text-2xl font-semibold text-neutral-900">{service.title}</h2>
                  <p className="mb-6 text-sm leading-relaxed text-neutral-600">{service.description}</p>
                  <p className="mb-6 flex items-baseline gap-1">
                    <span className="font-display text-3xl font-bold text-primary-600">
                      {service.price !== null ? formatCurrency(service.price) : 'Sur devis'}
                    </span>
                    {service.price !== null && <span className="text-neutral-500">/{service.price_unit}</span>}
                  </p>
                  <ul className="mb-8 flex-1 space-y-3">
                    {serviceFeatures(service.features).map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm text-neutral-600">
                        <CheckCircle className="size-4 shrink-0 text-success-500" aria-hidden />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full">
                    <Link to={`/contact?sujet=${encodeURIComponent(service.title)}`}>Demander un devis</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      <section className="bg-white py-24">
        <Container>
          <SectionHeading
            title="Comment ça marche ?"
            subtitle="Un processus simple et efficace pour vous accompagner"
          />
          <ol className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {PROCESS.map((item) => (
              <li key={item.step} className="text-center">
                <span className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-secondary-600 font-display text-2xl font-bold text-white">
                  {item.step}
                </span>
                <h3 className="mb-2 font-sans text-lg font-semibold text-neutral-900">{item.title}</h3>
                <p className="text-sm text-neutral-600">{item.description}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <CtaBanner
        title="Un projet spécifique en tête ?"
        text="Je m'adapte à vos besoins. Contactez-moi pour en discuter."
      />
    </div>
  );
}
