import { ChefHat, Clock, Flame, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { AllergenList, NutritionTable } from '@/features/culinary/nutrition-panel';
import { DIFFICULTY_LABELS, SEASON_LABELS, labelOf } from '@/shared/domain/constants';
import { formatCurrency, formatDuration, formatNumber } from '@/shared/lib/format';
import { Card } from '@/shared/ui/feedback';
import { HeroBadge } from '@/shared/ui/entity-hero';
import { NutriScoreBadge, NutriScoreScale } from '@/shared/ui/nutri-score';
import { recipeAggregates } from './aggregates';
import type { RecipeWithChildren } from './api';

export function RecipeBadges({ recipe, children }: { recipe: RecipeWithChildren; children?: ReactNode }) {
  return (
    <>
      <HeroBadge>{recipe.category}</HeroBadge>
      {recipe.season && recipe.season !== 'all' && <HeroBadge>{labelOf(SEASON_LABELS, recipe.season)}</HeroBadge>}
      <NutriScoreBadge grade={recipe.nutri_score} />
      {children}
    </>
  );
}

export function RecipeMeta({ recipe }: { recipe: RecipeWithChildren }) {
  const items = [
    { icon: Clock, label: 'Préparation', value: formatDuration(recipe.prep_time) },
    { icon: Flame, label: 'Cuisson', value: formatDuration(recipe.cook_time) },
    { icon: Users, label: 'Portions', value: String(recipe.servings) },
    { icon: ChefHat, label: 'Difficulté', value: labelOf(DIFFICULTY_LABELS, recipe.difficulty) },
  ];
  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-neutral-600">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-2">
          <Icon className="size-5 text-primary-600" aria-hidden />
          <dt className="text-neutral-400">{label} :</dt>
          <dd className="font-medium text-neutral-800">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Ingredients, method, nutrition and plating — shared by the public and admin pages. */
export function RecipeBody({ recipe, showCosts = false }: { recipe: RecipeWithChildren; showCosts?: boolean }) {
  const { nutrition, allergens, totalCost, costPerPortion } = recipeAggregates(recipe);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card className="p-6 lg:sticky lg:top-28 print:static">
          <h2 className="mb-5 text-xl font-semibold text-neutral-900">Ingrédients</h2>
          {recipe.recipe_ingredients.length === 0 ? (
            <p className="text-sm text-neutral-500">Ingrédients non spécifiés.</p>
          ) : (
            <ul className="space-y-2.5">
              {recipe.recipe_ingredients.map((ingredient) => (
                <li key={ingredient.id} className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-neutral-700">{ingredient.name}</span>
                  <span className="shrink-0 text-neutral-500 tabular-nums">
                    {formatNumber(ingredient.quantity)} {ingredient.unit}
                    {showCosts && <span className="ml-2 text-neutral-400">{formatCurrency(ingredient.cost)}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {showCosts && (
            <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-5 text-sm">
              <div>
                <dt className="text-neutral-500">Coût total</dt>
                <dd className="font-semibold">{formatCurrency(totalCost)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Par portion</dt>
                <dd className="font-semibold text-primary-600">{formatCurrency(costPerPortion)}</dd>
              </div>
            </dl>
          )}

          <div className="mt-6 border-t border-neutral-100 pt-5">
            <h3 className="mb-2 font-sans text-sm font-medium text-neutral-700">Allergènes</h3>
            <AllergenList allergens={allergens} />
          </div>
        </Card>
      </div>

      <div className="space-y-8 lg:col-span-2">
        <Card className="p-6 sm:p-8">
          <h2 className="mb-6 text-xl font-semibold text-neutral-900">Préparation</h2>
          {recipe.recipe_steps.length === 0 ? (
            <p className="text-neutral-500">Instructions non spécifiées.</p>
          ) : (
            <ol className="space-y-6">
              {recipe.recipe_steps.map((step, index) => (
                <li key={step.id} className="flex gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700">
                    {index + 1}
                  </span>
                  <div className="flex-1 pt-1.5">
                    <p className="leading-relaxed whitespace-pre-line text-neutral-700">{step.instruction}</p>
                    {step.image_url && (
                      <img
                        src={step.image_url}
                        alt={`Étape ${index + 1}`}
                        className="mt-3 max-h-64 rounded-lg object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        {recipe.plating && (
          <Card className="p-6 sm:p-8">
            <h2 className="mb-4 text-xl font-semibold text-neutral-900">Dressage</h2>
            <p className="leading-relaxed whitespace-pre-line text-neutral-700">{recipe.plating}</p>
          </Card>
        )}

        <Card className="p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <h2 className="text-xl font-semibold text-neutral-900">Valeurs nutritionnelles</h2>
            <NutriScoreScale grade={recipe.nutri_score} />
          </div>
          <NutritionTable perPortion={nutrition.perPortion} per100g={nutrition.per100g} />
          <p className="mt-4 text-xs text-neutral-400">
            Valeurs estimées à partir des ingrédients crus
            {nutrition.portionWeightG ? `, portion de ${formatNumber(nutrition.portionWeightG)} g` : ''}.
          </p>
        </Card>
      </div>
    </div>
  );
}
