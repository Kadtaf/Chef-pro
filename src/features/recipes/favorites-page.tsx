import { Heart } from 'lucide-react';
import { Link } from 'react-router';
import { Container, PageHero } from '@/features/public-site/components/sections';
import { useFavorites } from '@/shared/lib/visitor';
import { Button } from '@/shared/ui/button';
import { EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Seo } from '@/shared/ui/seo';
import { useRecipesByIds } from './api';
import { RecipeCard } from './recipe-card';

/** Visitor favourites, stored in the browser only (no account needed). */
export function Component() {
  const favorites = useFavorites();
  const { data: recipes = [], isFetching, isError, error, refetch } = useRecipesByIds(favorites);

  return (
    <div className="animate-fade-in">
      <Seo title="Mes recettes favorites" noindex />
      <PageHero
        eyebrow="Mon carnet"
        title="Mes favoris"
        subtitle="Vos recettes préférées, enregistrées sur cet appareil. Aucun compte n'est nécessaire."
      />
      <section className="py-16">
        <Container>
          {favorites.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="Aucune recette favorite pour le moment"
              description="Touchez le cœur d'une recette pour la retrouver ici."
              action={
                <Button asChild>
                  <Link to="/recettes">Explorer le blog culinaire</Link>
                </Button>
              }
            />
          ) : isFetching && recipes.length === 0 ? (
            <PageLoader />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : (
            <>
              <p className="mb-8 text-sm text-neutral-500">
                {recipes.length} recette{recipes.length > 1 ? 's' : ''} enregistrée{recipes.length > 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {recipes.map((recipe) => (
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
