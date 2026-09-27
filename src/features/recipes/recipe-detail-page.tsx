import { Eye, EyeOff, Star } from 'lucide-react';
import { useParams } from 'react-router';
import { DetailActions } from '@/features/admin-shell/detail-actions';
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

      <div className="rounded-xl border border-neutral-100 bg-white px-6 py-4">
        <RecipeMeta recipe={recipe} />
      </div>

      <RecipeBody recipe={recipe} showCosts />
    </div>
  );
}
