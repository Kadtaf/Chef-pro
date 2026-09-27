import { X } from 'lucide-react';
import { useDeferredValue, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { Container, PageHero } from '@/features/public-site/components/sections';
import { SEASON_LABELS, SEASON_VALUES } from '@/shared/domain/constants';
import { Button } from '@/shared/ui/button';
import { EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Select } from '@/shared/ui/form';
import { SearchInput } from '@/shared/ui/layout';
import { Seo } from '@/shared/ui/seo';
import { usePublishedRecipes } from './api';
import { RecipeCard } from './recipe-card';

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '');

export function Component() {
  const { data: recipes = [], isPending, isError, error, refetch } = usePublishedRecipes();
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const category = params.get('categorie') ?? '';
  const season = params.get('saison') ?? '';
  const deferredSearch = useDeferredValue(search);

  const update = (key: string, value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );

  const categories = useMemo(() => [...new Set(recipes.map((r) => r.category))].sort(), [recipes]);

  const filtered = useMemo(() => {
    const term = normalize(deferredSearch);
    return recipes.filter(
      (r) =>
        (!term || normalize(`${r.title} ${r.description ?? ''}`).includes(term)) &&
        (!category || r.category === category) &&
        (!season || r.season === season || r.season === 'all'),
    );
  }, [recipes, deferredSearch, category, season]);

  const hasFilters = !!(search || category || season);

  return (
    <div className="animate-fade-in">
      <Seo
        title="Recettes"
        description="Recettes de chef avec valeurs nutritionnelles détaillées et Nutri-Score : entrées, plats, desserts de saison."
      />
      <PageHero title="Recettes" subtitle="Mes créations culinaires avec valeurs nutritionnelles détaillées" />

      <section className="sticky top-20 z-40 border-b border-neutral-200 bg-white/95 py-5 backdrop-blur">
        <Container className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput
            className="w-full md:w-96"
            placeholder="Rechercher une recette…"
            aria-label="Rechercher une recette"
            value={search}
            onChange={(e) => update('q', e.target.value)}
          />
          <div className="flex flex-wrap gap-3">
            <Select
              className="w-auto"
              aria-label="Catégorie"
              value={category}
              onChange={(e) => update('categorie', e.target.value)}
            >
              <option value="">Toutes catégories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
            <Select
              className="w-auto"
              aria-label="Saison"
              value={season}
              onChange={(e) => update('saison', e.target.value)}
            >
              <option value="">Toutes saisons</option>
              {SEASON_VALUES.filter((s) => s !== 'all').map((s) => (
                <option key={s} value={s}>
                  {SEASON_LABELS[s]}
                </option>
              ))}
            </Select>
            {hasFilters && (
              <Button variant="ghost" onClick={() => setParams({}, { replace: true })}>
                <X />
                Réinitialiser
              </Button>
            )}
          </div>
        </Container>
      </section>

      <section className="bg-neutral-50 py-16">
        <Container>
          {isPending ? (
            <PageLoader />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : filtered.length === 0 ? (
            <EmptyState title="Aucune recette trouvée" description="Essayez d'autres filtres." />
          ) : (
            <>
              <p className="mb-6 text-sm text-neutral-500" aria-live="polite">
                {filtered.length} recette{filtered.length > 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </>
          )}
        </Container>
      </section>
    </div>
  );
}
