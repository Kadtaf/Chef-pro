/**
 * Business vocabularies shared by the edge functions and the web app.
 * Kept free of dependencies so the public site can import them without
 * pulling a validation library into its initial bundle.
 */
export const SEASON_VALUES = ['printemps', 'ete', 'automne', 'hiver', 'all'] as const;
export const NUTRI_SCORE_VALUES = ['A', 'B', 'C', 'D', 'E'] as const;
export const CARD_CATEGORY_VALUES = ['restaurant', 'traiteur', 'evenement', 'saisonniere'] as const;
export const MENU_CATEGORY_VALUES = ['gastronomique', 'business', 'evenementiel', 'saisonnier', 'du_jour'] as const;
export const MENU_ITEM_TYPE_VALUES = ['entree', 'plat', 'dessert', 'accompagnement', 'boisson'] as const;
export const DIFFICULTY_VALUES = ['facile', 'moyen', 'difficile'] as const;

/** Recipe types seeded in `taxonomy_terms` (kind = 'type'); admins may add more. */
export const RECIPE_TYPE_SLUGS = [
  'entree',
  'plat',
  'salade',
  'amuse-bouche',
  'veloute',
  'potage',
  'soupe',
  'viande',
  'poisson',
  'vegetarien',
  'dessert',
  'patisserie',
  'brunch',
  'street-food',
] as const;

/** Cuisine styles seeded in `taxonomy_terms` (kind = 'cuisine'). */
export const CUISINE_STYLE_SLUGS = [
  'traditionnelle',
  'semi-gastronomique',
  'gastronomique',
  'bistronomique',
  'sud-ouest',
  'mediterraneenne',
  'du-monde',
] as const;

/** Visual moods offered for AI food photography (see ai-generate-image). */
export const IMAGE_AMBIANCES = ['editorial', 'bistrot', 'rustique', 'minimaliste', 'clair-obscur'] as const;
export const IMAGE_AMBIANCE_LABELS: Record<(typeof IMAGE_AMBIANCES)[number], string> = {
  editorial: 'Éditorial haut de gamme',
  bistrot: 'Bistrot chaleureux',
  rustique: 'Rustique, bois et lin',
  minimaliste: 'Minimaliste, fond clair',
  'clair-obscur': 'Clair-obscur, fond sombre',
};
export const IMAGE_ASPECT_RATIOS = ['16:9', '3:2', '4:5', '1:1'] as const;

export const ENGAGEMENT_EVENTS = ['view', 'like', 'unlike', 'rate'] as const;
