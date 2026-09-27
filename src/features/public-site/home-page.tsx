import { ArrowRight, Award, ChefHat, Quote, Users } from 'lucide-react';
import { Link } from 'react-router';
import { usePublicReviews } from '@/features/comments/api';
import { usePublishedPortfolio } from '@/features/portfolio/api';
import { useFeaturedRecipes } from '@/features/recipes/api';
import { RecipeCard } from '@/features/recipes/recipe-card';
import { DEFAULT_SETTINGS, useSiteSettings } from '@/features/settings/api';
import { usePublishedServices } from '@/features/services/api';
import { ServiceIcon } from '@/features/services/service-icon';
import { cn } from '@/shared/lib/cn';
import { formatCurrency } from '@/shared/lib/format';
import { imageUrl } from '@/shared/lib/storage';
import { Button } from '@/shared/ui/button';
import { Seo } from '@/shared/ui/seo';
import { Container, CtaBanner, SectionHeading } from './components/sections';
import { StarRating } from './components/star-rating';

const HERO_IMAGE =
  'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=1920';
const PORTFOLIO_FALLBACK =
  'https://images.pexels.com/photos/2092906/pexels-photo-2092906.jpeg?auto=compress&cs=tinysrgb&w=600';

const STATS = [
  { value: '15+', label: "Années d'expérience" },
  { value: '200+', label: 'Clients satisfaits' },
  { value: '50+', label: 'Restaurants accompagnés' },
];

export function Component() {
  const { data: settings } = useSiteSettings();
  const { data: services = [] } = usePublishedServices();
  const { data: recipes = [] } = useFeaturedRecipes(3);
  const { data: reviews = [] } = usePublicReviews(3);
  const { data: portfolio = [] } = usePublishedPortfolio({ featuredOnly: true, limit: 4 });
  const site = { ...DEFAULT_SETTINGS, ...settings };

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
          address: { '@type': 'PostalAddress', addressLocality: 'Bordeaux', addressCountry: 'FR' },
          areaServed: 'Bordeaux',
        }}
      />

      <section className="relative flex min-h-[90vh] items-center overflow-hidden">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 size-full object-cover" fetchPriority="high" />
        <div className="absolute inset-0 bg-neutral-900/70 backdrop-blur-[2px]" />
        <Container className="relative py-20">
          <div className="max-w-3xl">
            <p className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-sm">
              <ChefHat className="size-4" aria-hidden />
              Chef de cuisine freelance à Bordeaux
            </p>
            <h1 className="mb-6 text-4xl leading-tight font-bold text-white md:text-5xl lg:text-6xl">
              Créez des expériences
              <span className="block bg-linear-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                gastronomiques inoubliables
              </span>
            </h1>
            <p className="mb-10 max-w-2xl text-lg leading-relaxed text-neutral-300 md:text-xl">
              Expertise culinaire professionnelle pour restaurants, événements privés et consulting. Plus de 15 ans
              d&apos;expérience au service de votre réussite.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/contact">
                  Demander un devis gratuit
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Link to="/portfolio">Voir mon portfolio</Link>
              </Button>
            </div>
            <dl className="mt-16 grid max-w-md grid-cols-3 gap-8">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <dd className="font-display text-3xl font-bold text-white">{stat.value}</dd>
                  <dt className="text-sm text-neutral-400">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      {services.length > 0 && (
        <section className="bg-white py-24">
          <Container>
            <SectionHeading title="Mes services" subtitle="Des solutions culinaires sur mesure pour tous vos besoins" />
            <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {services.slice(0, 4).map((service) => (
                <li
                  key={service.id}
                  className="group rounded-xl border border-neutral-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
                >
                  <div className="mb-6 flex size-14 items-center justify-center rounded-xl bg-linear-to-br from-primary-100 to-secondary-100 transition-transform group-hover:scale-110">
                    <ServiceIcon category={service.category} className="size-7 text-primary-600" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-neutral-900">{service.title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-neutral-600">{service.description}</p>
                  {service.price !== null && (
                    <p className="flex items-baseline gap-1 text-primary-600">
                      <span className="font-display text-2xl font-bold">{formatCurrency(service.price)}</span>
                      <span className="text-sm text-neutral-500">/{service.price_unit}</span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-12 text-center">
              <Button asChild variant="outline">
                <Link to="/services">Découvrir tous mes services</Link>
              </Button>
            </p>
          </Container>
        </section>
      )}

      <section className="bg-linear-to-br from-neutral-50 to-neutral-100 py-24">
        <Container className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2 text-sm font-medium text-primary-700">
              <ChefHat className="size-4" aria-hidden />À propos
            </p>
            <h2 className="section-title">Une passion au service de l&apos;excellence culinaire</h2>
            <p className="mb-6 leading-relaxed text-neutral-600">
              Chef de cuisine passionné avec plus de 15 ans d&apos;expérience dans des établissements gastronomiques
              prestigieux, je mets mon expertise au service des professionnels de la restauration et des particuliers.
            </p>
            <p className="mb-8 leading-relaxed text-neutral-600">
              De la création de menus à l&apos;optimisation des coûts matières, en passant par la formation de vos
              équipes, je vous accompagne dans chaque aspect de votre projet culinaire.
            </p>
            <ul className="mb-8 flex flex-wrap gap-6">
              <li className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-lg bg-success-100">
                  <Award className="size-6 text-success-600" aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold text-neutral-900">Expertise certifiée</span>
                  <span className="text-sm text-neutral-500">Formation continue</span>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-lg bg-primary-100">
                  <Users className="size-6 text-primary-600" aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold text-neutral-900">Accompagnement</span>
                  <span className="text-sm text-neutral-500">Personnalisé</span>
                </span>
              </li>
            </ul>
            <Button asChild>
              <Link to="/a-propos">
                En savoir plus
                <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="relative order-1 lg:order-2">
            <div className="aspect-4/3 overflow-hidden rounded-2xl shadow-2xl">
              <img
                src="https://images.pexels.com/photos/239581/pexels-photo-239581.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Chef en cuisine"
                className="size-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="absolute -right-4 -bottom-8 max-w-xs rounded-2xl bg-white p-6 shadow-xl sm:-right-8">
              <p className="mb-4 flex items-center gap-4">
                <span className="font-display text-4xl font-bold text-primary-600">15+</span>
                <span className="text-sm text-neutral-600">années d&apos;expérience en cuisine gastronomique</span>
              </p>
              <StarRating rating={5} />
            </div>
          </div>
        </Container>
      </section>

      {recipes.length > 0 && (
        <section className="bg-white py-24">
          <Container>
            <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
              <SectionHeading
                title="Recettes en vedette"
                subtitle="Découvrez mes créations culinaires"
                align="left"
                className="mb-0 md:mb-0"
              />
              <Button asChild variant="outline">
                <Link to="/recettes">Voir toutes les recettes</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="bg-neutral-900 py-24">
          <Container>
            <div className="mb-16 text-center">
              <h2 className="section-title text-white">Ce que disent mes clients</h2>
              <p className="mx-auto section-subtitle text-neutral-400">
                La satisfaction de mes clients est ma priorité
              </p>
            </div>
            <ul className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {reviews.map((review) => (
                <li key={review.id}>
                  <figure className="h-full rounded-2xl bg-neutral-800/50 p-8 backdrop-blur-sm">
                    <Quote className="mb-6 size-10 text-primary-400/30" aria-hidden />
                    <blockquote className="mb-6 leading-relaxed text-neutral-300">{review.content}</blockquote>
                    <figcaption className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-3">
                        <span className="flex size-12 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-secondary-500 font-semibold text-white">
                          {review.author_name.charAt(0).toUpperCase()}
                        </span>
                        <span className="font-semibold text-white">{review.author_name}</span>
                      </span>
                      {review.rating && <StarRating rating={review.rating} size="sm" />}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
            <p className="mt-12 text-center">
              <Button asChild variant="outline" className="border-neutral-600 text-white hover:bg-white/10">
                <Link to="/avis">Voir tous les avis</Link>
              </Button>
            </p>
          </Container>
        </section>
      )}

      {portfolio.length > 0 && (
        <section className="bg-white py-24">
          <Container>
            <SectionHeading title="Portfolio" subtitle="Découvrez mes réalisations et projets culinaires" />
            <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {portfolio.map((item, index) => (
                <li key={item.id} className={cn(index === 0 && 'col-span-2 row-span-2')}>
                  <Link to="/portfolio" className="group relative block size-full overflow-hidden rounded-xl">
                    <img
                      src={imageUrl(item.image_url, index === 0 ? 900 : 450) ?? PORTFOLIO_FALLBACK}
                      alt={item.title}
                      loading="lazy"
                      className={cn(
                        'size-full object-cover transition-transform duration-700 group-hover:scale-110',
                        index === 0 ? 'aspect-square lg:aspect-auto' : 'aspect-square',
                      )}
                    />
                    <span className="absolute inset-0 bg-linear-to-t from-neutral-900/80 via-neutral-900/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                      <span className="absolute inset-x-0 bottom-0 p-6">
                        <span className="block font-display font-semibold text-white">{item.title}</span>
                        <span className="text-sm text-neutral-300">{item.category}</span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-12 text-center">
              <Button asChild>
                <Link to="/portfolio">
                  Voir tout le portfolio
                  <ArrowRight />
                </Link>
              </Button>
            </p>
          </Container>
        </section>
      )}

      <CtaBanner
        title="Prêt à transformer votre projet culinaire ?"
        text="Contactez-moi pour discuter de vos besoins et obtenir un devis personnalisé gratuit."
        secondary={{ label: 'Voir mes tarifs', to: '/tarifs' }}
      />
    </div>
  );
}
