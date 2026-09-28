import { ArrowRight, Quote } from 'lucide-react';
import { Link } from 'react-router';
import { ARTICLE_KINDS, usePublishedArticles } from '@/features/articles/api';
import { usePublicReviews } from '@/features/comments/api';
import { useBlogRecipes, useFeaturedRecipes } from '@/features/recipes/api';
import { RecipeCard } from '@/features/recipes/recipe-card';
import { DEFAULT_SETTINGS, useSiteSettings } from '@/features/settings/api';
import { usePublishedServices } from '@/features/services/api';
import { ServiceIcon } from '@/features/services/service-icon';
import { careerYears, usePublishedCareer } from '@/features/career/api';
import { currentSeason, SEASON_WORDING, useSeasons, useTerms } from '@/features/taxonomy/api';
import { formatCurrency } from '@/shared/lib/format';
import { imageUrl } from '@/shared/lib/storage';
import { Button } from '@/shared/ui/button';
import { RecipeTypeIcon, SeasonIcon, ToqueIcon } from '@/shared/ui/culinary-icons';
import { Reveal } from '@/shared/ui/reveal';
import { Seo } from '@/shared/ui/seo';
import { Container, CtaBanner, SectionHeading } from './components/sections';
import { StarRating } from './components/star-rating';
import { CHEF_PLACEHOLDER_HOME } from './images';

const HERO_IMAGE =
  'https://images.pexels.com/photos/3338497/pexels-photo-3338497.jpeg?auto=compress&cs=tinysrgb&w=2000';

export function Component() {
  const { data: settings } = useSiteSettings();
  const site = { ...DEFAULT_SETTINGS, ...settings };
  const { data: featured = [] } = useFeaturedRecipes(3);
  const recent = useBlogRecipes({ sort: 'recent' });
  const { data: types = [] } = useTerms('type');
  const { data: seasons = [] } = useSeasons();
  const { data: techniques = [] } = usePublishedArticles('technique');
  const { data: advice = [] } = usePublishedArticles('conseil');
  const { data: services = [] } = usePublishedServices();
  const { data: reviews = [] } = usePublicReviews(3);
  const { data: career = [] } = usePublishedCareer();
  const longestHeadRole = career
    .filter((c) => /chef de cuisine/i.test(c.role))
    .sort((a, b) => careerYears(b) - careerYears(a))[0];

  const spotlight = featured.length >= 3 ? featured : (recent.data?.rows.slice(0, 3) ?? []);
  const season = seasons.find((s) => s.slug === currentSeason());
  const years = settings?.years_experience || 20;
  const editorial = [
    ...techniques.slice(0, 2).map((a) => ({ ...a, kind: 'technique' as const })),
    ...advice.slice(0, 2).map((a) => ({ ...a, kind: 'conseil' as const })),
  ];

  return (
    <div className="animate-fade-in">
      <Seo
        title={site.seo_title}
        description={site.seo_description}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ProfessionalService',
          name: site.site_name,
          description: site.seo_description,
          email: site.email,
          telephone: site.phone || undefined,
          founder: settings?.chef_name
            ? { '@type': 'Person', name: settings.chef_name, jobTitle: 'Chef de cuisine' }
            : undefined,
          address: { '@type': 'PostalAddress', addressLocality: 'Bordeaux', addressCountry: 'FR' },
          areaServed: ['Bordeaux', 'Gironde'],
        }}
      />

      {/* Hero */}
      <section className="relative isolate flex min-h-[calc(100svh-5rem)] items-end overflow-hidden bg-neutral-950 text-cream-50">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 -z-10 size-full object-cover" fetchPriority="high" />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-neutral-950 via-neutral-950/60 to-neutral-950/10" />
        <Container className="w-full pt-32 pb-16 md:pb-24">
          <div className="max-w-3xl">
            <p className="eyebrow animate-slide-up text-secondary-400">Chef de cuisine · Bordeaux</p>
            <h1 className="mb-8 animate-slide-up text-6xl leading-[0.95] font-medium [animation-delay:120ms] md:text-8xl">
              L&apos;exigence d&apos;un chef,
              <span className="block text-secondary-300 italic">la générosité de la table.</span>
            </h1>
            <p className="mb-10 max-w-xl animate-slide-up text-lg text-neutral-300 [animation-delay:240ms] md:text-xl">
              Plus de {years} ans de cuisine traditionnelle et semi-gastronomique. Des recettes de saison, des
              techniques de chef et un savoir-faire au service de vos cuisines et de vos événements.
            </p>
            <div className="flex animate-slide-up flex-col gap-4 [animation-delay:360ms] sm:flex-row">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-secondary-500 text-neutral-950 hover:bg-secondary-400"
              >
                <Link to="/recettes">
                  Découvrir les recettes
                  <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-cream-50/40 text-cream-50 hover:bg-cream-50/10 hover:text-cream-50"
              >
                <Link to="/contact">Réserver le Chef</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Recipe types quick access */}
      {types.length > 0 && (
        <section className="border-b border-neutral-200 bg-cream-50 py-8">
          <Container>
            <ul className="flex scrollbar-none gap-3 overflow-x-auto pb-2">
              {types.map((type) => (
                <li key={type.id} className="shrink-0">
                  <Link
                    to={`/recettes?type=${type.slug}`}
                    className="flex flex-col items-center gap-2 rounded-2xl px-4 py-3 text-center text-sm text-neutral-700 transition-colors hover:bg-primary-50 hover:text-primary-700"
                  >
                    <span className="flex size-14 items-center justify-center rounded-full border border-neutral-300 bg-white">
                      <RecipeTypeIcon icon={type.icon ?? type.slug} className="size-6" />
                    </span>
                    {type.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* Spotlight recipes */}
      {spotlight.length > 0 && (
        <section className="py-24">
          <Container>
            <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              <SectionHeading
                eyebrow="Blog culinaire"
                title={featured.length >= 3 ? 'À la une' : 'Les dernières recettes'}
                subtitle="Des recettes de chef expliquées pas à pas, avec accords mets-vins et valeurs nutritionnelles."
                align="left"
                className="mb-0 md:mb-0"
              />
              <Link
                to="/recettes"
                className="inline-flex shrink-0 items-center gap-2 font-semibold text-primary-700 hover:underline"
              >
                Toutes les recettes
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {spotlight.map((recipe, index) => (
                <Reveal key={recipe.id} delay={index * 100}>
                  <RecipeCard recipe={recipe} />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Chef */}
      <section className="overflow-hidden bg-neutral-950 py-24 text-cream-50">
        <Container className="grid items-center gap-16 lg:grid-cols-2">
          <Reveal className="relative">
            <div className="absolute -inset-5 rounded-[2.5rem] border border-secondary-500/25" aria-hidden />
            <img
              src={imageUrl(settings?.chef_portrait_url, 900) ?? CHEF_PLACEHOLDER_HOME}
              alt={settings?.chef_portrait_url ? `Portrait de ${settings.chef_name}` : 'Cuisinier en plein service'}
              className="relative aspect-4/5 w-full rounded-4xl object-cover"
              loading="lazy"
            />
          </Reveal>
          <Reveal delay={120}>
            <p className="eyebrow text-secondary-400">
              <ToqueIcon size={16} /> Le Chef
            </p>
            <h2 className="mb-6 text-5xl font-medium md:text-6xl">{settings?.chef_name || 'Un chef de terrain'}</h2>
            <p className="mb-8 text-lg leading-relaxed text-neutral-300">
              {settings?.chef_bio ||
                'Chef de cuisine expérimenté en restauration traditionnelle et semi-gastronomique, de la création des cartes au pilotage des équipes.'}
            </p>
            <dl className="mb-10 grid grid-cols-3 gap-6 border-y border-white/10 py-8">
              <div>
                <dd className="font-display text-5xl text-secondary-300">{years}+</dd>
                <dt className="text-sm text-neutral-400">ans en cuisine</dt>
              </div>
              {longestHeadRole && (
                <div>
                  <dd className="font-display text-5xl text-secondary-300">{careerYears(longestHeadRole)}</dd>
                  <dt className="text-sm text-neutral-400">
                    ans chef · {longestHeadRole.establishment.replace(/^Restaurant /, '')}
                  </dt>
                </div>
              )}
              <div>
                <dd className="font-display text-5xl text-secondary-300">10</dd>
                <dt className="text-sm text-neutral-400">personnes encadrées</dt>
              </div>
            </dl>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-secondary-400/60 text-secondary-200 hover:bg-secondary-500 hover:text-neutral-950"
            >
              <Link to="/a-propos">
                Découvrir son parcours
                <ArrowRight />
              </Link>
            </Button>
          </Reveal>
        </Container>
      </section>

      {/* Season */}
      {season && (
        <section className="relative overflow-hidden py-24">
          <Container className="grid items-center gap-10 rounded-[2.5rem] bg-cream-100 p-8 md:p-14 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="eyebrow">
                <SeasonIcon season={season.slug} className="size-4" /> De saison
              </p>
              <h2 className="mb-4 text-4xl text-neutral-900 md:text-5xl">
                {SEASON_WORDING[season.slug]?.menu ?? 'Le menu de saison'} du Chef
              </h2>
              <p className="max-w-2xl text-lg text-neutral-600">{season.description}</p>
            </div>
            <Button asChild size="lg" className="rounded-full">
              <Link to={`/menus-de-saison?saison=${season.slug}`}>
                Voir le menu de saison
                <ArrowRight />
              </Link>
            </Button>
          </Container>
        </section>
      )}

      {/* Techniques & advice */}
      {editorial.length > 0 && (
        <section className="border-t border-neutral-200 py-24">
          <Container>
            <SectionHeading
              eyebrow="Le savoir-faire"
              title="Techniques & conseils du Chef"
              subtitle="Les gestes et les secrets de la cuisine professionnelle, expliqués simplement."
            />
            <ul className="grid gap-px overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-200 md:grid-cols-2 lg:grid-cols-4">
              {editorial.map((article) => (
                <li key={article.id} className="bg-cream-50">
                  <Link
                    to={`${ARTICLE_KINDS[article.kind].path}/${article.slug}`}
                    className="group flex h-full flex-col p-8 transition-colors hover:bg-white"
                  >
                    <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-secondary-700 uppercase">
                      {ARTICLE_KINDS[article.kind].label}
                    </p>
                    <h3 className="mb-3 text-2xl text-neutral-900 group-hover:text-primary-700">{article.title}</h3>
                    <p className="mb-6 line-clamp-3 text-sm text-neutral-600">{article.excerpt}</p>
                    <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-primary-700">
                      Lire
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* Services */}
      {services.length > 0 && (
        <section className="bg-cream-100 py-24">
          <Container>
            <SectionHeading
              eyebrow="Prestations"
              title="Le Chef à votre service"
              subtitle="Remplacement, renfort de brigade, consulting, formation ou événement privé."
            />
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {services.slice(0, 4).map((service, index) => (
                <Reveal
                  as="li"
                  key={service.id}
                  delay={index * 80}
                  className="group rounded-3xl bg-cream-50 p-8 ring-1 ring-neutral-200 transition-shadow hover:shadow-xl"
                >
                  <ServiceIcon category={service.category} className="mb-6 size-9 text-primary-700" />
                  <h3 className="mb-3 text-2xl text-neutral-900">{service.title}</h3>
                  <p className="mb-6 text-sm leading-relaxed text-neutral-600">{service.description}</p>
                  {service.price !== null && (
                    <p className="font-display text-2xl text-primary-700">
                      {formatCurrency(service.price)}{' '}
                      <span className="font-sans text-sm text-neutral-500">/ {service.price_unit}</span>
                    </p>
                  )}
                </Reveal>
              ))}
            </ul>
            <p className="mt-12 text-center">
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/services">Toutes les prestations</Link>
              </Button>
            </p>
          </Container>
        </section>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="py-24">
          <Container>
            <SectionHeading eyebrow="Ils m'ont fait confiance" title="Avis clients" />
            <ul className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {reviews.map((review) => (
                <li key={review.id}>
                  <figure className="h-full rounded-3xl border border-neutral-200 bg-white p-8">
                    <Quote className="mb-6 size-8 text-secondary-400" aria-hidden />
                    <blockquote className="mb-6 font-display text-xl leading-relaxed text-neutral-800 italic">
                      {review.content}
                    </blockquote>
                    <figcaption className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-neutral-900">{review.author_name}</span>
                      {review.rating && <StarRating rating={review.rating} size="sm" />}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <CtaBanner
        title="Donnons du goût à votre projet"
        text="Parlez-moi de votre établissement ou de votre événement : je vous réponds sous 48 h."
        secondary={{ label: 'Voir les tarifs', to: '/tarifs' }}
      />
    </div>
  );
}
