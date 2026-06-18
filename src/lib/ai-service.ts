import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';
import { slugify, calculateNutriScore, getSeasonFromDate } from './utils';

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
    image_url?: string;
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

export interface GeneratedMenuItem {
    item_type: string;
    title: string;
    description: string;
    recipe?: GeneratedRecipe;
}

export interface GeneratedMenu {
    title: string;
    slug: string;
    description: string;
    season: string;
    items: GeneratedMenuItem[];
    total_calories: number;
    is_balanced: boolean;
}

export interface GeneratedTechnicalSheet {
    title: string;
    slug: string;
    category: string;
    description: string;
    image_url?: string;
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

export interface GeneratedHACCP {
    title: string;
    zone: string;
    items: {
        category: string;
        check: string;
        frequency: string;
        critical: boolean;
        corrective_action: string;
    }[];
}

function getSupabaseUrl(): string {
    const url = import.meta.env.VITE_SUPABASE_URL;
    if (!url) throw new Error('VITE_SUPABASE_URL not configured');
    return url;
}

async function callFunction(payload: unknown) {
    const url = getSupabaseUrl();

    const response = await fetch(`${url}/functions/v1/ai-generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`AI API error: ${response.status} - ${err}`);
    }

    const { result } = await response.json();
    return result;
}
export async function generateDishImage(params: {
    title: string;
    description?: string;
    plating?: string;
    category?: string;
}) {
    const url = getSupabaseUrl();
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!anonKey) {
        throw new Error('VITE_SUPABASE_ANON_KEY not configured');
    }

    const response = await fetch(`${url}/functions/v1/ai-generate-image`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Image generation error: ${response.status} - ${err}`);
    }

    return response.json() as Promise<{
        imageBase64: string;
        mimeType: string;
        prompt: string;
    }>;
}

export async function uploadAiImageToStorage(params: {
    base64: string;
    bucket?: string;
    folder?: string;
    filenameBase: string;
    contentType?: string;
}) {
    const bucket = params.bucket || 'ai-images';
    const folder = params.folder || 'recipes';
    const contentType = params.contentType || 'image/png';
    const fileName = `${folder}/${slugify(params.filenameBase)}-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, decode(params.base64), {
            contentType,
            upsert: false,
        });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return {
        path: fileName,
        publicUrl: data.publicUrl,
    };
}

export async function generateAndUploadRecipeImage(recipe: {
    title: string;
    description?: string;
    plating?: string;
    category?: string;
}) {
    const generated = await generateDishImage({
        title: recipe.title,
        description: recipe.description,
        plating: recipe.plating,
        category: recipe.category,
    });

    const uploaded = await uploadAiImageToStorage({
        base64: generated.imageBase64,
        bucket: 'ai-images',
        folder: 'recipes',
        filenameBase: recipe.title,
        contentType: generated.mimeType || 'image/png',
    });

    return uploaded.publicUrl;
}

export async function generateAndUploadTechnicalSheetImage(sheet: {
    title: string;
    description?: string;
    category?: string;
}) {
    const generated = await generateDishImage({
        title: sheet.title,
        description: sheet.description,
        category: sheet.category,
    });

    const uploaded = await uploadAiImageToStorage({
        base64: generated.imageBase64,
        bucket: 'ai-images',
        folder: 'technical-sheets',
        filenameBase: sheet.title,
        contentType: generated.mimeType || 'image/png',
    });

    return uploaded.publicUrl;
}

function ensureRecipeDefaults(recipe: Partial<GeneratedRecipe>): GeneratedRecipe {
    return {
        title: recipe.title || 'Recette générée',
        slug: slugify(recipe.title || 'Recette générée'),
        description: recipe.description || '',
        category: recipe.category || 'Plat principal',
        season: recipe.season || getSeasonFromDate(),
        difficulty: recipe.difficulty || 'moyen',
        prep_time: recipe.prep_time || 15,
        cook_time: recipe.cook_time || 20,
        servings: recipe.servings || 4,
        image_url: recipe.image_url || '',
        ingredients: (recipe.ingredients || []).map((ing) => ({
            name: ing.name || 'Ingrédient',
            quantity: ing.quantity || 100,
            unit: ing.unit || 'g',
            cost: ing.cost || 0.5,
            allergens: ing.allergens || [],
            calories: ing.calories || 100,
            lipides: ing.lipides ?? 5,
            glucides: ing.glucides ?? 10,
            proteines: ing.proteines ?? 5,
            fibres: ing.fibres ?? 2,
            sel: ing.sel ?? 0.5,
        })),
        steps: (recipe.steps || []).map((step, i) => ({
            step_number: step.step_number || i + 1,
            instruction: step.instruction || '',
        })),
        calories_per_serving: recipe.calories_per_serving || 350,
        lipides: recipe.lipides ?? 15,
        glucides: recipe.glucides ?? 30,
        proteines: recipe.proteines ?? 20,
        fibres: recipe.fibres ?? 3,
        sel: recipe.sel ?? 1,
        nutri_score:
            recipe.nutri_score ||
            calculateNutriScore(
                recipe.calories_per_serving || 350,
                recipe.lipides ?? 15,
                recipe.glucides ?? 30,
                recipe.proteines ?? 20,
                recipe.fibres ?? 3,
                recipe.sel ?? 1,
            ),
        cost_per_serving: recipe.cost_per_serving || 5,
        plating: recipe.plating || '',
    };
}

function ensureTechnicalSheetDefaults(
    sheet: Partial<GeneratedTechnicalSheet>,
): GeneratedTechnicalSheet {
    return {
        title: sheet.title || 'Fiche technique',
        slug: slugify(sheet.title || 'Fiche technique'),
        category: sheet.category || 'Plat principal',
        description: sheet.description || '',
        image_url: sheet.image_url || '',
        ingredients: (sheet.ingredients || []).map((ing) => ({
            name: ing.name || 'Ingrédient',
            quantity: ing.quantity || 100,
            unit: ing.unit || 'g',
            cost: ing.cost || 0.5,
            allergens: ing.allergens || [],
            calories: ing.calories || 100,
            lipides: ing.lipides ?? 5,
            glucides: ing.glucides ?? 10,
            proteines: ing.proteines ?? 5,
        })),
        steps: (sheet.steps || []).map((step, i) => ({
            step_number: step.step_number || i + 1,
            instruction: step.instruction || '',
        })),
        total_cost: sheet.total_cost || 10,
        selling_price: sheet.selling_price || 30,
        margin_ratio: sheet.margin_ratio || 3,
        portions: sheet.portions || 4,
        cost_per_portion: sheet.cost_per_portion || 2.5,
        allergens: sheet.allergens || [],
        calories_per_portion: sheet.calories_per_portion || 350,
        lipides: sheet.lipides ?? 15,
        glucides: sheet.glucides ?? 30,
        proteines: sheet.proteines ?? 20,
        fibres: sheet.fibres ?? 3,
        sel: sheet.sel ?? 1,
        nutri_score: sheet.nutri_score || 'B',
        preparation_time: sheet.preparation_time || 20,
        cooking_time: sheet.cooking_time || 25,
    };
}

function ensureMenuDefaults(menu: Partial<GeneratedMenu>): GeneratedMenu {
    const season = menu.season || getSeasonFromDate();

    const items = Array.isArray(menu.items)
        ? menu.items.map((item) => ({
            item_type: item.item_type || 'plat',
            title: item.title || 'Plat',
            description: item.description || '',
            recipe: item.recipe ? ensureRecipeDefaults(item.recipe) : undefined,
        }))
        : [];

    const totalCalories =
        typeof menu.total_calories === 'number'
            ? menu.total_calories
            : items.reduce((sum, item) => sum + (item.recipe?.calories_per_serving || 0), 0);

    return {
        title: menu.title || `Menu ${season}`,
        slug: slugify(menu.title || `Menu ${season}`),
        description: menu.description || '',
        season,
        items,
        total_calories: totalCalories,
        is_balanced: menu.is_balanced ?? items.length >= 3,
    };
}

export async function generateRecipe(
    prompt: string,
    category = 'Plat principal',
): Promise<GeneratedRecipe> {
    const result = await callFunction({ type: 'recipe', prompt, category });
    return ensureRecipeDefaults(result);
}

export async function generateTechnicalSheet(
    prompt: string,
    category: string,
): Promise<GeneratedTechnicalSheet> {
    const result = await callFunction({ type: 'technical_sheet', prompt, category });
    return ensureTechnicalSheetDefaults(result);
}

export async function generateMenu(
    season: string,
    type: 'gastronomique' | 'business' | 'evenementiel' = 'gastronomique',
): Promise<GeneratedMenu> {
    const result = await callFunction({ type: 'menu', season, menu_type: type });
    return ensureMenuDefaults(result);
}

export async function generateHACCPChecklist(zone: string): Promise<GeneratedHACCP> {
    const result = await callFunction({ type: 'haccp', prompt: zone });

    return {
        title: result.title || `Checklist HACCP - ${zone}`,
        zone: result.zone || zone,
        items: (result.items || []).map((item: any) => ({
            category: item.category || 'Général',
            check: item.check || '',
            frequency: item.frequency || 'quotidien',
            critical: item.critical ?? false,
            corrective_action: item.corrective_action || '',
        })),
    };
}