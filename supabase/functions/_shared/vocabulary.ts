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
