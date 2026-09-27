import { ArrowLeft, Printer } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { NotFoundContent } from '@/features/public-site/not-found';
import { Container } from '@/features/public-site/components/sections';
import { Button } from '@/shared/ui/button';
import { ErrorState, PageLoader } from '@/shared/ui/feedback';
import { EntityHero } from '@/shared/ui/entity-hero';
import { Seo } from '@/shared/ui/seo';
import { usePublishedRecipe, type RecipeWithChildren } from './api';
import { recipeAggregates } from './aggregates';
import { RecipeBadges, RecipeBody, RecipeMeta } from './recipe-view';

/** schema.org/Recipe structured data for rich results. */
function recipeJsonLd(recipe: RecipeWithChildren) {
  const { nutrition } = recipeAggregates(recipe);
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.description ?? undefined,
    image: recipe.image_url ? [recipe.image_url] : undefined,
    author: { '@type': 'Person', name: 'Chef Pro Bordeaux' },
    datePublished: recipe.created_at.slice(0, 10),
    recipeCategory: recipe.category,
    recipeCuisine: 'Française',
    prepTime: `PT${recipe.prep_time}M`,
    cookTime: `PT${recipe.cook_time}M`,
    totalTime: `PT${recipe.prep_time + recipe.cook_time}M`,
    recipeYield: `${recipe.servings} portions`,
    recipeIngredient: recipe.recipe_ingredients.map((i) => `${i.quantity} ${i.unit} ${i.name}`),
    recipeInstructions: recipe.recipe_steps.map((s) => ({ '@type': 'HowToStep', text: s.instruction })),
    nutrition: {
      '@type': 'NutritionInformation',
      calories: `${Math.round(nutrition.perPortion.calories)} kcal`,
      fatContent: `${nutrition.perPortion.lipides} g`,
      saturatedFatContent: `${nutrition.perPortion.acides_gras_satures} g`,
      carbohydrateContent: `${nutrition.perPortion.glucides} g`,
      sugarContent: `${nutrition.perPortion.sucres} g`,
      fiberContent: `${nutrition.perPortion.fibres} g`,
      proteinContent: `${nutrition.perPortion.proteines} g`,
      sodiumContent: `${Math.round((nutrition.perPortion.sel / 2.5) * 1000)} mg`,
    },
  };
}

export function Component() {
  const { slug } = useParams();
  const { data: recipe, isPending, isError, error, refetch } = usePublishedRecipe(slug);

  if (isPending) return <PageLoader />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!recipe)
    return <NotFoundContent title="Recette introuvable" backTo="/recettes" backLabel="Voir toutes les recettes" />;

  return (
    <article className="animate-fade-in">
      <Seo
        title={recipe.title}
        description={recipe.description ?? `Recette ${recipe.title} par Chef Pro Bordeaux.`}
        image={recipe.image_url}
        type="article"
        jsonLd={recipeJsonLd(recipe)}
      />

      <EntityHero
        className="rounded-none"
        image={recipe.image_url}
        title={recipe.title}
        description={recipe.description}
        badges={<RecipeBadges recipe={recipe} />}
        top={
          <Link
            to="/recettes"
            className="mb-4 inline-flex items-center gap-2 text-white/80 hover:text-white print:hidden"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Retour aux recettes
          </Link>
        }
      />

      <section className="sticky top-20 z-30 border-b border-neutral-200 bg-white py-4 print:static">
        <Container className="flex flex-wrap items-center justify-between gap-4">
          <RecipeMeta recipe={recipe} />
          <Button
            variant="outline"
            size="sm"
            className="hidden md:inline-flex print:hidden"
            onClick={() => window.print()}
          >
            <Printer />
            Imprimer
          </Button>
        </Container>
      </section>

      <section className="bg-neutral-50 py-12">
        <Container className="max-w-6xl">
          <RecipeBody recipe={recipe} />
        </Container>
      </section>
    </article>
  );
}
