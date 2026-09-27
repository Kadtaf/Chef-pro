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

import {
  CARD_CATEGORY_VALUES,
  CUISINE_STYLE_SLUGS,
  DIFFICULTY_VALUES,
  ENGAGEMENT_EVENTS,
  IMAGE_AMBIANCES,
  IMAGE_ASPECT_RATIOS,
  MENU_ITEM_TYPE_VALUES,
  RECIPE_TYPE_SLUGS,
  SEASON_VALUES,
} from './vocabulary.ts';

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
  equipment: z.array(z.string().trim().min(1)).catch([]),
  chef_tips: text,
  variations: text,
  wine_pairing: text,
  /** Recipe type slugs (unknown values are dropped rather than failing the generation). */
  types: z
    .array(z.string())
    .transform((values) =>
      values.filter((v): v is (typeof RECIPE_TYPE_SLUGS)[number] =>
        (RECIPE_TYPE_SLUGS as readonly string[]).includes(v),
      ),
    )
    .catch([]),
  techniques: z.array(z.string().trim().min(1)).catch([]),
  cuisine: z.enum(CUISINE_STYLE_SLUGS).nullable().catch(null),
  /** English description of what is visible on the plate, used to brief the photo model. */
  photo_brief: z
    .string()
    .trim()
    .transform((value) => value.slice(0, 600))
    .catch(''),
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

export const aiSuggestionsSchema = z.object({
  ideas: z
    .array(
      z.object({
        title: z.string().trim().min(1),
        pitch: text,
        type: z.enum(RECIPE_TYPE_SLUGS).catch('plat'),
        season: seasonSchema,
        cuisine: z.enum(CUISINE_STYLE_SLUGS).nullable().catch(null),
        key_ingredients: z.array(z.string()).catch([]),
      }),
    )
    .min(1),
});

export const aiArticleSchema = z.object({
  title: z.string().trim().min(1),
  excerpt: text,
  /** Rich text: "## " headings, "- " bullets, "1. " ordered steps, blank-line paragraphs. */
  body: z.string().trim().min(200),
  difficulty: z.enum(DIFFICULTY_VALUES).nullable().catch(null),
  reading_minutes: z.coerce.number().int().min(1).max(30).catch(3),
  tags: z.array(z.string().trim().min(1)).catch([]),
});

export const aiSchemas = {
  recipe: aiRecipeSchema,
  technical_sheet: aiTechnicalSheetSchema,
  menu: aiMenuSchema,
  card: aiCardSchema,
  haccp: aiHaccpSchema,
  suggestions: aiSuggestionsSchema,
  article: aiArticleSchema,
} as const;

export type AiGenerationType = keyof typeof aiSchemas;
export const AI_GENERATION_TYPES = Object.keys(aiSchemas) as AiGenerationType[];

export type AiRecipe = z.infer<typeof aiRecipeSchema>;
export type AiIngredient = z.infer<typeof aiIngredientSchema>;
export type AiTechnicalSheet = z.infer<typeof aiTechnicalSheetSchema>;
export type AiMenu = z.infer<typeof aiMenuSchema>;
export type AiCard = z.infer<typeof aiCardSchema>;
export type AiHaccp = z.infer<typeof aiHaccpSchema>;
export type AiSuggestions = z.infer<typeof aiSuggestionsSchema>;
export type AiArticle = z.infer<typeof aiArticleSchema>;
export type AiResult<T extends AiGenerationType> = z.infer<(typeof aiSchemas)[T]>;

export const aiGenerateRequestSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('recipe'),
    prompt: z.string().trim().max(500).optional(),
    category: z.string().trim().max(60).optional(),
    season: z.enum(SEASON_VALUES).optional(),
    cuisine: z.enum(CUISINE_STYLE_SLUGS).optional(),
    recipe_type: z.enum(RECIPE_TYPE_SLUGS).optional(),
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
  z.object({
    type: z.literal('article'),
    kind: z.enum(['technique', 'conseil']),
    topic: z.string().trim().min(3).max(200),
  }),
  z.object({
    type: z.literal('suggestions'),
    season: z.enum(SEASON_VALUES).optional(),
    cuisine: z.enum(CUISINE_STYLE_SLUGS).optional(),
    recipe_type: z.enum(RECIPE_TYPE_SLUGS).optional(),
    count: z.coerce.number().int().min(3).max(12).default(6),
  }),
]);
export type AiGenerateRequest = z.infer<typeof aiGenerateRequestSchema>;

export const aiImageRequestSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  plating: z.string().trim().max(1000).optional(),
  category: z.string().trim().max(60).optional(),
  /** Cuisine style (e.g. "bistronomique") to steer tableware and plating. */
  cuisine: z.string().trim().max(60).optional(),
  /** Main visible ingredients, so the photo shows this dish and nothing else. */
  ingredients: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
  /** Visual description in English written by the text model (see photo_brief). */
  brief: z.string().trim().max(600).optional(),
  ambiance: z.enum(IMAGE_AMBIANCES).optional(),
  aspect_ratio: z.enum(IMAGE_ASPECT_RATIOS).optional(),
  folder: z.enum(['recipes', 'technical-sheets', 'menus', 'cards', 'articles', 'career', 'seasons']),
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

/** Visitor engagement (no account): see the engage edge function. */
export const engageRequestSchema = z.object({
  recipe_id: z.uuid(),
  visitor_id: z.uuid(),
  event: z.enum(ENGAGEMENT_EVENTS),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});
export type EngageRequest = z.infer<typeof engageRequestSchema>;

/** Newsletter double opt-in (Brevo). */
export const newsletterRequestSchema = z.object({
  email: z.email().max(254),
  first_name: z.string().trim().max(80).optional(),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
  captchaToken: z.string().optional(),
});
export type NewsletterRequest = z.infer<typeof newsletterRequestSchema>;
