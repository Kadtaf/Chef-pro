import { ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { Container, CtaBanner, SectionHeading } from '@/features/public-site/components/sections';
import { RecipeCard } from '@/features/recipes/recipe-card';
import { currentSeason, SEASON_WORDING, useSeasons } from '@/features/taxonomy/api';
import { MENU_ITEM_TYPE_LABELS, labelOf } from '@/shared/domain/constants';
import { cn } from '@/shared/lib/cn';
import { formatCurrency } from '@/shared/lib/format';
import { imageUrl } from '@/shared/lib/storage';
import { SeasonIcon } from '@/shared/ui/culinary-icons';
import { EmptyState, PageLoader } from '@/shared/ui/feedback';
import { Reveal } from '@/shared/ui/reveal';
import { Seo } from '@/shared/ui/seo';
import { usePublishedMenus, useSeasonalMenu, useSeasonRecipes } from './api';

const SEASON_IMAGES: Record<string, string> = {
  printemps: 'https://images.pexels.com/photos/1414651/pexels-photo-1414651.jpeg?auto=compress&cs=tinysrgb&w=1920',
  ete: 'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=1920',
  automne: 'https://images.pexels.com/photos/1487511/pexels-photo-1487511.jpeg?auto=compress&cs=tinysrgb&w=1920',
  hiver: 'https://images.pexels.com/photos/6210876/pexels-photo-6210876.jpeg?auto=compress&cs=tinysrgb&w=1920',
};

export function Component() {
  const [params, setParams] = useSearchParams();
  const { data: seasons = [] } = useSeasons();
  const slug = params.get('saison') ?? currentSeason();
  const season = seasons.find((s) => s.slug === slug);
  const menu = useSeasonalMenu(slug);
  const menus = usePublishedMenus(slug);
  const recipes = useSeasonRecipes(slug);
  const courses = menu.data?.filter((c) => c.recipe) ?? [];

  return (
    <div className="animate-fade-in">
      <Seo
        title={`Menus de saison${season ? ` — ${season.name}` : ''}`}
        description="Des menus composés au fil des saisons par le Chef : entrée, plat et dessert avec des produits au sommet de leur goût."
      />

      <section className="relative overflow-hidden bg-neutral-950 text-cream-50">
        <img
          key={slug}
          src={imageUrl(season?.image_url, 1920) ?? SEASON_IMAGES[slug]}
          alt=""
          className="absolute inset-0 size-full animate-fade-in object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-linear-to-b from-neutral-950/40 to-neutral-950" />
        <Container className="relative py-24 text-center md:py-32">
          <p className="eyebrow justify-center text-secondary-400">Menus de saison</p>
          <h1 className="mb-6 text-6xl font-medium md:text-7xl">{season?.name ?? 'La saison'} à table</h1>
          <p className="mx-auto mb-12 max-w-2xl text-lg text-neutral-300">{season?.description}</p>
          <div
            className="inline-flex flex-wrap justify-center gap-2 rounded-full border border-white/15 bg-white/5 p-1.5 backdrop-blur"
            role="tablist"
          >
            {seasons.map((s) => (
              <button
                key={s.slug}
                type="button"
                role="tab"
                aria-selected={s.slug === slug}
                onClick={() => setParams({ saison: s.slug }, { replace: true, preventScrollReset: true })}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors',
                  s.slug === slug ? 'bg-secondary-500 text-neutral-950' : 'text-cream-100 hover:bg-white/10',
                )}
              >
                <SeasonIcon season={s.slug} className="size-4" />
                {s.name}
              </button>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container className="max-w-4xl">
          <SectionHeading
            eyebrow="Composé par le Chef"
            title={SEASON_WORDING[slug]?.menu ?? 'Le menu de saison'}
            subtitle="Une entrée, un plat, un dessert : les recettes les mieux notées de la saison, réunies en un menu équilibré."
          />
          {menu.isPending ? (
            <PageLoader />
          ) : courses.length === 0 ? (
            <EmptyState
              title="Menu en préparation"
              description="Les recettes de cette saison arrivent bientôt sur le blog."
            />
          ) : (
            <ol className="relative mx-auto max-w-2xl rounded-[2.5rem] border border-secondary-300/60 bg-cream-100 px-8 py-14 text-center md:px-16">
              {courses.map((course, index) => (
                <Reveal as="li" key={course.type} delay={index * 120} className="py-6">
                  <p className="mb-2 text-xs font-semibold tracking-[0.3em] text-secondary-700 uppercase">
                    {course.label}
                  </p>
                  <Link to={`/recettes/${course.recipe!.slug}`} className="group inline-block">
                    <h3 className="font-display text-3xl text-neutral-900 group-hover:text-primary-700 md:text-4xl">
                      {course.recipe!.title}
                    </h3>
                  </Link>
                  {course.recipe!.description && (
                    <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600 italic">
                      {course.recipe!.description}
                    </p>
                  )}
                  {index < courses.length - 1 && <div className="gold-rule mt-10" />}
                </Reveal>
              ))}
            </ol>
          )}
        </Container>
      </section>

      {menus.data && menus.data.length > 0 && (
        <section className="bg-cream-100 py-24">
          <Container>
            <SectionHeading eyebrow="À la carte du Chef" title="Menus signature" />
            <ul className="grid gap-8 md:grid-cols-2">
              {menus.data.map((m) => (
                <li key={m.id} className="rounded-3xl bg-cream-50 p-8 shadow-sm ring-1 ring-neutral-200">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <h3 className="text-3xl text-neutral-900">{m.title}</h3>
                    {m.price > 0 && <p className="font-display text-3xl text-primary-700">{formatCurrency(m.price)}</p>}
                  </div>
                  {m.description && <p className="mb-6 text-neutral-600">{m.description}</p>}
                  <ul className="space-y-4">
                    {m.menu_items.map((item) => (
                      <li key={item.position} className="border-t border-neutral-200 pt-4">
                        <p className="text-xs font-semibold tracking-[0.2em] text-secondary-700 uppercase">
                          {labelOf(MENU_ITEM_TYPE_LABELS, item.item_type)}
                        </p>
                        {item.recipes ? (
                          <Link
                            to={`/recettes/${item.recipes.slug}`}
                            className="font-display text-xl text-neutral-900 hover:text-primary-700"
                          >
                            {item.custom_title || item.recipes.title}
                          </Link>
                        ) : (
                          <p className="font-display text-xl text-neutral-900">{item.custom_title}</p>
                        )}
                        {item.custom_description && (
                          <p className="text-sm text-neutral-500">{item.custom_description}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {recipes.data && recipes.data.length > 0 && (
        <section className="py-24">
          <Container>
            <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Recettes de saison</p>
                <h2 className="section-title mb-0">Au marché {SEASON_WORDING[slug]?.now}</h2>
              </div>
              <Link
                to={`/recettes?saison=${slug}`}
                className="inline-flex items-center gap-2 font-semibold text-primary-700 hover:underline"
              >
                Toutes les recettes de saison
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.data.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </Container>
        </section>
      )}

      <CtaBanner
        title="Un menu sur mesure pour votre événement ?"
        text="Mariage, repas d'affaires, dîner privé : le Chef compose un menu de saison adapté à vos convives."
      />
    </div>
  );
}
