import { Eye, EyeOff, Heart, Star } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { DetailActions } from '@/features/admin-shell/detail-actions';
import { formatNumber } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Badge, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { EntityHero, HeroBadge } from '@/shared/ui/entity-hero';
import { PageHeader } from '@/shared/ui/layout';
import { useDeleteRecipe, useRecipe, useUpdateRecipeFlags } from './api';
import { recipeToPdf } from './pdf';
import { RecipeBadges, RecipeBody, RecipeMeta } from './recipe-view';

export function Component() {
  const { id } = useParams();
  const { data: recipe, isPending, isError, error, refetch } = useRecipe(id);
  const flags = useUpdateRecipeFlags();
  const remove = useDeleteRecipe();

  if (isPending) return <PageLoader />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Recette"
        backTo="/admin/recipes"
        actions={
          <DetailActions
            editTo={`/admin/recipes/${recipe.id}/edit`}
            pdf={() => recipeToPdf(recipe)}
            pdfName={`recette-${recipe.slug}`}
            onDelete={() => remove.mutateAsync(recipe.id)}
            deleteLabel="cette recette"
            afterDeleteTo="/admin/recipes"
          >
            <Button
              variant="subtle"
              loading={flags.isPending}
              onClick={() => flags.mutate({ id: recipe.id, is_published: !recipe.is_published })}
            >
              {recipe.is_published ? <EyeOff /> : <Eye />}
              {recipe.is_published ? 'Dépublier' : 'Publier'}
            </Button>
          </DetailActions>
        }
      />

      <EntityHero
        image={recipe.image_url}
        title={recipe.title}
        titleAs="h2"
        description={recipe.description}
        badges={
          <RecipeBadges recipe={recipe}>
            {recipe.is_published ? <Badge tone="success">Publiée</Badge> : <HeroBadge>Brouillon</HeroBadge>}
            {recipe.is_featured && (
              <HeroBadge>
                <Star className="size-3.5 fill-white" aria-hidden /> Vedette
              </HeroBadge>
            )}
          </RecipeBadges>
        }
      />

      <div className="space-y-4 rounded-xl border border-neutral-100 bg-white px-6 py-4">
        <RecipeMeta recipe={recipe} />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-neutral-100 pt-4 text-sm text-neutral-600">
          <span className="flex items-center gap-1.5">
            <Eye className="size-4 text-neutral-400" aria-hidden />
            {formatNumber(recipe.views_count)} vues
          </span>
          <span className="flex items-center gap-1.5">
            <Heart className="size-4 text-neutral-400" aria-hidden />
            {formatNumber(recipe.likes_count)} favoris
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="size-4 text-neutral-400" aria-hidden />
            {recipe.rating_count
              ? `${formatNumber(recipe.rating_avg)} / 5 (${recipe.rating_count} avis)`
              : 'Pas encore noté'}
          </span>
          {recipe.is_published && (
            <Link to={`/recettes/${recipe.slug}`} className="text-primary-700 hover:underline">
              Voir sur le blog
            </Link>
          )}
        </div>
        {recipe.recipe_terms.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Classement dans le blog">
            {recipe.recipe_terms.map(
              ({ term_id, taxonomy_terms: term }) =>
                term && (
                  <li key={term_id} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-700">
                    {term.name}
                  </li>
                ),
            )}
          </ul>
        )}
      </div>

      <RecipeBody recipe={recipe} showCosts />
    </div>
  );
}
