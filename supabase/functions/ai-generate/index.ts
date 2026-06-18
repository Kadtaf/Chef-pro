import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: {
    env: { get(key: string): string | undefined };
    serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type GenerationType = "recipe" | "technical_sheet" | "menu" | "haccp";

function buildSystemPrompt(type: GenerationType): string {
    const base = `Tu es un chef cuisinier professionnel expert en gastronomie française, nutrition, HACCP et gestion de restaurant.
Tu génères du contenu PROFESSIONNEL, RÉALISTE et directement exploitable.
Tu réponds UNIQUEMENT en JSON valide, sans markdown, sans texte autour, sans commentaires.
Aucun bloc de code, aucun préfixe, aucun suffixe.
Toutes les valeurs doivent être cohérentes entre elles.
Tous les champs demandés sont obligatoires et doivent toujours être présents.
Si une valeur est inconnue, fournis une valeur réaliste plutôt que d'omettre le champ.`;

    const prompts: Record<GenerationType, string> = {
        recipe: `${base}
Génère une recette complète au format JSON exact suivant :
{
  "title": "Nom créatif de la recette",
  "description": "Description appétissante",
  "category": "Entrée|Plat principal|Dessert|Amuse-bouche|Accompagnement",
  "season": "hiver|printemps|ete|automne",
  "difficulty": "facile|moyen|difficile",
  "prep_time": 20,
  "cook_time": 30,
  "servings": 4,
  "ingredients": [
    {
      "name": "nom ingrédient",
      "quantity": 100,
      "unit": "g|ml|pièce",
      "cost": 1.2,
      "allergens": ["gluten"],
      "calories": 120,
      "lipides": 4,
      "glucides": 10,
      "proteines": 8,
      "fibres": 2,
      "sel": 0.4
    }
  ],
  "steps": [
    { "step_number": 1, "instruction": "Instruction détaillée avec temps et température si utile" }
  ],
  "calories_per_serving": 350,
  "lipides": 12,
  "glucides": 28,
  "proteines": 22,
  "fibres": 4,
  "sel": 0.8,
  "nutri_score": "A|B|C|D|E",
  "cost_per_serving": 4.5,
  "plating": "Description du dressage professionnel"
}
Contraintes:
- 6 à 12 ingrédients.
- 5 à 10 étapes.
- Coûts réalistes pour la restauration en France.
- Nutrition cohérente avec les ingrédients.
- Retourne exactement un seul objet JSON valide.`,

        technical_sheet: `${base}
Génère une fiche technique professionnelle au format JSON exact suivant :
{
  "title": "Nom de la fiche technique",
  "description": "Description synthétique",
  "category": "Entrée|Plat principal|Dessert|Amuse-bouche|Accompagnement",
  "ingredients": [
    {
      "name": "nom ingrédient",
      "quantity": 100,
      "unit": "g|ml|pièce",
      "cost": 1.2,
      "allergens": ["gluten"],
      "calories": 120,
      "lipides": 4,
      "glucides": 10,
      "proteines": 8
    }
  ],
  "steps": [
    { "step_number": 1, "instruction": "Instruction détaillée" }
  ],
  "total_cost": 18,
  "selling_price": 54,
  "margin_ratio": 3,
  "portions": 4,
  "cost_per_portion": 4.5,
  "allergens": ["gluten"],
  "calories_per_portion": 360,
  "lipides": 12,
  "glucides": 28,
  "proteines": 22,
  "fibres": 4,
  "sel": 0.8,
  "nutri_score": "A|B|C|D|E",
  "preparation_time": 20,
  "cooking_time": 30
}
Contraintes:
- 6 à 12 ingrédients.
- 4 à 10 étapes.
- Coûts et marge réalistes.
- Les allergènes globaux doivent refléter les ingrédients.
- Retourne exactement un seul objet JSON valide.`,

        menu: `${base}
Génère un menu français complet et réaliste au format JSON exact suivant :
{
  "title": "Nom du menu",
  "description": "Description courte du menu",
  "season": "hiver|printemps|ete|automne",
  "items": [
    {
      "item_type": "entree|plat|dessert",
      "title": "Nom du plat",
      "description": "Description appétissante",
      "recipe": {
        "title": "Nom de la recette",
        "description": "Description",
        "category": "Entrée|Plat principal|Dessert",
        "season": "hiver|printemps|ete|automne",
        "difficulty": "facile|moyen|difficile",
        "prep_time": 20,
        "cook_time": 30,
        "servings": 4,
        "ingredients": [
          {
            "name": "nom ingrédient",
            "quantity": 100,
            "unit": "g|ml|pièce",
            "cost": 1.2,
            "allergens": ["gluten"],
            "calories": 120,
            "lipides": 4,
            "glucides": 10,
            "proteines": 8,
            "fibres": 2,
            "sel": 0.4
          }
        ],
        "steps": [
          { "step_number": 1, "instruction": "Instruction détaillée" }
        ],
        "calories_per_serving": 350,
        "lipides": 12,
        "glucides": 28,
        "proteines": 22,
        "fibres": 4,
        "sel": 0.8,
        "nutri_score": "A|B|C|D|E",
        "cost_per_serving": 4.5,
        "plating": "Dressage"
      }
    }
  ],
  "total_calories": 1200,
  "is_balanced": true
}
Contraintes:
- Exactement 3 items: un item_type "entree", un item_type "plat", un item_type "dessert".
- Chaque item doit contenir une recipe complète.
- Chaque recipe doit contenir 5 à 8 ingrédients maximum.
- Chaque recipe doit contenir 3 à 6 étapes maximum.
- Menu cohérent, gastronomique, de saison, adapté à la restauration en France.
- total_calories doit correspondre approximativement à la somme des recipes.
- is_balanced doit refléter l'équilibre nutritionnel réel.
- Aucun texte hors du JSON.
- Retourne exactement un seul objet JSON valide.`,

        haccp: `${base}
Génère une checklist HACCP professionnelle au format JSON exact suivant :
{
  "title": "Titre de la checklist",
  "zone": "cuisine|stockage|livraison|preparation|service",
  "items": [
    {
      "category": "Hygiène|Température|Traçabilité|Nettoyage|Stockage",
      "check": "Point de contrôle précis",
      "frequency": "quotidien|hebdomadaire|mensuel|par service",
      "critical": true,
      "corrective_action": "Action corrective claire"
    }
  ]
}
Contraintes:
- 8 à 15 points de contrôle.
- Niveau professionnel restauration.
- Conforme aux bonnes pratiques HACCP.
- Retourne exactement un seul objet JSON valide.`,
    };

    return prompts[type];
}

function buildUserPrompt(params: {
    type: GenerationType;
    prompt?: string;
    category?: string;
    season?: string;
    menu_type?: string;
}): string {
    const { type, prompt, category, season, menu_type } = params;

    if (type === "menu") {
        return `Génère un menu ${menu_type || "gastronomique"} pour la saison ${season || "en cours"}.
Le menu doit comprendre exactement 3 services: entrée, plat, dessert.
Cuisine française, produits réalistes, intitulés élégants, descriptions professionnelles.
Chaque service doit inclure une recipe complète conforme au schéma demandé.
Retourne uniquement le JSON demandé.`;
    }

    if (type === "haccp") {
        return `Génère une checklist HACCP professionnelle pour la zone "${prompt || "cuisine"}".
Retourne uniquement le JSON demandé.`;
    }

    if (type === "technical_sheet") {
        return prompt
            ? `Génère une fiche technique gastronomique pour "${prompt}" dans la catégorie "${category || "Plat principal"}". Retourne uniquement le JSON demandé.`
            : `Génère une fiche technique gastronomique française dans la catégorie "${category || "Plat principal"}". Retourne uniquement le JSON demandé.`;
    }

    return prompt
        ? `Génère une recette pour "${prompt}" dans la catégorie "${category || "Plat principal"}". Retourne uniquement le JSON demandé.`
        : `Génère une recette gastronomique française dans la catégorie "${category || "Plat principal"}". Retourne uniquement le JSON demandé.`;
}

function cleanJsonResponse(raw: string): string {
    return raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
}

function tryParseJson(raw: string): unknown {
    const cleaned = cleanJsonResponse(raw);
    return JSON.parse(cleaned);
}

async function callMistral(
    systemPrompt: string,
    userPrompt: string,
    apiKey: string,
    temperature = 0.4,
): Promise<string> {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "mistral-large-latest",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature,
            max_tokens: 6000,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "";
}

async function callMistralWithRetry(
    systemPrompt: string,
    userPrompt: string,
    apiKey: string,
): Promise<unknown> {
    const firstResponse = await callMistral(systemPrompt, userPrompt, apiKey, 0.4);

    try {
        return tryParseJson(firstResponse);
    } catch {
        console.error("AI RAW RESPONSE (attempt 1):", firstResponse);
    }

    const retrySystemPrompt = `${systemPrompt}\nIMPORTANT ABSOLU: retourne exactement un seul objet JSON valide, sans markdown, sans texte avant, sans texte après, sans backticks.`;
    const retryUserPrompt = `${userPrompt}\nRappel final: la réponse doit être un JSON strictement parseable par JSON.parse.`;

    const secondResponse = await callMistral(retrySystemPrompt, retryUserPrompt, apiKey, 0.2);

    try {
        return tryParseJson(secondResponse);
    } catch {
        console.error("AI RAW RESPONSE (attempt 2):", secondResponse);
        throw new Error("Réponse IA invalide: JSON non parseable");
    }
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { type, prompt, category, season, menu_type } = await req.json();
        const apiKey = Deno.env.get("MISTRAL_API_KEY");

        if (!apiKey) {
            return new Response(JSON.stringify({ error: "MISTRAL_API_KEY not configured" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (!["recipe", "technical_sheet", "menu", "haccp"].includes(type)) {
            return new Response(JSON.stringify({ error: "Invalid generation type" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const generationType = type as GenerationType;
        const systemPrompt = buildSystemPrompt(generationType);
        const userPrompt = buildUserPrompt({
            type: generationType,
            prompt,
            category,
            season,
            menu_type,
        });

        const parsed = await callMistralWithRetry(systemPrompt, userPrompt, apiKey);

        return new Response(JSON.stringify({ result: parsed }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
