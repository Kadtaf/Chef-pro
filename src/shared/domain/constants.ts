/**
 * Business vocabularies — single source of truth for the UI.
 * Values mirror the CHECK constraints in `supabase/migrations`.
 */
import {
  CARD_CATEGORY_VALUES,
  DIFFICULTY_VALUES,
  MENU_CATEGORY_VALUES,
  MENU_ITEM_TYPE_VALUES,
  SEASON_VALUES,
} from '@ai-contract/vocabulary';

export { CARD_CATEGORY_VALUES, DIFFICULTY_VALUES, MENU_CATEGORY_VALUES, MENU_ITEM_TYPE_VALUES, SEASON_VALUES };

export type Season = (typeof SEASON_VALUES)[number];
export type Difficulty = (typeof DIFFICULTY_VALUES)[number];
export type CardCategory = (typeof CARD_CATEGORY_VALUES)[number];
export type MenuCategory = (typeof MENU_CATEGORY_VALUES)[number];
export type MenuItemType = (typeof MENU_ITEM_TYPE_VALUES)[number];

export const SEASON_LABELS: Record<Season, string> = {
  printemps: 'Printemps',
  ete: 'Été',
  automne: 'Automne',
  hiver: 'Hiver',
  all: 'Toutes saisons',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  facile: 'Facile',
  moyen: 'Moyen',
  difficile: 'Difficile',
};

export const RECIPE_CATEGORIES = [
  'Entrée',
  'Plat principal',
  'Dessert',
  'Accompagnement',
  'Apéritif',
  'Boisson',
  'Autre',
] as const;

export const CARD_CATEGORY_LABELS: Record<CardCategory, string> = {
  restaurant: 'Restaurant',
  traiteur: 'Traiteur',
  evenement: 'Événement',
  saisonniere: 'Saisonnière',
};

export const MENU_CATEGORY_LABELS: Record<MenuCategory, string> = {
  gastronomique: 'Gastronomique',
  business: 'Business',
  evenementiel: 'Événementiel',
  saisonnier: 'Saisonnier',
  du_jour: 'Du jour',
};

export const MENU_ITEM_TYPE_LABELS: Record<MenuItemType, string> = {
  entree: 'Entrée',
  plat: 'Plat',
  dessert: 'Dessert',
  accompagnement: 'Accompagnement',
  boisson: 'Boisson',
};

export const MISSION_TYPE_VALUES = ['chef', 'second', 'consulting', 'formation', 'evenementiel'] as const;
export type MissionType = (typeof MISSION_TYPE_VALUES)[number];
export const MISSION_TYPE_LABELS: Record<MissionType, string> = {
  chef: 'Chef de cuisine',
  second: 'Second de cuisine',
  consulting: 'Consulting',
  formation: 'Formation',
  evenementiel: 'Événementiel',
};

export const MISSION_STATUS_VALUES = ['en_attente', 'en_cours', 'terminee', 'annulee'] as const;
export type MissionStatus = (typeof MISSION_STATUS_VALUES)[number];
export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
};
export const MISSION_STATUS_TONES: Record<MissionStatus, BadgeTone> = {
  en_attente: 'warning',
  en_cours: 'primary',
  terminee: 'success',
  annulee: 'neutral',
};

export const HACCP_TYPE_VALUES = ['cleaning', 'temperature', 'delivery', 'traceability', 'checklist'] as const;
export type HaccpType = (typeof HACCP_TYPE_VALUES)[number];
export const HACCP_TYPE_LABELS: Record<HaccpType, string> = {
  cleaning: 'Nettoyage',
  temperature: 'Température',
  delivery: 'Réception',
  traceability: 'Traçabilité',
  checklist: 'Checklist',
};

export const HACCP_STATUS_VALUES = ['pending', 'completed', 'failed'] as const;
export type HaccpStatus = (typeof HACCP_STATUS_VALUES)[number];
export const HACCP_STATUS_LABELS: Record<HaccpStatus, string> = {
  pending: 'En attente',
  completed: 'Conforme',
  failed: 'Non conforme',
};
export const HACCP_STATUS_TONES: Record<HaccpStatus, BadgeTone> = {
  pending: 'warning',
  completed: 'success',
  failed: 'error',
};

export const ALLERGENS = [
  'Gluten',
  'Crustacés',
  'Oeufs',
  'Poisson',
  'Arachides',
  'Soja',
  'Lait',
  'Fruits à coque',
  'Céleri',
  'Moutarde',
  'Sésame',
  'Sulfites',
  'Lupin',
  'Mollusques',
] as const;

export const UNITS = ['g', 'kg', 'ml', 'cl', 'l', 'pièce', 'botte', 'c. à soupe', 'c. à café'] as const;

export const PAYMENT_METHODS = ['Virement', 'Carte', 'Chèque', 'Espèces', 'Autre'] as const;

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';

export function labelOf<T extends string>(labels: Record<T, string>, value: string | null | undefined): string {
  return value && value in labels ? labels[value as T] : (value ?? '—');
}
