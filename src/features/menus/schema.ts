import { z } from 'zod';
import type { AiMenu } from '@ai-contract';
import { amount } from '@/features/culinary/schema';
import { recipeFromAi, toRecipePayload } from '@/features/recipes/schema';
import { MENU_CATEGORY_VALUES, MENU_ITEM_TYPE_VALUES, SEASON_VALUES } from '@/shared/domain/constants';
import { slugify } from '@/shared/lib/format';
import { averageGrade } from '@/shared/lib/nutrition';
import type { MenuPayload, MenuWithItems } from './api';

export const menuItemSchema = z
  .object({
    item_type: z.enum(MENU_ITEM_TYPE_VALUES),
    recipe_id: z.string().nullable(),
    custom_title: z.string().trim().max(200),
    custom_description: z.string().trim().max(1000),
  })
  .refine((item) => item.recipe_id || item.custom_title, {
    path: ['custom_title'],
    message: 'Choisissez une recette ou saisissez un intitulé',
  });

export const menuFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, 'Titre requis').max(200),
  slug: z
    .string()
    .trim()
    .max(200)
    .regex(/^[a-z0-9-]*$/, 'Minuscules, chiffres et tirets uniquement'),
  description: z.string().trim().max(2000),
  category: z.enum(MENU_CATEGORY_VALUES),
  season: z.enum(SEASON_VALUES),
  price: amount(),
  image_url: z.union([z.url('URL invalide'), z.literal('')]),
  is_published: z.boolean(),
  is_balanced: z.boolean(),
  items: z.array(menuItemSchema),
});

export type MenuFormInput = z.input<typeof menuFormSchema>;
export type MenuFormValues = z.output<typeof menuFormSchema>;
export type MenuItemValues = z.output<typeof menuItemSchema>;

export const emptyMenu = (): MenuFormValues => ({
  title: '',
  slug: '',
  description: '',
  category: 'gastronomique',
  season: 'all',
  price: 0,
  image_url: '',
  is_published: false,
  is_balanced: false,
  items: [
    { item_type: 'entree', recipe_id: null, custom_title: '', custom_description: '' },
    { item_type: 'plat', recipe_id: null, custom_title: '', custom_description: '' },
    { item_type: 'dessert', recipe_id: null, custom_title: '', custom_description: '' },
  ],
});

export function menuToForm(menu: MenuWithItems): MenuFormValues {
  return {
    id: menu.id,
    title: menu.title,
    slug: menu.slug,
    description: menu.description ?? '',
    category: menu.category ?? 'gastronomique',
    season: (SEASON_VALUES as readonly string[]).includes(menu.season ?? '')
      ? (menu.season as MenuFormValues['season'])
      : 'all',
    price: Number(menu.price),
    image_url: menu.image_url ?? '',
    is_published: menu.is_published,
    is_balanced: menu.is_balanced,
    items: menu.menu_items.map((item) => ({
      item_type: item.item_type ?? 'plat',
      recipe_id: item.recipe_id,
      custom_title: item.custom_title ?? '',
      custom_description: item.custom_description ?? '',
    })),
  };
}

type RecipeStats = { id: string; calories_per_serving: number; nutri_score: string | null };

/** Totals derived from the linked recipes. */
export function menuAggregates(items: Pick<MenuItemValues, 'recipe_id'>[], recipes: RecipeStats[]) {
  const linked = items.map((item) => recipes.find((r) => r.id === item.recipe_id)).filter((r): r is RecipeStats => !!r);
  return {
    totalCalories: Math.round(linked.reduce((sum, r) => sum + Number(r.calories_per_serving), 0)),
    avgNutriScore: averageGrade(linked.map((r) => r.nutri_score)),
    linkedCount: linked.length,
  };
}

export function toMenuPayload(values: MenuFormValues, recipes: RecipeStats[]): MenuPayload {
  const { items, id, slug, ...fields } = values;
  const { totalCalories, avgNutriScore } = menuAggregates(items, recipes);
  return {
    menu: {
      ...(id ? { id } : {}),
      ...fields,
      slug: slug || slugify(values.title),
      description: fields.description || null,
      image_url: fields.image_url || null,
      total_calories: totalCalories,
      avg_nutri_score: avgNutriScore,
    },
    items: items.map((item) => ({
      item_type: item.item_type,
      recipe_id: item.recipe_id,
      custom_title: item.custom_title || null,
      custom_description: item.custom_description || null,
    })),
  };
}

/** AI menus create their three recipes inline, inside the same transaction. */
export function menuPayloadFromAi(
  ai: AiMenu,
  style: MenuFormValues['category'],
  imageUrl?: string | null,
): MenuPayload {
  const recipes = ai.items.map((item) => toRecipePayload({ ...recipeFromAi(item.recipe), is_published: false }));
  const stats = recipes.map((r, index) => ({
    id: String(index),
    calories_per_serving: Number(r.recipe.calories_per_serving),
    nutri_score: (r.recipe.nutri_score as string | null) ?? null,
  }));
  const aggregates = menuAggregates(
    stats.map((s) => ({ recipe_id: s.id })),
    stats,
  );
  return {
    menu: {
      title: ai.title,
      slug: slugify(ai.title),
      description: ai.description || null,
      category: style,
      season: ai.season,
      price: ai.price,
      image_url: imageUrl ?? null,
      is_published: false,
      is_balanced: aggregates.avgNutriScore === 'A' || aggregates.avgNutriScore === 'B',
      total_calories: aggregates.totalCalories,
      avg_nutri_score: aggregates.avgNutriScore,
    },
    items: ai.items.map((item, index) => ({
      item_type: item.item_type,
      custom_title: item.title,
      custom_description: item.description || null,
      recipe: recipes[index],
    })),
  };
}
