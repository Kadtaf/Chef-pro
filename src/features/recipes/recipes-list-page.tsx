import { ChefHat, Eye, EyeOff, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { RECIPE_CATEGORIES } from '@/shared/domain/constants';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { cn } from '@/shared/lib/cn';
import { formatDuration } from '@/shared/lib/format';
import { imageUrl } from '@/shared/lib/storage';
import { Button } from '@/shared/ui/button';
import { useConfirm } from '@/shared/ui/confirm-context';
import { Badge, Card, EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Select } from '@/shared/ui/form';
import { PageHeader, SearchInput } from '@/shared/ui/layout';
import { NutriScoreBadge } from '@/shared/ui/nutri-score';
import { Pagination } from '@/shared/ui/pagination';
import { Table, Td, Th, Tr } from '@/shared/ui/table';
import { PAGE_SIZE, useAdminRecipes, useDeleteRecipe, useUpdateRecipeFlags, type RecipeFilters } from './api';

export function Component() {
  // Filters live in the URL so they survive navigation and can be shared.
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const debouncedSearch = useDebouncedValue(search);
  const filters: RecipeFilters = {
    search: debouncedSearch,
    category: params.get('category') ?? '',
    status: (params.get('status') as RecipeFilters['status']) ?? 'all',
    page: Number(params.get('page') ?? 0),
  };

  const setFilter = (key: string, value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== 'page') next.delete('page');
        return next;
      },
      { replace: true },
    );

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useAdminRecipes(filters);
  const flags = useUpdateRecipeFlags();
  const remove = useDeleteRecipe();
  const confirm = useConfirm();

  const onDelete = async (id: string, title: string) => {
    if (
      await confirm({
        title: `Supprimer « ${title} » ?`,
        description: 'La recette et ses ingrédients seront supprimés.',
      })
    ) {
      remove.mutate(id);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Recettes"
        description={data ? `${data.total} recette${data.total > 1 ? 's' : ''}` : undefined}
        actions={
          <Button asChild>
            <Link to="/admin/recipes/new">
              <Plus />
              Nouvelle recette
            </Link>
          </Button>
        }
      />

      <Card className="flex flex-col gap-3 p-4 md:flex-row">
        <SearchInput
          className="flex-1"
          placeholder="Rechercher une recette…"
          aria-label="Rechercher une recette"
          value={search}
          onChange={(e) => setFilter('q', e.target.value)}
        />
        <Select
          className="md:w-56"
          aria-label="Catégorie"
          value={filters.category}
          onChange={(e) => setFilter('category', e.target.value)}
        >
          <option value="">Toutes catégories</option>
          {RECIPE_CATEGORIES.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </Select>
        <Select
          className="md:w-44"
          aria-label="Statut"
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value === 'all' ? '' : e.target.value)}
        >
          <option value="all">Tous statuts</option>
          <option value="published">Publiées</option>
          <option value="draft">Brouillons</option>
        </Select>
      </Card>

      {isPending ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : data.rows.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="Aucune recette"
          description="Créez votre première recette ou générez-en une avec l'IA Studio."
          action={
            <Button asChild variant="subtle">
              <Link to="/admin/ai-studio">Ouvrir l'IA Studio</Link>
            </Button>
          }
        />
      ) : (
        <>
          <Table className={cn(isPlaceholderData && 'opacity-60')}>
            <thead>
              <tr>
                <Th>Recette</Th>
                <Th className="hidden md:table-cell">Catégorie</Th>
                <Th className="hidden lg:table-cell">Temps</Th>
                <Th className="hidden lg:table-cell">Calories</Th>
                <Th>Nutri</Th>
                <Th>Statut</Th>
                <Th className="text-right">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((recipe) => (
                <Tr key={recipe.id}>
                  <Td>
                    <Link to={`/admin/recipes/${recipe.id}`} className="flex items-center gap-3 hover:text-primary-700">
                      {recipe.image_url ? (
                        <img
                          src={imageUrl(recipe.image_url, 96)}
                          alt=""
                          className="size-12 rounded-lg object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="flex size-12 items-center justify-center rounded-lg bg-neutral-100">
                          <ChefHat className="size-5 text-neutral-400" aria-hidden />
                        </span>
                      )}
                      <span>
                        <span className="block font-medium text-neutral-900">{recipe.title}</span>
                        <span className="text-xs text-neutral-500">{recipe.servings} portions</span>
                      </span>
                    </Link>
                  </Td>
                  <Td className="hidden md:table-cell">
                    <Badge tone="primary">{recipe.category}</Badge>
                  </Td>
                  <Td className="hidden text-neutral-600 lg:table-cell">
                    {formatDuration(recipe.prep_time + recipe.cook_time)}
                  </Td>
                  <Td className="hidden text-neutral-600 lg:table-cell">
                    {Math.round(recipe.calories_per_serving)} kcal
                  </Td>
                  <Td>
                    <NutriScoreBadge grade={recipe.nutri_score} />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      {recipe.is_published ? <Badge tone="success">Publiée</Badge> : <Badge>Brouillon</Badge>}
                      {recipe.is_featured && (
                        <Star className="size-4 fill-accent-400 text-accent-400" aria-label="En vedette" />
                      )}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={recipe.is_featured ? 'Retirer de la vedette' : 'Mettre en vedette'}
                        onClick={() => flags.mutate({ id: recipe.id, is_featured: !recipe.is_featured })}
                      >
                        <Star className={cn(recipe.is_featured && 'fill-accent-400 text-accent-400')} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={recipe.is_published ? 'Dépublier' : 'Publier'}
                        onClick={() => flags.mutate({ id: recipe.id, is_published: !recipe.is_published })}
                      >
                        {recipe.is_published ? <EyeOff /> : <Eye />}
                      </Button>
                      <Button asChild variant="ghost" size="icon-sm" aria-label="Modifier">
                        <Link to={`/admin/recipes/${recipe.id}/edit`}>
                          <Pencil />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-error-500 hover:bg-error-50"
                        aria-label="Supprimer"
                        onClick={() => void onDelete(recipe.id, recipe.title)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          <Pagination
            page={filters.page ?? 0}
            pageSize={PAGE_SIZE}
            total={data.total}
            onPageChange={(page) => setFilter('page', page ? String(page) : '')}
          />
        </>
      )}
    </div>
  );
}
