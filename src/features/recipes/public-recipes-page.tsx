import { SlidersHorizontal, X } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { NewsletterSignup } from '@/features/newsletter/newsletter-signup';
import { Container, PageHero } from '@/features/public-site/components/sections';
import { useSeasons, useTerms } from '@/features/taxonomy/api';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { RecipeTypeIcon, SeasonIcon } from '@/shared/ui/culinary-icons';
import { Dialog } from '@/shared/ui/dialog';
import { EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Select } from '@/shared/ui/form';
import { SearchInput } from '@/shared/ui/layout';
import { Pagination } from '@/shared/ui/pagination';
import { Seo } from '@/shared/ui/seo';
import { BLOG_PAGE_SIZE, useBlogRecipes, type BlogFilters } from './api';
import { RecipeCard } from './recipe-card';

const SORTS: { value: NonNullable<BlogFilters['sort']>; label: string }[] = [
  { value: 'recent', label: 'Les plus récentes' },
  { value: 'popular', label: 'Les plus consultées' },
  { value: 'rated', label: 'Les mieux notées' },
  { value: 'quick', label: 'Les plus rapides' },
];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all',
        active
          ? 'border-primary-700 bg-primary-700 text-cream-50 shadow-sm'
          : 'border-neutral-300 bg-white text-neutral-700 hover:border-primary-300 hover:text-primary-700',
      )}
    >
      {children}
    </button>
  );
}

export function Component() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data: types = [] } = useTerms('type');
  const { data: seasons = [] } = useSeasons();

  // The search box is local state (instant typing), mirrored in the URL.
  const [search, setSearch] = useState(params.get('q') ?? '');
  const deferredSearch = useDeferredValue(search.trim());

  const filters: BlogFilters = {
    q: params.get('q') ?? '',
    season: params.get('saison') ?? '',
    type: params.get('type') ?? '',
    sort: (params.get('tri') as BlogFilters['sort']) ?? 'recent',
    page: Math.max(0, Number(params.get('page') ?? 1) - 1),
  };

  const update = (changes: Record<string, string | null>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        if (!('page' in changes)) next.delete('page');
        return next;
      },
      { replace: true, preventScrollReset: true },
    );

  useEffect(() => {
    if (deferredSearch !== (params.get('q') ?? '')) update({ q: deferredSearch || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only when the debounced text changes
  }, [deferredSearch]);

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useBlogRecipes(filters);
  const activeCount = [filters.q, filters.season, filters.type].filter(Boolean).length;
  const reset = () => {
    setSearch('');
    setParams({}, { replace: true });
  };

  const filterControls = (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-neutral-500 uppercase">Saison</p>
        <div className="flex flex-wrap gap-2">
          <Chip active={!filters.season} onClick={() => update({ saison: null })}>
            Toutes
          </Chip>
          {seasons.map((season) => (
            <Chip
              key={season.slug}
              active={filters.season === season.slug}
              onClick={() => update({ saison: filters.season === season.slug ? null : season.slug })}
            >
              <SeasonIcon season={season.slug} className="size-4" />
              {season.name}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-neutral-500 uppercase">Type de recette</p>
        <div className="flex flex-wrap gap-2">
          <Chip active={!filters.type} onClick={() => update({ type: null })}>
            Tous
          </Chip>
          {types.map((type) => (
            <Chip
              key={type.id}
              active={filters.type === type.slug}
              onClick={() => update({ type: filters.type === type.slug ? null : type.slug })}
            >
              <RecipeTypeIcon icon={type.icon ?? type.slug} className="size-4" />
              {type.name}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <Seo
        title="Blog culinaire — recettes de chef"
        description="Recettes de chef par saison et par type : entrées, plats, poissons, desserts, pâtisseries. Ingrédients, techniques, accords mets-vins, valeurs nutritionnelles et allergènes."
      />
      <PageHero
        eyebrow="Blog culinaire"
        title="Recettes de Chef"
        subtitle="Des recettes de saison expliquées pas à pas : techniques, conseils, accords mets-vins et valeurs nutritionnelles."
        image="https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=1920"
      />

      <section className="sticky top-20 z-30 border-b border-neutral-200 bg-cream-50/95 py-4 backdrop-blur-xl">
        <Container className="flex flex-col gap-3 md:flex-row md:items-center">
          <SearchInput
            className="flex-1"
            placeholder="Rechercher une recette, un ingrédient, une technique…"
            aria-label="Rechercher une recette"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-2">
            <Select
              className="w-auto"
              aria-label="Trier"
              value={filters.sort}
              onChange={(e) => update({ tri: e.target.value === 'recent' ? null : e.target.value })}
            >
              {SORTS.map((sort) => (
                <option key={sort.value} value={sort.value}>
                  {sort.label}
                </option>
              ))}
            </Select>
            <Button variant="subtle" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal />
              Filtres{activeCount > 0 && ` (${activeCount})`}
            </Button>
          </div>
        </Container>
      </section>

      <section className="py-12">
        <Container className="grid gap-10 lg:grid-cols-[18rem_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-44 space-y-8">
              {filterControls}
              {activeCount > 0 && (
                <Button variant="ghost" onClick={reset}>
                  <X />
                  Effacer les filtres
                </Button>
              )}
            </div>
          </aside>

          <div>
            {isPending ? (
              <PageLoader />
            ) : isError ? (
              <ErrorState error={error} onRetry={() => void refetch()} />
            ) : data.rows.length === 0 ? (
              <EmptyState
                title="Aucune recette ne correspond"
                description="Essayez une autre saison, un autre type ou un autre mot-clé."
                action={
                  activeCount > 0 ? (
                    <Button variant="subtle" onClick={reset}>
                      Voir toutes les recettes
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <>
                <p className="mb-8 text-sm text-neutral-500" aria-live="polite">
                  {data.total} recette{data.total > 1 ? 's' : ''}
                </p>
                <div
                  className={cn(
                    'grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3',
                    isPlaceholderData && 'opacity-60',
                  )}
                >
                  {data.rows.map((recipe, index) => (
                    <RecipeCard key={recipe.id} recipe={recipe} priority={index < 3} />
                  ))}
                </div>
                <div className="mt-14">
                  <Pagination
                    page={filters.page ?? 0}
                    pageSize={BLOG_PAGE_SIZE}
                    total={data.total}
                    onPageChange={(page) => {
                      update({ page: page ? String(page + 1) : null });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                </div>
              </>
            )}

            <div className="mt-20 rounded-3xl bg-neutral-950 p-8 md:p-12">
              <p className="eyebrow text-secondary-400">Les inspirations du Chef</p>
              <h2 className="mb-6 text-3xl text-cream-50 md:text-4xl">
                Une nouvelle recette de saison dans votre boîte mail
              </h2>
              <NewsletterSignup />
            </div>
          </div>
        </Container>
      </section>

      <Dialog
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title="Filtrer les recettes"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={reset}>
              Effacer
            </Button>
            <Button onClick={() => setFiltersOpen(false)}>
              Voir {data?.total ?? ''} recette{(data?.total ?? 0) > 1 ? 's' : ''}
            </Button>
          </>
        }
      >
        {filterControls}
      </Dialog>
    </div>
  );
}
