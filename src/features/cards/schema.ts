import { z } from 'zod';
import type { AiCard } from '@ai-contract';
import { amount } from '@/features/culinary/schema';
import { CARD_CATEGORY_VALUES, SEASON_VALUES } from '@/shared/domain/constants';
import { slugify } from '@/shared/lib/format';
import type { CardPayload, CardWithSections } from './api';

export const cardItemSchema = z
  .object({
    recipe_id: z.string().nullable(),
    custom_title: z.string().trim().max(200),
    custom_description: z.string().trim().max(1000),
    price: amount(),
    is_suggestion: z.boolean(),
  })
  .refine((item) => item.recipe_id || item.custom_title, {
    path: ['custom_title'],
    message: 'Intitulé requis',
  });

export const cardSectionSchema = z.object({
  title: z.string().trim().min(1, 'Titre de section requis').max(120),
  description: z.string().trim().max(500),
  items: z.array(cardItemSchema),
});

export const cardFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, 'Titre requis').max(200),
  slug: z
    .string()
    .trim()
    .max(200)
    .regex(/^[a-z0-9-]*$/, 'Minuscules, chiffres et tirets uniquement'),
  description: z.string().trim().max(2000),
  category: z.enum(CARD_CATEGORY_VALUES),
  season: z.enum(SEASON_VALUES),
  image_url: z.union([z.url('URL invalide'), z.literal('')]),
  is_published: z.boolean(),
  is_balanced: z.boolean(),
  sections: z.array(cardSectionSchema),
});

export type CardFormInput = z.input<typeof cardFormSchema>;
export type CardFormValues = z.output<typeof cardFormSchema>;
export type CardItemValues = z.output<typeof cardItemSchema>;

export const emptyCardItem = (): CardItemValues => ({
  recipe_id: null,
  custom_title: '',
  custom_description: '',
  price: 0,
  is_suggestion: false,
});

export const emptyCard = (): CardFormValues => ({
  title: '',
  slug: '',
  description: '',
  category: 'restaurant',
  season: 'all',
  image_url: '',
  is_published: false,
  is_balanced: false,
  sections: ['Entrées', 'Plats', 'Desserts'].map((title) => ({ title, description: '', items: [] })),
});

export function cardToForm(card: CardWithSections): CardFormValues {
  return {
    id: card.id,
    title: card.title,
    slug: card.slug,
    description: card.description ?? '',
    category: card.category ?? 'restaurant',
    season: (SEASON_VALUES as readonly string[]).includes(card.season)
      ? (card.season as CardFormValues['season'])
      : 'all',
    image_url: card.image_url ?? '',
    is_published: card.is_published,
    is_balanced: card.is_balanced,
    sections: card.card_sections.map((section) => ({
      title: section.title,
      description: section.description ?? '',
      items: section.card_section_items.map((item) => ({
        recipe_id: item.recipe_id,
        custom_title: item.custom_title ?? '',
        custom_description: item.custom_description ?? '',
        price: Number(item.price),
        is_suggestion: item.is_suggestion,
      })),
    })),
  };
}

export function toCardPayload(values: CardFormValues): CardPayload {
  const { sections, id, slug, ...fields } = values;
  return {
    card: {
      ...(id ? { id } : {}),
      ...fields,
      slug: slug || slugify(values.title),
      description: fields.description || null,
      image_url: fields.image_url || null,
    },
    sections: sections.map((section) => ({
      title: section.title,
      description: section.description || null,
      items: section.items.map((item) => ({
        recipe_id: item.recipe_id,
        custom_title: item.custom_title || null,
        custom_description: item.custom_description || null,
        price: item.price,
        is_suggestion: item.is_suggestion,
      })),
    })),
  };
}

export function cardPayloadFromAi(ai: AiCard, imageUrl?: string | null): CardPayload {
  return toCardPayload({
    ...emptyCard(),
    title: ai.title,
    description: ai.description,
    category: ai.category,
    season: ai.season,
    image_url: imageUrl ?? '',
    sections: ai.sections.map((section) => ({
      title: section.title,
      description: section.description,
      items: section.items.map((item) => ({
        recipe_id: null,
        custom_title: item.title,
        custom_description: item.description,
        price: item.price,
        is_suggestion: item.is_suggestion,
      })),
    })),
  });
}
