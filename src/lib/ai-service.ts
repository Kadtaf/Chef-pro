// AI Generation Service - Mock implementation (can be replaced with real AI API)
import { generateId, slugify, calculateNutriScore, getSeasonFromDate } from './utils';

export interface GeneratedRecipe {
  title: string;
  slug: string;
  description: string;
  category: string;
  season: string;
  difficulty: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
    cost: number;
    allergens: string[];
    calories: number;
    lipides: number;
    glucides: number;
    proteines: number;
    fibres: number;
    sel: number;
  }[];
  steps: {
    step_number: number;
    instruction: string;
  }[];
  calories_per_serving: number;
  lipides: number;
  glucides: number;
  proteines: number;
  fibres: number;
  sel: number;
  nutri_score: 'A' | 'B' | 'C' | 'D' | 'E';
  cost_per_serving: number;
  plating: string;
}

export interface GeneratedMenu {
  title: string;
  slug: string;
  description: string;
  season: string;
  items: {
    item_type: string;
    title: string;
    description: string;
    recipe?: GeneratedRecipe;
  }[];
  total_calories: number;
  is_balanced: boolean;
}

export interface GeneratedTechnicalSheet {
  title: string;
  slug: string;
  category: string;
  description: string;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
    cost: number;
    allergens: string[];
    calories: number;
    lipides: number;
    glucides: number;
    proteines: number;
  }[];
  steps: {
    step_number: number;
    instruction: string;
  }[];
  total_cost: number;
  selling_price: number;
  margin_ratio: number;
  portions: number;
  cost_per_portion: number;
  allergens: string[];
  calories_per_portion: number;
  lipides: number;
  glucides: number;
  proteines: number;
  fibres: number;
  sel: number;
  nutri_score: 'A' | 'B' | 'C' | 'D' | 'E';
  preparation_time: number;
  cooking_time: number;
}

// Nutritional database (simplified)
const INGREDIENT_DATABASE: Record<string, {
  calories: number;
  lipides: number;
  glucides: number;
  proteines: number;
  fibres: number;
  sel: number;
  cost: number;
  allergens: string[];
}> = {
  'beurre': { calories: 717, lipides: 81, glucides: 0.5, proteines: 0.9, fibres: 0, sel: 0.01, cost: 0.02, allergens: ['Lait'] },
  'crème fraîche': { calories: 340, lipides: 36, glucides: 2.5, proteines: 2, fibres: 0, sel: 0.04, cost: 0.03, allergens: ['Lait'] },
  'œuf': { calories: 155, lipides: 11, glucides: 1.1, proteines: 13, fibres: 0, sel: 0.13, cost: 0.003, allergens: ['Oeufs'] },
  'farine': { calories: 364, lipides: 1, glucides: 76, proteines: 10, fibres: 2.7, sel: 0.01, cost: 0.002, allergens: ['Gluten'] },
  'sucre': { calories: 387, lipides: 0, glucides: 100, proteines: 0, fibres: 0, sel: 0, cost: 0.002, allergens: [] },
  'sel': { calories: 0, lipides: 0, glucides: 0, proteines: 0, fibres: 0, sel: 0, cost: 0.001, allergens: [] },
  'poivre': { calories: 255, lipides: 3, glucides: 64, proteines: 10, fibres: 25, sel: 0.04, cost: 0.05, allergens: [] },
  'huile d\'olive': { calories: 884, lipides: 100, glucides: 0, proteines: 0, fibres: 0, sel: 0, cost: 0.01, allergens: [] },
  'ail': { calories: 149, lipides: 0.5, glucides: 33, proteines: 6, fibres: 2.1, sel: 0.02, cost: 0.01, allergens: [] },
  'oignon': { calories: 40, lipides: 0.1, glucides: 9, proteines: 1.1, fibres: 1.7, sel: 0.004, cost: 0.001, allergens: [] },
  'tomate': { calories: 18, lipides: 0.2, glucides: 4, proteines: 0.9, fibres: 1.2, sel: 0.005, cost: 0.003, allergens: [] },
  'pomme de terre': { calories: 77, lipides: 0.1, glucides: 17, proteines: 2, fibres: 2.2, sel: 0.006, cost: 0.001, allergens: [] },
  'carotte': { calories: 41, lipides: 0.2, glucides: 10, proteines: 0.9, fibres: 2.8, sel: 0.07, cost: 0.001, allergens: [] },
  'poireau': { calories: 61, lipides: 0.3, glucides: 14, proteines: 1.5, fibres: 1.8, sel: 0.02, cost: 0.002, allergens: [] },
  'céleri': { calories: 16, lipides: 0.2, glucides: 3, proteines: 0.7, fibres: 1.6, sel: 0.08, cost: 0.003, allergens: ['Céleri'] },
  'champignon': { calories: 22, lipides: 0.3, glucides: 3, proteines: 3, fibres: 1, sel: 0.005, cost: 0.008, allergens: [] },
  'bœuf': { calories: 250, lipides: 15, glucides: 0, proteines: 26, fibres: 0, sel: 0.06, cost: 0.02, allergens: [] },
  'porc': { calories: 242, lipides: 14, glucides: 0, proteines: 27, fibres: 0, sel: 0.05, cost: 0.015, allergens: [] },
  'poulet': { calories: 165, lipides: 3.6, glucides: 0, proteines: 31, fibres: 0, sel: 0.07, cost: 0.012, allergens: [] },
  'poisson': { calories: 114, lipides: 3.6, glucides: 0, proteines: 20, fibres: 0, sel: 0.06, cost: 0.025, allergens: ['Poisson'] },
  'saumon': { calories: 208, lipides: 13, glucides: 0, proteines: 20, fibres: 0, sel: 0.06, cost: 0.04, allergens: ['Poisson'] },
  'crevette': { calories: 99, lipides: 0.3, glucides: 0.2, proteines: 24, fibres: 0, sel: 0.15, cost: 0.035, allergens: ['Crustacés'] },
  'lait': { calories: 42, lipides: 1, glucides: 5, proteines: 3.4, fibres: 0, sel: 0.04, cost: 0.001, allergens: ['Lait'] },
  'fromage': { calories: 402, lipides: 33, glucides: 1.3, proteines: 25, fibres: 0, sel: 0.67, cost: 0.015, allergens: ['Lait'] },
  'parmesan': { calories: 431, lipides: 29, glucides: 0, proteines: 38, fibres: 0, sel: 1.1, cost: 0.025, allergens: ['Lait'] },
  'vin blanc': { calories: 82, lipides: 0, glucides: 2.6, proteines: 0.1, fibres: 0, sel: 0.004, cost: 0.005, allergens: ['Sulfites'] },
  'vin rouge': { calories: 85, lipides: 0, glucides: 2.6, proteines: 0.1, fibres: 0, sel: 0.004, cost: 0.005, allergens: ['Sulfites'] },
  'bouillon': { calories: 15, lipides: 0.5, glucides: 0.5, proteines: 2, fibres: 0, sel: 0.2, cost: 0.008, allergens: [] },
  'herbes de provence': { calories: 256, lipides: 6, glucides: 43, proteines: 8, fibres: 20, sel: 0.05, cost: 0.03, allergens: [] },
  'persil': { calories: 36, lipides: 0.8, glucides: 6, proteines: 3, fibres: 3.3, sel: 0.02, cost: 0.015, allergens: [] },
  'thym': { calories: 101, lipides: 1.7, glucides: 24, proteines: 5.6, fibres: 14, sel: 0.009, cost: 0.02, allergens: [] },
  'romarin': { calories: 131, lipides: 5.9, glucides: 21, proteines: 3.3, fibres: 14, sel: 0.04, cost: 0.02, allergens: [] },
  'laurier': { calories: 313, lipides: 8, glucides: 75, proteines: 8, fibres: 26, sel: 0.06, cost: 0.01, allergens: [] },
  'citron': { calories: 29, lipides: 0.3, glucides: 9, proteines: 1.1, fibres: 2.8, sel: 0.002, cost: 0.005, allergens: [] },
  'orange': { calories: 47, lipides: 0.1, glucides: 12, proteines: 0.9, fibres: 2.4, sel: 0.002, cost: 0.005, allergens: [] },
  'chocolat noir': { calories: 546, lipides: 31, glucides: 60, proteines: 5, fibres: 7, sel: 0.02, cost: 0.03, allergens: [] },
  'vanille': { calories: 288, lipides: 0.1, glucides: 66, proteines: 0.1, fibres: 0, sel: 0.01, cost: 0.1, allergens: [] },
  'miel': { calories: 304, lipides: 0, glucides: 82, proteines: 0.3, fibres: 0, sel: 0.04, cost: 0.02, allergens: [] },
  'moutarde': { calories: 66, lipides: 3.3, glucides: 7, proteines: 4, fibres: 3, sel: 3.5, cost: 0.008, allergens: ['Moutarde'] },
};

function getIngredientInfo(name: string) {
  const normalizedName = name.toLowerCase()
    .replace(/s$/, '')
    .replace(/ fraîche$/, '')
    .replace(/ frais$/, '')
    .replace(/es$/, '');

  for (const [key, value] of Object.entries(INGREDIENT_DATABASE)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return value;
    }
  }

  return {
    calories: 100,
    lipides: 5,
    glucides: 10,
    proteines: 5,
    fibres: 2,
    sel: 0.5,
    cost: 0.01,
    allergens: []
  };
}

export function generateRecipe(prompt: string, category: string = 'Plat principal'): GeneratedRecipe {
  const season = getSeasonFromDate();

  const recipeTemplates: GeneratedRecipe[] = [
    {
      title: 'Filet de Saumon Poêlé aux Herbes',
      slug: slugify('Filet de Saumon Poêlé aux Herbes'),
      description: 'Un filet de saumon frais poêlé avec des herbes aromatiques, accompagné de légumes de saison.',
      category,
      season,
      difficulty: 'moyen',
      prep_time: 15,
      cook_time: 12,
      servings: 4,
      ingredients: [
        { name: 'saumon', quantity: 600, unit: 'g', cost: 24, allergens: ['Poisson'], calories: 1248, ...getIngredientInfo('saumon') },
        { name: 'huile d\'olive', quantity: 30, unit: 'ml', cost: 0.3, allergens: [], ...getIngredientInfo('huile d\'olive') },
        { name: 'thym', quantity: 5, unit: 'g', cost: 0.1, allergens: [], ...getIngredientInfo('thym') },
        { name: 'romarin', quantity: 5, unit: 'g', cost: 0.1, allergens: [], ...getIngredientInfo('romarin') },
        { name: 'citron', quantity: 1, unit: 'pièce', cost: 0.1, allergens: [], ...getIngredientInfo('citron') },
        { name: 'poivre', quantity: 2, unit: 'g', cost: 0.1, allergens: [], ...getIngredientInfo('poivre') },
        { name: 'sel', quantity: 4, unit: 'g', cost: 0.01, allergens: [], ...getIngredientInfo('sel') },
      ],
      steps: [
        { step_number: 1, instruction: 'Peler et émincer l\'ail et le citron.' },
        { step_number: 2, instruction: 'Chauffer l\'huile d\'olive dans une poêle.' },
        { step_number: 3, instruction: 'Saler et poivrer les filets de saumon.' },
        { step_number: 4, instruction: 'Poêler le saumon côté peau pendant 4 minutes.' },
        { step_number: 5, instruction: 'Retourner et cuire 3 minutes de l\'autre côté.' },
        { step_number: 6, instruction: 'Ajouter le thym, romarin et ail en fin de cuisson.' },
        { step_number: 7, instruction: 'Servir avec un filet de citron.' },
      ],
      calories_per_serving: 340,
      lipides: 21,
      glucides: 2,
      proteines: 35,
      fibres: 1,
      sel: 0.8,
      nutri_score: 'A',
      cost_per_serving: 6.15,
      plating: 'Servir sur assiette chaude, peau croustillante vers le haut, avec des herbes fraîches.',
    },
    {
      title: 'Risotto aux Champignons Sauvages',
      slug: slugify('Risotto aux Champignons Sauvages'),
      description: 'Un crémeux risotto aux champignons de saison, parmesan et herbes fraîches.',
      category,
      season,
      difficulty: 'difficile',
      prep_time: 20,
      cook_time: 25,
      servings: 4,
      ingredients: [
        { name: 'riz arborio', quantity: 320, unit: 'g', cost: 3.2, allergens: [], calories: 400, lipides: 1, glucides: 86, proteines: 8, fibres: 1, sel: 0.02 },
        { name: 'champignon', quantity: 300, unit: 'g', cost: 2.4, allergens: [], ...getIngredientInfo('champignon') },
        { name: 'échalote', quantity: 80, unit: 'g', cost: 0.4, allergens: [], calories: 72, lipides: 0.2, glucides: 16, proteines: 2, fibres: 2, sel: 0.02 },
        { name: 'vin blanc', quantity: 100, unit: 'ml', cost: 0.5, allergens: ['Sulfites'], ...getIngredientInfo('vin blanc') },
        { name: 'bouillon', quantity: 800, unit: 'ml', cost: 6.4, allergens: [], ...getIngredientInfo('bouillon') },
        { name: 'parmesan', quantity: 80, unit: 'g', cost: 2, allergens: ['Lait'], ...getIngredientInfo('parmesan') },
        { name: 'beurre', quantity: 40, unit: 'g', cost: 0.8, allergens: ['Lait'], ...getIngredientInfo('beurre') },
        { name: 'huile d\'olive', quantity: 20, unit: 'ml', cost: 0.2, allergens: [], ...getIngredientInfo('huile d\'olive') },
        { name: 'persil', quantity: 15, unit: 'g', cost: 0.2, allergens: [], ...getIngredientInfo('persil') },
      ],
      steps: [
        { step_number: 1, instruction: 'Préparer le bouillon et le maintenir au chaud.' },
        { step_number: 2, instruction: 'Émincer les champignons et les échalotes.' },
        { step_number: 3, instruction: 'Faire revenir les champignons dans un peu de beurre, réserver.' },
        { step_number: 4, instruction: 'Faire suer les échalotes dans l\'huile d\'olive.' },
        { step_number: 5, instruction: 'Ajouter le riz et nacrer (rendre transparent).' },
        { step_number: 6, instruction: 'Déglacer au vin blanc.' },
        { step_number: 7, instruction: 'Mouiller progressivement avec le bouillon chaud, en remuant constamment.' },
        { step_number: 8, instruction: 'Cuire 18 minutes environ jusqu\'à l\'obtention d\'un riz al dente.' },
        { step_number: 9, instruction: 'Hors du feu, ajouter beurre, parmesan et champignons.' },
        { step_number: 10, instruction: 'Servir immédiatement avec persil frais.' },
      ],
      calories_per_serving: 450,
      lipides: 18,
      glucides: 55,
      proteines: 14,
      fibres: 3,
      sel: 1.2,
      nutri_score: 'B',
      cost_per_serving: 3.92,
      plating: 'Servir dans assiette creuse, finir avec copeaux de parmesan et huile de truffe.',
    },
    {
      title: 'Tarte Tatin aux Pommes',
      slug: slugify('Tarte Tatin aux Pommes'),
      description: 'La classique tarte renversée aux pommes caramélisées.',
      category: 'Dessert',
      season,
      difficulty: 'moyen',
      prep_time: 25,
      cook_time: 35,
      servings: 8,
      ingredients: [
        { name: 'pomme', quantity: 1000, unit: 'g', cost: 3, allergens: [], calories: 520, lipides: 0.5, glucides: 14, proteines: 1, fibres: 2.4, sel: 0.002 },
        { name: 'sucre', quantity: 150, unit: 'g', cost: 0.3, allergens: [], ...getIngredientInfo('sucre') },
        { name: 'beurre', quantity: 100, unit: 'g', cost: 2, allergens: ['Lait'], ...getIngredientInfo('beurre') },
        { name: 'pâte feuilletée', quantity: 1, unit: 'pièce', cost: 2, allergens: ['Gluten'], calories: 400, lipides: 28, glucides: 32, proteines: 6, fibres: 1, sel: 0.8 },
        { name: 'cannelle', quantity: 2, unit: 'g', cost: 0.1, allergens: [], calories: 5, lipides: 0.1, glucides: 1, proteines: 0.1, fibres: 0.5, sel: 0.001 },
        { name: 'vanille', quantity: 1, unit: 'gousse', cost: 1, allergens: [], ...getIngredientInfo('vanille') },
      ],
      steps: [
        { step_number: 1, instruction: 'Éplucher et couper les pommes en quartiers.' },
        { step_number: 2, instruction: 'Faire un caramel avec le sucre et 2 c.s. d\'eau.' },
        { step_number: 3, instruction: 'Ajouter le beurre dans le caramel.' },
        { step_number: 4, instruction: 'Disposer les pommes en rosace dans le moule.' },
        { step_number: 5, instruction: 'Saupoudrer de cannelle et gratter la vanille.' },
        { step_number: 6, instruction: 'Cuire les pommes 15 minutes sur feu moyen.' },
        { step_number: 7, instruction: 'Recouvrir avec la pâte feuilletée, rentrer les bords.' },
        { step_number: 8, instruction: 'Cuire au four 180°C pendant 25-30 minutes.' },
        { step_number: 9, instruction: 'Laisser reposer 5 minutes avant de démouler.' },
      ],
      calories_per_serving: 320,
      lipides: 15,
      glucides: 42,
      proteines: 2,
      fibres: 2,
      sel: 0.3,
      nutri_score: 'C',
      cost_per_serving: 1.05,
      plating: 'Servir tiède avec une boule de glace vanille ou crème fraîche.',
    },
  ];

  const randomRecipe = recipeTemplates[Math.floor(Math.random() * recipeTemplates.length)];
  randomRecipe.title = prompt || randomRecipe.title;
  randomRecipe.slug = slugify(randomRecipe.title);
  randomRecipe.category = category;

  return randomRecipe;
}

export function generateTechnicalSheet(prompt: string, category: string): GeneratedTechnicalSheet {
  const recipe = generateRecipe(prompt, category);

  return {
    title: recipe.title,
    slug: recipe.slug,
    category: recipe.category,
    description: recipe.description,
    ingredients: recipe.ingredients.map(ing => ({
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      cost: ing.cost,
      allergens: ing.allergens,
      calories: ing.calories,
      lipides: ing.lipides,
      glucides: ing.glucides,
      proteines: ing.proteines,
    })),
    steps: recipe.steps,
    total_cost: recipe.cost_per_serving * recipe.servings,
    selling_price: Math.round(recipe.cost_per_serving * recipe.servings * 3 * 100) / 100,
    margin_ratio: 3,
    portions: recipe.servings,
    cost_per_portion: recipe.cost_per_serving,
    allergens: [...new Set(recipe.ingredients.flatMap(i => i.allergens))],
    calories_per_portion: recipe.calories_per_serving,
    lipides: recipe.lipides,
    glucides: recipe.glucides,
    proteines: recipe.proteines,
    fibres: recipe.fibres,
    sel: recipe.sel,
    nutri_score: recipe.nutri_score,
    preparation_time: recipe.prep_time,
    cooking_time: recipe.cook_time,
  };
}

export function generateMenu(season: string, type: 'gastronomique' | 'business' | 'evenementiel' = 'gastronomique'): GeneratedMenu {
  const entree = generateRecipe('Entrée de saison', 'Entrée');
  const plat = generateRecipe('Plat principal gastronomique', 'Plat principal');
  const dessert = generateRecipe('Dessert raffiné', 'Dessert');

  return {
    title: `Menu ${type.charAt(0).toUpperCase() + type.slice(1)} ${season.charAt(0).toUpperCase() + season.slice(1)}`,
    slug: slugify(`Menu ${type} ${season}`),
    description: `Un menu ${type} avec les saveurs de ${season}`,
    season,
    items: [
      { item_type: 'entree', title: entree.title, description: entree.description, recipe: entree },
      { item_type: 'plat', title: plat.title, description: plat.description, recipe: plat },
      { item_type: 'dessert', title: dessert.title, description: dessert.description, recipe: dessert },
    ],
    total_calories: entree.calories_per_serving + plat.calories_per_serving + dessert.calories_per_serving,
    is_balanced: true,
  };
}

export function generateHACCPChecklist(type: string, zone: string) {
  const checklists: Record<string, string[]> = {
    cleaning: [
      'Nettoyage des plans de travail avec détergent alimentaire',
      'Désinfection des surfaces de découpe',
      'Lavage des sols avec détergent adapté',
      'Nettoyage des éviers et zones de lavage',
      'Vérification des filtres de hotte',
      'Nettoyage du frigo professionnel',
      'Nettoyage des zones de stockage',
      'Rangement des produits chimiques',
    ],
    temperature: [
      'Vérification température chambre froide négative (-18°C)',
      'Vérification température chambre froide positive (0-4°C)',
      'Contrôle température cuisson (75°C min)',
      'Contrôle température refroidissement rapide',
      'Enregistrement températures en chambre de refroidissement',
    ],
    delivery: [
      'Vérification intégrité des emballages',
      'Contrôle température à réception',
      'Vérification DLC/DDM',
      'Contrôle aspect et odeur des produits',
      'Vérification étiquetage allergènes',
      'Enregistrement du bon de livraison',
      'Mise en stock rapide (<30 min)',
    ],
  };

  return {
    title: `Checklist ${type} - ${zone}`,
    items: checklists[type] || checklists.cleaning,
    zone,
  };
}

export function optimizeMenu(menu: GeneratedMenu): { suggestions: string[]; costSavings: number } {
  return {
    suggestions: [
      'Remplacer les produits importés par des locaux pour réduire les coûts de 15%',
      'Utiliser les épluchures pour des bouillons maison',
      'Privilégier les légumes de saison pour une meilleure rentabilité',
      'Adapter les portions selon le ratio nutrition/calculé',
    ],
    costSavings: Math.round(menu.items.reduce((acc, item) => acc + (item.recipe?.cost_per_serving || 0), 0) * 0.15 * 100) / 100,
  };
}
