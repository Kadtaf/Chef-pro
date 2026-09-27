import {
  Award,
  BookOpen,
  Calculator,
  ChefHat,
  ClipboardCheck,
  GraduationCap,
  Languages,
  MapPin,
  ScrollText,
  Timer,
  Users,
} from 'lucide-react';
import { careerPeriod, careerYears, usePublishedCareer, type CareerExperience } from '@/features/career/api';
import { DEFAULT_SETTINGS, useSiteSettings } from '@/features/settings/api';
import { cn } from '@/shared/lib/cn';
import { imageUrl } from '@/shared/lib/storage';
import { ToqueIcon } from '@/shared/ui/culinary-icons';
import { ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Reveal } from '@/shared/ui/reveal';
import { Seo } from '@/shared/ui/seo';
import { Container, CtaBanner, SectionHeading } from './components/sections';

const SAVOIR_FAIRE = [
  {
    icon: ChefHat,
    title: 'Direction de cuisine',
    text: 'Production, achats, stocks, organisation des mises en place et coordination des services.',
  },
  {
    icon: ScrollText,
    title: 'Création de cartes',
    text: 'Cartes et menus de saison, fiches techniques et ratios de rentabilité.',
  },
  {
    icon: Calculator,
    title: 'Maîtrise des coûts',
    text: 'Optimisation des coûts matières, analyse des marges et réduction du gaspillage.',
  },
  {
    icon: Users,
    title: 'Management & transmission',
    text: "Encadrement d'équipes jusqu'à 10 personnes, formation des apprentis et nouveaux collaborateurs.",
  },
  {
    icon: ClipboardCheck,
    title: 'Qualité & HACCP',
    text: "Contrôle qualité permanent, procédures internes et application rigoureuse des normes d'hygiène.",
  },
  {
    icon: Timer,
    title: 'Régularité en service',
    text: "Rapidité d'exécution, précision du dressage et constance, même en période de forte affluence.",
  },
];

function ExperienceCard({ experience, index }: { experience: CareerExperience; index: number }) {
  const reversed = index % 2 === 1;
  const chips = (items: string[], tone: 'gold' | 'neutral' | 'bordeaux') =>
    items.length > 0 && (
      <ul className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium',
              tone === 'gold' && 'bg-secondary-100 text-secondary-800',
              tone === 'neutral' && 'border border-neutral-300 text-neutral-700',
              tone === 'bordeaux' && 'bg-primary-50 text-primary-800',
            )}
          >
            {item}
          </li>
        ))}
      </ul>
    );

  return (
    <Reveal as="li" className="relative">
      <article
        className={cn('grid items-center gap-8 lg:grid-cols-2 lg:gap-14', reversed && 'lg:[&>*:first-child]:order-2')}
      >
        <div className="relative aspect-4/3 overflow-hidden rounded-3xl bg-neutral-900">
          {experience.image_url ? (
            <img src={imageUrl(experience.image_url, 960)} alt="" className="size-full object-cover" loading="lazy" />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-4 bg-linear-to-br from-primary-900 via-neutral-950 to-neutral-900 text-secondary-300">
              <ToqueIcon size={64} />
              <span className="font-display text-2xl text-cream-50/80">{experience.establishment}</span>
            </div>
          )}
          <span className="absolute top-5 left-5 rounded-full bg-cream-50/95 px-4 py-1.5 font-display text-lg text-neutral-900 backdrop-blur">
            {careerPeriod(experience)}
          </span>
        </div>

        <div>
          <p className="eyebrow">
            {experience.cuisine_types.join(' · ') || 'Cuisine'}
            {experience.city && (
              <span className="inline-flex items-center gap-1 tracking-normal text-neutral-500 normal-case">
                <MapPin className="size-3.5" aria-hidden />
                {experience.city}
              </span>
            )}
          </p>
          <h3 className="mb-1 text-4xl text-neutral-900">{experience.role}</h3>
          <p className="mb-5 font-display text-2xl text-primary-700 italic">{experience.establishment}</p>
          <p className="mb-6 leading-relaxed text-neutral-700">{experience.summary}</p>

          {experience.missions.length > 0 && (
            <div className="mb-6">
              <h4 className="mb-3 font-sans text-xs font-semibold tracking-[0.2em] text-neutral-500 uppercase">
                Missions principales
              </h4>
              <ul className="space-y-2">
                {experience.missions.map((mission) => (
                  <li key={mission} className="flex gap-3 text-sm text-neutral-700">
                    <span className="mt-2 size-1.5 shrink-0 rotate-45 bg-secondary-500" aria-hidden />
                    {mission}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4">
            {experience.skills.length > 0 && (
              <div>
                <h4 className="mb-2 font-sans text-xs font-semibold tracking-[0.2em] text-neutral-500 uppercase">
                  Compétences démontrées
                </h4>
                {chips(experience.skills, 'gold')}
              </div>
            )}
            {experience.techniques.length > 0 && (
              <div>
                <h4 className="mb-2 font-sans text-xs font-semibold tracking-[0.2em] text-neutral-500 uppercase">
                  Techniques culinaires
                </h4>
                {chips(experience.techniques, 'neutral')}
              </div>
            )}
            {experience.cuisine_types.length > 0 && (
              <div>
                <h4 className="mb-2 font-sans text-xs font-semibold tracking-[0.2em] text-neutral-500 uppercase">
                  Types de cuisine
                </h4>
                {chips(experience.cuisine_types, 'bordeaux')}
              </div>
            )}
          </div>
        </div>
      </article>
    </Reveal>
  );
}

export function Component() {
  const { data: settings } = useSiteSettings();
  const { data: career = [], isPending, isError, error, refetch } = usePublishedCareer();
  const site = { ...DEFAULT_SETTINGS, ...settings };
  const chefName = settings?.chef_name || site.site_name;

  const headRoles = career.filter((c) => /chef de cuisine/i.test(c.role));
  const longestHeadRole = headRoles.reduce<CareerExperience | null>(
    (best, c) => (!best || careerYears(c) > careerYears(best) ? c : best),
    null,
  );
  const establishments = new Set(career.map((c) => c.establishment)).size;
  const figures = [
    settings?.years_experience
      ? { value: `${settings.years_experience}+`, label: "ans d'expérience en cuisine" }
      : null,
    longestHeadRole
      ? { value: String(careerYears(longestHeadRole)), label: `ans chef de cuisine · ${longestHeadRole.establishment}` }
      : null,
    { value: '10', label: 'personnes encadrées en brigade' },
    establishments ? { value: String(establishments), label: 'maisons au service de la table' } : null,
  ].filter((f): f is { value: string; label: string } => !!f);

  return (
    <div className="animate-fade-in">
      <Seo
        title={`${chefName} — Chef de cuisine à Bordeaux`}
        description={`Parcours de ${chefName}, chef de cuisine à Bordeaux : plus de ${settings?.years_experience ?? 20} ans en restauration traditionnelle et semi-gastronomique.`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: chefName,
          jobTitle: settings?.chef_title ?? 'Chef de cuisine',
          image: settings?.chef_portrait_url ?? undefined,
          address: { '@type': 'PostalAddress', addressLocality: 'Bordeaux', addressCountry: 'FR' },
          knowsLanguage: settings?.languages?.map((l) => l.split('—')[0]?.trim()),
        }}
      />

      <section className="relative overflow-hidden bg-neutral-950 text-cream-50">
        <div
          className="pointer-events-none absolute -top-40 -right-40 size-144 rounded-full bg-primary-800/30 blur-3xl"
          aria-hidden
        />
        <Container className="relative grid items-center gap-12 py-20 lg:grid-cols-[1fr_1.1fr] lg:py-28">
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-4 rounded-[2.5rem] border border-secondary-500/30" aria-hidden />
            <div className="relative aspect-4/5 overflow-hidden rounded-4xl bg-neutral-900">
              {settings?.chef_portrait_url ? (
                <img
                  src={imageUrl(settings.chef_portrait_url, 900)}
                  alt={`Portrait de ${chefName}`}
                  className="size-full object-cover"
                  fetchPriority="high"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-linear-to-br from-primary-900 to-neutral-950 text-secondary-300">
                  <ToqueIcon size={120} />
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="eyebrow text-secondary-400">{settings?.chef_title ?? 'Chef de cuisine'} · Bordeaux</p>
            <h1 className="mb-6 text-6xl leading-none font-medium md:text-7xl">{chefName}</h1>
            <div className="mb-8 h-px w-20 bg-secondary-500" />
            {settings?.chef_bio && (
              <p className="mb-10 text-lg leading-relaxed text-neutral-300">{settings.chef_bio}</p>
            )}
            <dl className="grid grid-cols-2 gap-6">
              {figures.map((figure) => (
                <div key={figure.label} className="border-l border-secondary-500/40 pl-4">
                  <dd className="font-display text-5xl text-secondary-300">{figure.value}</dd>
                  <dt className="mt-1 text-sm text-neutral-400">{figure.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <SectionHeading
            eyebrow="Parcours"
            title="Parcours culinaire & réalisations professionnelles"
            subtitle="De cuisinier à chef de cuisine : une progression construite en brigade, au plus près du produit et des équipes."
          />
          {isPending ? (
            <PageLoader />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : (
            <ol className="space-y-24">
              {career.map((experience, index) => (
                <ExperienceCard key={experience.id} experience={experience} index={index} />
              ))}
            </ol>
          )}
        </Container>
      </section>

      <section className="bg-cream-100 py-24">
        <Container>
          <SectionHeading eyebrow="Savoir-faire" title="L'exigence au quotidien" />
          <ul className="grid gap-px overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
            {SAVOIR_FAIRE.map(({ icon: Icon, title, text }, index) => (
              <Reveal as="li" key={title} delay={index * 60} className="bg-cream-50 p-8">
                <Icon className="mb-5 size-8 text-primary-700" aria-hidden />
                <h3 className="mb-2 text-2xl text-neutral-900">{title}</h3>
                <p className="text-neutral-600">{text}</p>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      {(settings?.education?.length || settings?.languages?.length) && (
        <section className="py-24">
          <Container className="grid gap-16 lg:grid-cols-2">
            {settings?.education && settings.education.length > 0 && (
              <div>
                <p className="eyebrow">
                  <GraduationCap className="size-4" aria-hidden /> Formations
                </p>
                <h2 className="mb-8 text-4xl text-neutral-900">Formations & diplômes</h2>
                <ul className="space-y-4">
                  {settings.education.map((item) => {
                    const [year, ...rest] = item.split('—');
                    return (
                      <li key={item} className="flex gap-6 border-b border-neutral-200 pb-4">
                        <span className="w-28 shrink-0 font-display text-xl text-primary-700">{year?.trim()}</span>
                        <span className="text-neutral-700">{rest.join('—').trim() || item}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <div className="space-y-12">
              {settings?.languages && settings.languages.length > 0 && (
                <div>
                  <p className="eyebrow">
                    <Languages className="size-4" aria-hidden /> Langues
                  </p>
                  <ul className="flex flex-wrap gap-3">
                    {settings.languages.map((language) => (
                      <li key={language} className="rounded-full border border-neutral-300 px-4 py-2 text-neutral-700">
                        {language}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="rounded-3xl bg-neutral-950 p-8 text-cream-50">
                <Award className="mb-4 size-8 text-secondary-400" aria-hidden />
                <h3 className="mb-3 text-3xl">Un parcours atypique</h3>
                <p className="text-neutral-300">
                  Une formation scientifique, puis la passion de la cuisine devenue un métier : rigueur, méthode et sens
                  de l&apos;organisation au service de la table.
                </p>
                <p className="mt-6 flex items-center gap-2 text-sm text-secondary-300">
                  <BookOpen className="size-4" aria-hidden />
                  Découvrez les techniques et conseils du Chef sur le blog.
                </p>
              </div>
            </div>
          </Container>
        </section>
      )}

      <CtaBanner
        title="Un projet, un service, un événement ?"
        text="Remplacement, renfort de brigade, consulting ou chef à domicile : parlons de vos besoins."
        secondary={{ label: 'Voir les prestations', to: '/services' }}
      />
    </div>
  );
}
