import {
  ChefHat,
  Clock,
  CookingPot,
  Flame,
  Heart,
  Lightbulb,
  Printer,
  Share2,
  Shuffle,
  Star,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import { useToggleFavorite, useTrackView } from '@/features/engagement/api';
import { NutritionTable } from '@/features/culinary/nutrition-panel';
import { NewsletterSignup } from '@/features/newsletter/newsletter-signup';
import { Container } from '@/features/public-site/components/sections';
import { NotFoundContent } from '@/features/public-site/not-found';
import { DIFFICULTY_LABELS, SEASON_LABELS, labelOf } from '@/shared/domain/constants';
import { cn } from '@/shared/lib/cn';
import { formatDuration, formatNumber } from '@/shared/lib/format';
import { imageUrl } from '@/shared/lib/storage';
import { useFavorites } from '@/shared/lib/visitor';
import { Button } from '@/shared/ui/button';
import { RecipeTypeIcon, SeasonIcon, WineGlassIcon } from '@/shared/ui/culinary-icons';
import { ErrorState, PageLoader } from '@/shared/ui/feedback';
import { NutriScoreScale } from '@/shared/ui/nutri-score';
import { Reveal } from '@/shared/ui/reveal';
import { Seo } from '@/shared/ui/seo';
import { recipeAggregates } from './aggregates';
import { usePublishedRecipe, useRelatedRecipes, type RecipeWithChildren } from './api';
import { CookMode } from './components/cook-mode';
import { IngredientsPanel } from './components/ingredients-panel';
import { RatingWidget } from './components/rating-widget';
import { RecipeCard } from './recipe-card';
import { formatQuantity, scaleQuantity } from './scaling';

const FALLBACK = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1920';

function terms(recipe: RecipeWithChildren, kind: string) {
  return recipe.recipe_terms.flatMap((t) =>
    t.taxonomy_terms && t.taxonomy_terms.kind === kind ? [t.taxonomy_terms] : [],
  );
}

/** schema.org/Recipe structured data for Google rich results. */
function recipeJsonLd(recipe: RecipeWithChildren) {
  const { nutrition } = recipeAggregates(recipe);
  const types = terms(recipe, 'type');
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.description ?? undefined,
    image: recipe.image_url ? [recipe.image_url] : undefined,
    author: { '@type': 'Person', name: 'Chef Pro Bordeaux' },
    datePublished: (recipe.published_at ?? recipe.created_at).slice(0, 10),
    recipeCategory: types[0]?.name ?? recipe.category,
    recipeCuisine: 'Française',
    keywords: [...types, ...terms(recipe, 'technique')].map((t) => t.name).join(', ') || undefined,
    suitableForDiet: types.some((t) => t.slug === 'vegetarien') ? 'https://schema.org/VegetarianDiet' : undefined,
    prepTime: `PT${recipe.prep_time}M`,
    cookTime: `PT${recipe.cook_time}M`,
    totalTime: `PT${recipe.prep_time + recipe.cook_time}M`,
    recipeYield: `${recipe.servings} portions`,
    tool: recipe.equipment.length ? recipe.equipment : undefined,
    recipeIngredient: recipe.recipe_ingredients.map((i) => `${formatQuantity(Number(i.quantity))} ${i.unit} ${i.name}`),
    recipeInstructions: recipe.recipe_steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text: s.instruction,
    })),
    aggregateRating:
      recipe.rating_count > 0
        ? { '@type': 'AggregateRating', ratingValue: Number(recipe.rating_avg), ratingCount: recipe.rating_count }
        : undefined,
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

function Section({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Reveal as="section" className={className}>
      <h2 className="mb-5 flex items-center gap-3 text-3xl text-neutral-900">
        {icon}
        {title}
      </h2>
      {children}
    </Reveal>
  );
}

function RecipeArticle({ recipe }: { recipe: RecipeWithChildren }) {
  useTrackView(recipe.id);
  const [servings, setServings] = useState(recipe.servings);
  const [cooking, setCooking] = useState(false);
  const favorites = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const isFavorite = favorites.includes(recipe.id);
  const related = useRelatedRecipes(recipe.id, 3);
  const { nutrition, allergens } = recipeAggregates(recipe);
  const types = terms(recipe, 'type');
  const tags = [...terms(recipe, 'technique'), ...terms(recipe, 'cuisine'), ...terms(recipe, 'tag')];
  const factor = servings / Math.max(1, recipe.servings);
  const rating = Number(recipe.rating_avg);

  const share = async () => {
    const data = { title: recipe.title, text: recipe.description ?? recipe.title, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(data.url);
        toast.success('Lien copié');
      }
    } catch {
      /* share sheet dismissed */
    }
  };

  const meta = [
    { icon: Clock, label: 'Préparation', value: formatDuration(recipe.prep_time) },
    { icon: Flame, label: 'Cuisson', value: formatDuration(recipe.cook_time) },
    { icon: Users, label: 'Portions', value: String(recipe.servings) },
    { icon: ChefHat, label: 'Difficulté', value: labelOf(DIFFICULTY_LABELS, recipe.difficulty) },
  ];

  return (
    <article>
      <Seo
        title={recipe.title}
        description={recipe.description ?? `Recette « ${recipe.title} » par le Chef.`}
        image={recipe.image_url}
        type="article"
        jsonLd={recipeJsonLd(recipe)}
      />

      <header className="relative bg-neutral-950 text-cream-50">
        <div className="grid lg:grid-cols-2">
          <div className="relative aspect-4/3 lg:order-2 lg:aspect-auto lg:min-h-160">
            <img
              src={imageUrl(recipe.image_url, 1600) ?? FALLBACK}
              alt={recipe.title}
              className="absolute inset-0 size-full object-cover"
              fetchPriority="high"
            />
          </div>
          <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 lg:py-20">
            <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-neutral-400 print:hidden">
              <Link to="/recettes" className="hover:text-cream-50">
                Blog culinaire
              </Link>
              <span className="mx-2">/</span>
              <span className="text-neutral-300">{types[0]?.name ?? recipe.category}</span>
            </nav>
            <p className="eyebrow text-secondary-400">
              {recipe.season && recipe.season !== 'all' && (
                <>
                  <SeasonIcon season={recipe.season} className="size-4" />
                  {labelOf(SEASON_LABELS, recipe.season)} ·
                </>
              )}{' '}
              {types.map((t) => t.name).join(' · ') || recipe.category}
            </p>
            <h1 className="mb-6 text-5xl leading-[1.05] font-medium md:text-6xl">{recipe.title}</h1>
            {recipe.description && <p className="mb-8 max-w-xl text-lg text-neutral-300">{recipe.description}</p>}
            {rating > 0 && (
              <p className="mb-8 flex items-center gap-2 text-sm text-neutral-300">
                <span className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={cn(
                        'size-4',
                        i <= Math.round(rating) ? 'fill-secondary-400 text-secondary-400' : 'text-neutral-600',
                      )}
                      aria-hidden
                    />
                  ))}
                </span>
                {rating.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}/5 · {recipe.rating_count} note
                {recipe.rating_count > 1 ? 's' : ''}
              </p>
            )}
            <dl className="mb-10 grid grid-cols-2 gap-6 border-y border-white/10 py-6 sm:grid-cols-4">
              {meta.map(({ icon: Icon, label, value }) => (
                <div key={label}>
                  <dt className="mb-1 flex items-center gap-1.5 text-xs tracking-wider text-neutral-400 uppercase">
                    <Icon className="size-3.5 text-secondary-400" aria-hidden />
                    {label}
                  </dt>
                  <dd className="font-display text-2xl">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-3 print:hidden">
              <Button
                className="rounded-full bg-secondary-500 text-neutral-950 hover:bg-secondary-400"
                onClick={() => setCooking(true)}
              >
                <CookingPot />
                Mode cuisine
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-white/25 text-cream-50 hover:bg-white/10 hover:text-cream-50"
                aria-pressed={isFavorite}
                onClick={() => toggleFavorite(recipe.id, recipe.title)}
              >
                <Heart key={String(isFavorite)} className={cn(isFavorite && 'animate-heart fill-current')} />
                {isFavorite ? 'Dans mes favoris' : 'Ajouter aux favoris'}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-cream-50 hover:bg-white/10"
                aria-label="Partager"
                onClick={() => void share()}
              >
                <Share2 />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-cream-50 hover:bg-white/10"
                aria-label="Imprimer"
                onClick={() => window.print()}
              >
                <Printer />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <Container className="py-16 lg:py-24">
        {(types.length > 0 || tags.length > 0) && (
          <ul className="mb-14 flex flex-wrap gap-2" aria-label="Tags">
            {types.map((t) => (
              <li key={t.id}>
                <Link
                  to={`/recettes?type=${t.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-800 hover:bg-primary-100"
                >
                  <RecipeTypeIcon icon={t.icon ?? t.slug} className="size-3.5" />
                  {t.name}
                </Link>
              </li>
            ))}
            {tags.map((t) => (
              <li key={t.id} className="rounded-full border border-neutral-300 px-3 py-1 text-sm text-neutral-600">
                #{t.name}
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-14 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <IngredientsPanel
              ingredients={recipe.recipe_ingredients}
              baseServings={recipe.servings}
              servings={servings}
              onServingsChange={setServings}
              allergens={allergens}
              equipment={recipe.equipment}
            />
          </aside>

          <div className="space-y-16">
            <Section title="Préparation">
              <ol className="space-y-8">
                {recipe.recipe_steps.map((step, index) => (
                  <li key={step.id} className="grid grid-cols-[3rem_1fr] gap-4">
                    <span className="font-display text-5xl leading-none text-secondary-500">{index + 1}</span>
                    <div className="border-l border-neutral-200 pl-6">
                      <p className="text-lg leading-relaxed whitespace-pre-line text-neutral-700">{step.instruction}</p>
                      {step.image_url && (
                        <img
                          src={step.image_url}
                          alt={`Étape ${index + 1}`}
                          className="mt-4 max-h-72 rounded-xl object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </Section>

            {recipe.plating && (
              <Section title="Dressage">
                <p className="text-lg leading-relaxed whitespace-pre-line text-neutral-700">{recipe.plating}</p>
              </Section>
            )}

            {recipe.chef_tips && (
              <Reveal as="section" className="relative rounded-3xl bg-neutral-950 p-8 text-cream-50 md:p-10">
                <Lightbulb className="absolute top-8 right-8 size-8 text-secondary-400/60" aria-hidden />
                <p className="eyebrow text-secondary-400">Le secret du Chef</p>
                <h2 className="mb-5 text-3xl">Conseils du Chef</h2>
                <p className="text-lg leading-relaxed whitespace-pre-line text-neutral-300">{recipe.chef_tips}</p>
              </Reveal>
            )}

            {recipe.variations && (
              <Section title="Variantes" icon={<Shuffle className="size-6 text-secondary-500" aria-hidden />}>
                <p className="text-lg leading-relaxed whitespace-pre-line text-neutral-700">{recipe.variations}</p>
              </Section>
            )}

            {recipe.wine_pairing && (
              <Reveal as="section" className="rounded-3xl border border-primary-200 bg-primary-50/60 p-8 md:p-10">
                <div className="flex items-start gap-5">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-800 text-secondary-300">
                    <WineGlassIcon size={28} />
                  </span>
                  <div>
                    <p className="eyebrow">Accord mets-vins</p>
                    <p className="text-lg leading-relaxed whitespace-pre-line text-neutral-800">
                      {recipe.wine_pairing}
                    </p>
                    <p className="mt-4 text-xs text-neutral-500">
                      L&apos;abus d&apos;alcool est dangereux pour la santé, à consommer avec modération.
                    </p>
                  </div>
                </div>
              </Reveal>
            )}

            <Section title="Valeurs nutritionnelles">
              <div className="rounded-3xl border border-neutral-200 bg-white p-6 md:p-8">
                <div className="mb-6">
                  <NutriScoreScale grade={recipe.nutri_score} />
                </div>
                <NutritionTable perPortion={nutrition.perPortion} per100g={nutrition.per100g} />
                <p className="mt-4 text-xs text-neutral-500">
                  Valeurs estimées par portion à partir des ingrédients crus
                  {nutrition.portionWeightG ? ` (portion de ${formatNumber(nutrition.portionWeightG)} g)` : ''}.
                </p>
              </div>
            </Section>

            <div className="print:hidden">
              <RatingWidget
                recipeId={recipe.id}
                recipeSlug={recipe.slug}
                average={rating}
                count={recipe.rating_count}
              />
            </div>
          </div>
        </div>
      </Container>

      {related.data && related.data.length > 0 && (
        <section className="border-t border-neutral-200 bg-cream-100 py-20 print:hidden">
          <Container>
            <p className="eyebrow">À découvrir aussi</p>
            <h2 className="mb-12 text-4xl text-neutral-900">Recettes dans le même esprit</h2>
            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {related.data.map((r) => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>
          </Container>
        </section>
      )}

      <section className="bg-neutral-950 py-16 print:hidden">
        <Container className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="eyebrow text-secondary-400">Les inspirations du Chef</p>
            <h2 className="text-3xl text-cream-50 md:text-4xl">Vous avez aimé cette recette ?</h2>
          </div>
          <NewsletterSignup />
        </Container>
      </section>

      <CookMode
        open={cooking}
        onOpenChange={setCooking}
        title={recipe.title}
        steps={recipe.recipe_steps.map((s) => s.instruction)}
        ingredients={recipe.recipe_ingredients.map((i) => ({
          name: i.name,
          quantity: `${formatQuantity(scaleQuantity(Number(i.quantity), i.unit, factor))} ${i.unit}`,
        }))}
      />
    </article>
  );
}

export function Component() {
  const { slug } = useParams();
  const { data: recipe, isPending, isError, error, refetch } = usePublishedRecipe(slug);

  if (isPending) return <PageLoader />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!recipe)
    return <NotFoundContent title="Recette introuvable" backTo="/recettes" backLabel="Voir toutes les recettes" />;
  return <RecipeArticle key={recipe.id} recipe={recipe} />;
}
