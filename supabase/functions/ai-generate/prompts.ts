import type { AiGenerateRequest, AiGenerationType } from '../_shared/ai-schemas.ts';

const BASE = `Tu es un chef cuisinier professionnel expert en gastronomie française, nutrition, HACCP et gestion de restaurant.
Tu produis du contenu PROFESSIONNEL, RÉALISTE et directement exploitable en restauration en France.
Tu réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de texte autour).
Tous les champs du schéma sont obligatoires ; si une valeur est incertaine, donne une estimation réaliste.`;

const INGREDIENT_RULES = `Règles pour chaque ingrédient :
- "quantity" + "unit" : quantité TOTALE utilisée pour toute la recette (unités : g, kg, ml, cl, l, pièce).
- "cost" : coût d'achat en euros HT de cette quantité (prix grossiste France).
- Valeurs nutritionnelles pour CETTE quantité (pas pour 100 g) : "calories" (kcal), "lipides", "acides_gras_satures", "glucides", "sucres", "proteines", "fibres", "sel" (grammes).
- "allergens" : parmi Gluten, Crustacés, Oeufs, Poisson, Arachides, Soja, Lait, Fruits à coque, Céleri, Moutarde, Sésame, Sulfites, Lupin, Mollusques.`;

const INGREDIENT_SHAPE = `{ "name": "Filet de bar", "quantity": 600, "unit": "g", "cost": 14.4, "allergens": ["Poisson"], "calories": 582, "lipides": 12, "acides_gras_satures": 3, "glucides": 0, "sucres": 0, "proteines": 115, "fibres": 0, "sel": 0.5 }`;

const RECIPE_SHAPE = `{
  "title": "string",
  "description": "string (2 phrases appétissantes)",
  "category": "Entrée|Plat principal|Dessert|Accompagnement|Apéritif",
  "season": "printemps|ete|automne|hiver|all",
  "difficulty": "facile|moyen|difficile",
  "prep_time": 20,
  "cook_time": 30,
  "servings": 4,
  "portion_weight_g": 350,
  "fruits_legumes_pct": 40,
  "ingredients": [${INGREDIENT_SHAPE}],
  "steps": [{ "step_number": 1, "instruction": "Instruction précise avec temps et températures" }],
  "plating": "Description du dressage"
}`;

const SYSTEM: Record<AiGenerationType, string> = {
  recipe: `${BASE}
Génère une recette au format :
${RECIPE_SHAPE}
${INGREDIENT_RULES}
Contraintes : 6 à 12 ingrédients, 5 à 10 étapes, "portion_weight_g" = poids d'une portion servie, "fruits_legumes_pct" = part de fruits, légumes et légumineuses (0-100).`,

  technical_sheet: `${BASE}
Génère une fiche technique de production au format :
{
  "title": "string",
  "description": "string",
  "category": "Entrée|Plat principal|Dessert|Accompagnement",
  "portions": 10,
  "portion_weight_g": 300,
  "fruits_legumes_pct": 30,
  "preparation_time": 30,
  "cooking_time": 45,
  "selling_price": 24,
  "ingredients": [${INGREDIENT_SHAPE}],
  "steps": [{ "step_number": 1, "instruction": "Étape technique avec points critiques (températures, temps)" }]
}
${INGREDIENT_RULES}
Contraintes : 6 à 12 ingrédients, 4 à 10 étapes, "selling_price" = prix de vente TTC d'UNE portion, cohérent avec un coefficient multiplicateur de 3 à 4.`,

  menu: `${BASE}
Génère un menu au format :
{
  "title": "string",
  "description": "string",
  "season": "printemps|ete|automne|hiver",
  "price": 49,
  "items": [
    { "item_type": "entree|plat|dessert", "title": "string", "description": "string", "recipe": ${RECIPE_SHAPE} }
  ]
}
${INGREDIENT_RULES}
Contraintes : exactement 3 items (entree, plat, dessert), chacun avec une recette complète de 5 à 8 ingrédients et 3 à 6 étapes ; menu équilibré et de saison ; "price" = prix TTC du menu par personne.`,

  card: `${BASE}
Génère une carte de restaurant au format :
{
  "title": "string",
  "description": "string",
  "category": "restaurant|traiteur|evenement|saisonniere",
  "season": "printemps|ete|automne|hiver|all",
  "sections": [
    { "title": "Entrées", "description": "string", "items": [{ "title": "string", "description": "string", "price": 14.5, "is_suggestion": false }] }
  ]
}
Contraintes : 3 à 5 sections (Entrées, Plats, Desserts, éventuellement Suggestions/Boissons), 3 à 6 items par section, prix TTC réalistes.`,

  haccp: `${BASE}
Génère une checklist HACCP au format :
{
  "title": "string",
  "zone": "string",
  "items": [
    { "category": "Hygiène|Température|Traçabilité|Nettoyage|Stockage", "check": "Point de contrôle précis et mesurable", "frequency": "quotidien|hebdomadaire|mensuel|par service", "critical": true, "corrective_action": "Action corrective" }
  ]
}
Contraintes : 8 à 15 points de contrôle conformes au Paquet Hygiène (CE 852/2004) et au GBPH restauration.`,
};

export function systemPrompt(type: AiGenerationType): string {
  return SYSTEM[type];
}

export function userPrompt(req: AiGenerateRequest): string {
  switch (req.type) {
    case 'recipe':
      return req.prompt
        ? `Recette : « ${req.prompt} », catégorie « ${req.category ?? 'Plat principal'} ».`
        : `Recette gastronomique française originale, catégorie « ${req.category ?? 'Plat principal'} ».`;
    case 'technical_sheet':
      return req.prompt
        ? `Fiche technique : « ${req.prompt} », catégorie « ${req.category ?? 'Plat principal'} ».`
        : `Fiche technique gastronomique française, catégorie « ${req.category ?? 'Plat principal'} ».`;
    case 'menu':
      return `Menu ${req.style} pour la saison « ${req.season} ».`;
    case 'card':
      return `Carte ${req.category} pour la saison « ${req.season} ».`;
    case 'haccp':
      return `Checklist HACCP pour la zone « ${req.zone} ».`;
  }
}

export function describeRequest(req: AiGenerateRequest): string {
  return JSON.stringify(req);
}
