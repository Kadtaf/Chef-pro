/**
 * Contract between the AI edge function and the web app.
 *
 * Imported by Deno (edge functions, via the `zod` import-map entry) and by the
 * Vite app (via the `@ai-contract` alias), so both sides validate the exact
 * same shapes. Parsing is deliberately lenient on numbers (LLMs sometimes
 * return "12" or omit a value) but strict on structure: a response without a
 * title, ingredients or steps is rejected and the function retries.
 */
import { z } from 'zod';

import { CARD_CATEGORY_VALUES, DIFFICULTY_VALUES, MENU_ITEM_TYPE_VALUES, SEASON_VALUES } from './vocabulary.ts';

export * from './vocabulary.ts';

const amount = z.coerce.number().min(0).catch(0);
const optionalAmount = z.coerce.number().min(0).nullable().catch(null);
const text = z.string().trim().catch('');

const seasonSchema = z
  .string()
  .transform((s) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036F]/g, ''),
  )
  .pipe(z.enum(SEASON_VALUES))
  .catch('all');

const stepSchema = z.object({
  step_number: z.coerce.number().int().positive().optional(),
  instruction: z.string().trim().min(1),
});

export const aiIngredientSchema = z.object({
  name: z.string().trim().min(1),
  quantity: amount,
  unit: z.string().trim().min(1).catch('g'),
  cost: amount,
  allergens: z.array(z.string()).catch([]),
  calories: amount,
  lipides: amount,
  acides_gras_satures: amount,
  glucides: amount,
  sucres: amount,
  proteines: amount,
  fibres: amount,
  sel: amount,
});

export const aiRecipeSchema = z.object({
  title: z.string().trim().min(1),
  description: text,
  category: z.string().trim().min(1).catch('Plat principal'),
  season: seasonSchema,
  difficulty: z.enum(DIFFICULTY_VALUES).catch('moyen'),
  prep_time: z.coerce.number().int().min(0).catch(0),
  cook_time: z.coerce.number().int().min(0).catch(0),
  servings: z.coerce.number().int().positive().catch(4),
  portion_weight_g: optionalAmount,
  fruits_legumes_pct: z.coerce.number().min(0).max(100).catch(0),
  ingredients: z.array(aiIngredientSchema).min(1),
  steps: z.array(stepSchema).min(1),
  plating: text,
});

export const aiTechnicalSheetSchema = aiRecipeSchema
  .omit({ prep_time: true, cook_time: true, servings: true, difficulty: true, season: true, plating: true })
  .extend({
    portions: z.coerce.number().int().positive().catch(4),
    preparation_time: z.coerce.number().int().min(0).catch(0),
    cooking_time: z.coerce.number().int().min(0).catch(0),
    selling_price: amount,
  });

export const aiMenuSchema = z.object({
  title: z.string().trim().min(1),
  description: text,
  season: seasonSchema,
  price: amount,
  items: z
    .array(
      z.object({
        item_type: z.enum(MENU_ITEM_TYPE_VALUES).catch('plat'),
        title: z.string().trim().min(1),
        description: text,
        recipe: aiRecipeSchema,
      }),
    )
    .min(1),
});

export const aiCardSchema = z.object({
  title: z.string().trim().min(1),
  description: text,
  category: z.enum(CARD_CATEGORY_VALUES).catch('saisonniere'),
  season: seasonSchema,
  sections: z
    .array(
      z.object({
        title: z.string().trim().min(1),
        description: text,
        items: z
          .array(
            z.object({
              title: z.string().trim().min(1),
              description: text,
              price: amount,
              is_suggestion: z.boolean().catch(false),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

export const aiHaccpSchema = z.object({
  title: z.string().trim().min(1),
  zone: text,
  items: z
    .array(
      z.object({
        category: z.string().trim().min(1).catch('Général'),
        check: z.string().trim().min(1),
        frequency: z.string().trim().min(1).catch('quotidien'),
        critical: z.boolean().catch(false),
        corrective_action: text,
      }),
    )
    .min(1),
});

export const aiSchemas = {
  recipe: aiRecipeSchema,
  technical_sheet: aiTechnicalSheetSchema,
  menu: aiMenuSchema,
  card: aiCardSchema,
  haccp: aiHaccpSchema,
} as const;

export type AiGenerationType = keyof typeof aiSchemas;
export const AI_GENERATION_TYPES = Object.keys(aiSchemas) as AiGenerationType[];

export type AiRecipe = z.infer<typeof aiRecipeSchema>;
export type AiIngredient = z.infer<typeof aiIngredientSchema>;
export type AiTechnicalSheet = z.infer<typeof aiTechnicalSheetSchema>;
export type AiMenu = z.infer<typeof aiMenuSchema>;
export type AiCard = z.infer<typeof aiCardSchema>;
export type AiHaccp = z.infer<typeof aiHaccpSchema>;
export type AiResult<T extends AiGenerationType> = z.infer<(typeof aiSchemas)[T]>;

export const aiGenerateRequestSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('recipe'),
    prompt: z.string().trim().max(500).optional(),
    category: z.string().trim().max(60).optional(),
  }),
  z.object({
    type: z.literal('technical_sheet'),
    prompt: z.string().trim().max(500).optional(),
    category: z.string().trim().max(60).optional(),
  }),
  z.object({
    type: z.literal('menu'),
    season: z.enum(SEASON_VALUES),
    style: z.enum(['gastronomique', 'business', 'evenementiel']),
  }),
  z.object({
    type: z.literal('card'),
    season: z.enum(SEASON_VALUES),
    category: z.enum(CARD_CATEGORY_VALUES),
  }),
  z.object({
    type: z.literal('haccp'),
    zone: z.string().trim().min(1).max(120),
  }),
]);
export type AiGenerateRequest = z.infer<typeof aiGenerateRequestSchema>;

export const aiImageRequestSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  plating: z.string().trim().max(1000).optional(),
  category: z.string().trim().max(60).optional(),
  folder: z.enum(['recipes', 'technical-sheets', 'menus', 'cards']),
});
export type AiImageRequest = z.infer<typeof aiImageRequestSchema>;

export const publicSubmitSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('contact'),
    name: z.string().trim().min(1).max(120),
    email: z.email().max(254),
    phone: z.string().trim().max(40).optional(),
    subject: z.string().trim().max(200).optional(),
    message: z.string().trim().min(10).max(5000),
    website: z.string().max(0).optional(), // honeypot: must stay empty
    captchaToken: z.string().optional(),
  }),
  z.object({
    kind: z.literal('review'),
    author_name: z.string().trim().min(1).max(120),
    author_email: z.email().max(254).optional().or(z.literal('')),
    rating: z.coerce.number().int().min(1).max(5),
    content: z.string().trim().min(10).max(3000),
    website: z.string().max(0).optional(),
    captchaToken: z.string().optional(),
  }),
]);
export type PublicSubmitRequest = z.infer<typeof publicSubmitSchema>;
