/**
 * Rule-based detection of the 14 regulated allergens (EU regulation 1169/2011)
 * from ingredient names. Used as a safety net on top of AI output and manual
 * input: detected allergens are suggested, never silently removed.
 */
import { type ALLERGENS } from '@/shared/domain/constants';

type Allergen = (typeof ALLERGENS)[number];

const normalize = (text: string) => text.toLowerCase().replace(/œ/g, 'oe').normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Keywords matched on word starts in the normalised ingredient name. */
const RULES: Record<Allergen, string[]> = {
  Gluten: [
    'farine',
    'ble',
    'froment',
    'epeautre',
    'seigle',
    'orge',
    'avoine',
    'kamut',
    'pain',
    'brioche',
    'chapelure',
    'panko',
    'pate',
    'pates',
    'semoule',
    'boulgour',
    'couscous',
    'biscuit',
    'croissant',
    'feuilletage',
    'tortilla',
    'nouille',
    'ravioli',
    'gnocchi',
    'crouton',
    'coquillette',
    'spaghetti',
    'tagliatelle',
    'macaroni',
    'lasagne',
    'penne',
    'fusilli',
    'farfalle',
    'vermicelle',
    'biere',
    'sauce soja',
  ],
  Crustacés: ['crevette', 'gambas', 'langoustine', 'homard', 'langouste', 'crabe', 'tourteau', 'ecrevisse', 'etrille'],
  Oeufs: ['oeuf', 'jaune d', 'blanc d', 'mayonnaise', 'meringue', 'aioli', 'bearnaise', 'hollandaise'],
  Poisson: [
    'poisson',
    'saumon',
    'thon',
    'cabillaud',
    'bar',
    'loup',
    'dorade',
    'daurade',
    'sole',
    'turbot',
    'lotte',
    'merlu',
    'colin',
    'truite',
    'sardine',
    'maquereau',
    'anchois',
    'rouget',
    'maigre',
    'haddock',
    'eglefin',
    'fumet',
    'nuoc',
    'sauce poisson',
  ],
  Arachides: ['arachide', 'cacahuete', 'beurre de cacahuete'],
  Soja: ['soja', 'tofu', 'edamame', 'miso', 'tamari', 'lecithine de soja'],
  Lait: [
    'lait',
    'beurre',
    'creme',
    'fromage',
    'parmesan',
    'mozzarella',
    'comte',
    'emmental',
    'gruyere',
    'chevre',
    'feta',
    'ricotta',
    'mascarpone',
    'yaourt',
    'yogourt',
    'fromage blanc',
    'burrata',
    'roquefort',
    'reblochon',
    'camembert',
    'brie',
    'lactose',
    'petit-suisse',
    'ghee',
  ],
  'Fruits à coque': [
    'amande',
    'noisette',
    'noix',
    'pistache',
    'cajou',
    'pecan',
    'macadamia',
    'praline',
    'praliné',
    'frangipane',
    'nougat',
    'gianduja',
    'massepain',
    'pate d amande',
  ],
  Céleri: ['celeri', 'celeri-rave', 'celeri branche'],
  Moutarde: ['moutarde', 'graine de moutarde'],
  Sésame: ['sesame', 'tahini', 'tahin', 'gomasio'],
  Sulfites: [
    'vin',
    'vinaigre',
    'porto',
    'madere',
    'cognac',
    'armagnac',
    'cidre',
    'fruits secs',
    'abricot sec',
    'raisin sec',
    'champagne',
    'xeres',
  ],
  Lupin: ['lupin'],
  Mollusques: [
    'moule',
    'huitre',
    'saint-jacques',
    'saint jacques',
    'coquille(?!tt)',
    'calamar',
    'encornet',
    'seiche',
    'poulpe',
    'palourde',
    'coque',
    'bulot',
    'bigorneau',
    'escargot',
    'couteau de mer',
  ],
};

/** Misleading phrases rewritten before matching ("noix de coco" is not a tree nut). */
const REWRITES: [string, string][] = [
  ['noix de coco', 'coco'],
  ['noix de muscade', 'muscade'],
  ['noix de saint', 'saint'],
  ['noix de st', 'st'],
  ['noix de veau', 'veau'],
  ['noix de joue', 'joue'],
  ['beurre de cacao', 'cacao'],
  ['lait de coco', 'coco'],
  ['lait d amande', 'amande'],
  ['creme de coco', 'coco'],
  ['lait de soja', 'soja'],
  ['pate de fruits', 'fruits'],
  ['pate d amande', 'amande'],
];

/** Short keywords that must match a whole word ("ble" must not match "blette"). */
const WHOLE_WORDS = new Set(['bar', 'ble', 'orge', 'vin', 'coque', 'pain', 'lupin', 'sole', 'thon', 'loup']);

const compiled = (Object.entries(RULES) as [Allergen, string[]][]).map(([allergen, words]) => ({
  allergen,
  pattern: new RegExp(
    `(^|[^a-z])(${words
      .map((w) => {
        const word = normalize(w).replace(/[-\s]/g, '[-\\s]?');
        return WHOLE_WORDS.has(w) ? `${word}s?(?![a-z])` : word;
      })
      .join('|')})`,
  ),
}));

export function detectAllergens(ingredientName: string): Allergen[] {
  let text = ` ${normalize(ingredientName).replace(/[''’]/g, ' ')} `;
  for (const [phrase, replacement] of REWRITES) text = text.replaceAll(phrase, replacement);
  return compiled.filter(({ pattern }) => pattern.test(text)).map(({ allergen }) => allergen);
}

/** Merges detected allergens into the declared ones (never removes a declared allergen). */
export function withDetectedAllergens(ingredient: { name: string; allergens: string[] }): string[] {
  return [...new Set([...ingredient.allergens, ...detectAllergens(ingredient.name)])];
}
