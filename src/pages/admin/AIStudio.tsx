import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { supabase } from '../../lib/supabase';
import {
    generateRecipe,
    generateTechnicalSheet,
    generateMenu,
    generateHACCPChecklist,
    generateAndUploadRecipeImage,
    generateAndUploadTechnicalSheetImage,
    GeneratedRecipe,
    GeneratedTechnicalSheet,
    GeneratedMenu,
    GeneratedHACCP,
} from '../../lib/ai-service';
import {
    Brain,
    Sparkles,
    ChefHat,
    FileText,
    Menu,
    ClipboardCheck,
    Save,
    RefreshCw,
    AlertTriangle,
    Download,
    Image as ImageIcon,
} from 'lucide-react';
import { formatCurrency, slugify } from '../../lib/utils';

type GenerationType = 'recipe' | 'technical_sheet' | 'menu' | 'haccp';

function normalizeMenuItemType(type?: string) {
    switch (type) {
        case 'amuse_bouche':
            return 'entree';
        case 'entree':
        case 'plat':
        case 'dessert':
        case 'accompagnement':
        case 'boisson':
            return type;
        default:
            return 'plat';
    }
}

async function imageUrlToDataUrl(url: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;

        const blob = await response.blob();

        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(typeof reader.result === 'string' ? reader.result : null);
            };
            reader.onerror = () => reject(new Error('Impossible de lire l’image'));
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

async function saveRecipeWithChildren(recipe: GeneratedRecipe) {
    const { data: recipeRow, error: recipeError } = await supabase
        .from('recipes')
        .insert({
            title: recipe.title,
            slug: recipe.slug || slugify(recipe.title),
            description: recipe.description,
            category: recipe.category,
            season: recipe.season,
            difficulty: recipe.difficulty,
            prep_time: recipe.prep_time,
            cook_time: recipe.cook_time,
            servings: recipe.servings,
            cost_per_serving: recipe.cost_per_serving,
            image_url: recipe.image_url || null,
            is_published: false,
            calories_per_serving: recipe.calories_per_serving,
            lipides: recipe.lipides,
            glucides: recipe.glucides,
            proteines: recipe.proteines,
            fibres: recipe.fibres,
            sel: recipe.sel,
            nutri_score: recipe.nutri_score,
        })
        .select('id')
        .single();

    if (recipeError) throw recipeError;

    if (recipe.ingredients.length > 0) {
        const { error: ingredientsError } = await supabase.from('recipe_ingredients').insert(
            recipe.ingredients.map((ing) => ({
                recipe_id: recipeRow.id,
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
                cost: ing.cost,
                allergens: ing.allergens,
                calories: ing.calories,
                lipides: ing.lipides,
                glucides: ing.glucides,
                proteines: ing.proteines,
                fibres: ing.fibres,
                sel: ing.sel,
            })),
        );

        if (ingredientsError) throw ingredientsError;
    }

    if (recipe.steps.length > 0) {
        const { error: stepsError } = await supabase.from('recipe_steps').insert(
            recipe.steps.map((step) => ({
                recipe_id: recipeRow.id,
                step_number: step.step_number,
                instruction: step.instruction,
            })),
        );

        if (stepsError) throw stepsError;
    }

    return recipeRow.id;
}

async function saveTechnicalSheetWithChildren(sheet: GeneratedTechnicalSheet) {
    const { data: sheetRow, error: sheetError } = await supabase
        .from('technical_sheets')
        .insert({
            title: sheet.title,
            slug: sheet.slug || slugify(sheet.title),
            category: sheet.category,
            description: sheet.description,
            image_url: sheet.image_url || null,
            total_cost: sheet.total_cost,
            selling_price: sheet.selling_price,
            margin_ratio: sheet.margin_ratio,
            portions: sheet.portions,
            cost_per_portion: sheet.cost_per_portion,
            allergens: sheet.allergens,
            is_published: false,
            calories_per_portion: sheet.calories_per_portion,
            lipides: sheet.lipides,
            glucides: sheet.glucides,
            proteines: sheet.proteines,
            fibres: sheet.fibres,
            sel: sheet.sel,
            nutri_score: sheet.nutri_score,
            preparation_time: sheet.preparation_time,
            cooking_time: sheet.cooking_time,
        })
        .select('id')
        .single();

    if (sheetError) throw sheetError;

    if (sheet.ingredients.length > 0) {
        const { error: ingredientsError } = await supabase
            .from('technical_sheet_ingredients')
            .insert(
                sheet.ingredients.map((ing) => ({
                    technical_sheet_id: sheetRow.id,
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
            );

        if (ingredientsError) throw ingredientsError;
    }

    if (sheet.steps.length > 0) {
        const { error: stepsError } = await supabase.from('technical_sheet_steps').insert(
            sheet.steps.map((step) => ({
                technical_sheet_id: sheetRow.id,
                step_number: step.step_number,
                instruction: step.instruction,
            })),
        );

        if (stepsError) throw stepsError;
    }

    return sheetRow.id;
}

async function saveMenuWithRecipes(
    menu: GeneratedMenu,
    menuCategory: 'gastronomique' | 'business' | 'evenementiel',
) {
    const { data: menuRow, error: menuError } = await supabase
        .from('menus')
        .insert({
            title: menu.title,
            slug: menu.slug || slugify(menu.title),
            description: menu.description,
            category: menuCategory,
            season: menu.season,
            total_calories: menu.total_calories,
            is_balanced: menu.is_balanced,
            is_published: false,
        })
        .select('id')
        .single();

    if (menuError) throw menuError;

    const menuItemsPayload = [];

    for (let index = 0; index < menu.items.length; index += 1) {
        const item = menu.items[index];
        let recipeId: string | null = null;

        if (item.recipe) {
            recipeId = await saveRecipeWithChildren({
                ...item.recipe,
                title: item.recipe.title || item.title,
                description: item.recipe.description || item.description,
            });
        }

        menuItemsPayload.push({
            menu_id: menuRow.id,
            recipe_id: recipeId,
            technical_sheet_id: null,
            item_type: normalizeMenuItemType(item.item_type),
            custom_title: item.title,
            custom_description: item.description,
            position: index + 1,
        });
    }

    if (menuItemsPayload.length > 0) {
        const { error: itemsError } = await supabase.from('menu_items').insert(menuItemsPayload);
        if (itemsError) throw itemsError;
    }

    return menuRow.id;
}

async function exportPdf(
    type: GenerationType,
    result: GeneratedRecipe | GeneratedTechnicalSheet | GeneratedMenu | GeneratedHACCP | null,
) {
    if (!result) return;

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const ensureSpace = (needed = 24) => {
        if (y + needed > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
    };

    const addTitle = (text: string) => {
        ensureSpace(40);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text(text, margin, y);
        y += 28;
    };

    const addSection = (text: string) => {
        ensureSpace(28);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(text, margin, y);
        y += 18;
    };

    const addParagraph = (text: string, size = 11) => {
        const lines = doc.splitTextToSize(text || '', contentWidth);
        ensureSpace(lines.length * (size + 4));
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(size);
        doc.text(lines, margin, y);
        y += lines.length * (size + 4) + 6;
    };

    const addBulletLines = (items: string[]) => {
        items.forEach((line) => {
            const lines = doc.splitTextToSize(`• ${line}`, contentWidth);
            ensureSpace(lines.length * 16);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.text(lines, margin, y);
            y += lines.length * 16;
        });
        y += 6;
    };

    if (type === 'recipe') {
        const recipe = result as GeneratedRecipe;
        addTitle(recipe.title);
        addParagraph(recipe.description);

        if (recipe.image_url) {
            const imageData = await imageUrlToDataUrl(recipe.image_url);
            if (imageData) {
                ensureSpace(220);
                doc.addImage(imageData, 'JPEG', margin, y, contentWidth, 180);
                y += 190;
            }
        }

        addParagraph(
            `Catégorie: ${recipe.category} | Saison: ${recipe.season} | Difficulté: ${recipe.difficulty} | Nutri-Score: ${recipe.nutri_score}`,
        );
        addParagraph(
            `Temps total: ${recipe.prep_time + recipe.cook_time} min | Portions: ${recipe.servings} | Kcal/pers: ${recipe.calories_per_serving} | Coût/pers: ${formatCurrency(recipe.cost_per_serving)}`,
        );
        addSection('Ingrédients');
        addBulletLines(
            recipe.ingredients.map(
                (ing) => `${ing.name} — ${ing.quantity} ${ing.unit} — ${formatCurrency(ing.cost)}`,
            ),
        );
        addSection('Étapes');
        addBulletLines(recipe.steps.map((step) => `${step.step_number}. ${step.instruction}`));
        if (recipe.plating) {
            addSection('Dressage');
            addParagraph(recipe.plating);
        }
        doc.save(`${recipe.slug || 'recette'}.pdf`);
        return;
    }

    if (type === 'technical_sheet') {
        const sheet = result as GeneratedTechnicalSheet;
        addTitle(sheet.title);
        addParagraph(sheet.description);

        if (sheet.image_url) {
            const imageData = await imageUrlToDataUrl(sheet.image_url);
            if (imageData) {
                ensureSpace(220);
                doc.addImage(imageData, 'JPEG', margin, y, contentWidth, 180);
                y += 190;
            }
        }

        addParagraph(`Catégorie: ${sheet.category} | Nutri-Score: ${sheet.nutri_score}`);
        addParagraph(
            `Coût/portion: ${formatCurrency(sheet.cost_per_portion)} | Prix vente: ${formatCurrency(sheet.selling_price)} | Marge: x${sheet.margin_ratio} | Portions: ${sheet.portions}`,
        );
        addSection('Ingrédients');
        addBulletLines(
            sheet.ingredients.map(
                (ing) => `${ing.name} — ${ing.quantity} ${ing.unit} — ${formatCurrency(ing.cost)}`,
            ),
        );
        addSection('Étapes');
        addBulletLines(sheet.steps.map((step) => `${step.step_number}. ${step.instruction}`));
        doc.save(`${sheet.slug || 'fiche-technique'}.pdf`);
        return;
    }

    if (type === 'menu') {
        const menu = result as GeneratedMenu;
        addTitle(menu.title);
        addParagraph(menu.description || 'Menu généré par l’IA');
        addParagraph(
            `Saison: ${menu.season} | ${menu.is_balanced ? 'Menu équilibré' : 'Menu non équilibré'} | Total: ${menu.total_calories} kcal/personne`,
        );
        addSection('Éléments du menu');

        if (!menu.items.length) {
            addParagraph('Aucun item exploitable généré.');
        } else {
            menu.items.forEach((item) => {
                ensureSpace(72);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.text(`${normalizeMenuItemType(item.item_type).toUpperCase()} — ${item.title}`, margin, y);
                y += 16;
                addParagraph(item.description || '');
                if (item.recipe) {
                    addParagraph(
                        `Kcal: ${item.recipe.calories_per_serving} | Temps: ${item.recipe.prep_time + item.recipe.cook_time} min | Coût/pers: ${formatCurrency(item.recipe.cost_per_serving)}`,
                    );
                }
            });
        }

        doc.save(`${menu.slug || 'menu'}.pdf`);
        return;
    }

    const checklist = result as GeneratedHACCP;
    addTitle(checklist.title);
    addParagraph(`Zone: ${checklist.zone}`);
    addSection('Points de contrôle');
    addBulletLines(
        checklist.items.map(
            (item) =>
                `${item.check} | Catégorie: ${item.category} | Fréquence: ${item.frequency} | Critique: ${item.critical ? 'Oui' : 'Non'} | Action corrective: ${item.corrective_action}`,
        ),
    );
    doc.save(`haccp-${checklist.zone}.pdf`);
}

function renderRecipePreview(recipe: GeneratedRecipe) {
    const allAllergens = Array.from(
        new Set(recipe.ingredients.flatMap((ingredient) => ingredient.allergens || [])),
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Catégorie</p>
                    <p className="font-medium text-neutral-900">{recipe.category}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Saison</p>
                    <p className="font-medium text-neutral-900 capitalize">{recipe.season}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Difficulté</p>
                    <p className="font-medium text-neutral-900 capitalize">{recipe.difficulty}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Portions</p>
                    <p className="font-medium text-neutral-900">{recipe.servings}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Préparation</p>
                    <p className="font-medium text-neutral-900">{recipe.prep_time} min</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Cuisson</p>
                    <p className="font-medium text-neutral-900">{recipe.cook_time} min</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Coût / portion</p>
                    <p className="font-medium text-neutral-900">{formatCurrency(recipe.cost_per_serving)}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Nutri-Score</p>
                    <p className="font-medium text-neutral-900">{recipe.nutri_score}</p>
                </div>
            </div>

            <div>
                <h4 className="text-lg font-semibold text-neutral-900 mb-3">Ingrédients</h4>
                <div className="rounded-lg border border-neutral-200 overflow-hidden">
                    <div className="divide-y divide-neutral-200">
                        {recipe.ingredients.map((ingredient, index) => (
                            <div
                                key={`${ingredient.name}-${index}`}
                                className="flex items-start justify-between gap-4 p-4 bg-white"
                            >
                                <div>
                                    <p className="font-medium text-neutral-900">{ingredient.name}</p>
                                    {!!ingredient.allergens?.length && (
                                        <p className="text-xs text-warning-700 mt-1">
                                            Allergènes : {ingredient.allergens.join(', ')}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right text-sm text-neutral-600 whitespace-nowrap">
                                    <p>
                                        {ingredient.quantity} {ingredient.unit}
                                    </p>
                                    <p>{formatCurrency(ingredient.cost)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div>
                <h4 className="text-lg font-semibold text-neutral-900 mb-3">Préparation</h4>
                <div className="space-y-3">
                    {recipe.steps.map((step) => (
                        <div
                            key={step.step_number}
                            className="rounded-lg border border-neutral-200 bg-white p-4"
                        >
                            <p className="text-sm font-semibold text-primary-700 mb-2">
                                Étape {step.step_number}
                            </p>
                            <p className="text-neutral-700 leading-7">{step.instruction}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h4 className="text-lg font-semibold text-neutral-900 mb-3">Valeurs nutritionnelles</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                        <p className="text-xs text-neutral-500">Calories / portion</p>
                        <p className="font-medium text-neutral-900">{recipe.calories_per_serving} kcal</p>
                    </div>
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                        <p className="text-xs text-neutral-500">Protéines</p>
                        <p className="font-medium text-neutral-900">{recipe.proteines} g</p>
                    </div>
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                        <p className="text-xs text-neutral-500">Glucides</p>
                        <p className="font-medium text-neutral-900">{recipe.glucides} g</p>
                    </div>
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                        <p className="text-xs text-neutral-500">Lipides</p>
                        <p className="font-medium text-neutral-900">{recipe.lipides} g</p>
                    </div>
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                        <p className="text-xs text-neutral-500">Fibres</p>
                        <p className="font-medium text-neutral-900">{recipe.fibres} g</p>
                    </div>
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                        <p className="text-xs text-neutral-500">Sel</p>
                        <p className="font-medium text-neutral-900">{recipe.sel} g</p>
                    </div>
                </div>
            </div>

            {!!allAllergens.length && (
                <div>
                    <h4 className="text-lg font-semibold text-neutral-900 mb-3">Allergènes</h4>
                    <div className="flex flex-wrap gap-2">
                        {allAllergens.map((allergen) => (
                            <span
                                key={allergen}
                                className="px-3 py-1 rounded-full bg-warning-50 text-warning-700 text-sm border border-warning-200"
                            >
                {allergen}
              </span>
                        ))}
                    </div>
                </div>
            )}

            {recipe.plating && (
                <div>
                    <h4 className="text-lg font-semibold text-neutral-900 mb-3">Dressage</h4>
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                        <p className="text-neutral-700 leading-7">{recipe.plating}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function renderTechnicalSheetPreview(sheet: GeneratedTechnicalSheet) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Catégorie</p>
                    <p className="font-medium text-neutral-900">{sheet.category}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Portions</p>
                    <p className="font-medium text-neutral-900">{sheet.portions}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Coût total</p>
                    <p className="font-medium text-neutral-900">{formatCurrency(sheet.total_cost)}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Prix de vente</p>
                    <p className="font-medium text-neutral-900">{formatCurrency(sheet.selling_price)}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Coût / portion</p>
                    <p className="font-medium text-neutral-900">{formatCurrency(sheet.cost_per_portion)}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Marge</p>
                    <p className="font-medium text-neutral-900">x{sheet.margin_ratio}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Préparation</p>
                    <p className="font-medium text-neutral-900">{sheet.preparation_time} min</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Cuisson</p>
                    <p className="font-medium text-neutral-900">{sheet.cooking_time} min</p>
                </div>
            </div>

            <div>
                <h4 className="text-lg font-semibold text-neutral-900 mb-3">Ingrédients</h4>
                <div className="space-y-2">
                    {sheet.ingredients.map((ingredient, index) => (
                        <div
                            key={`${ingredient.name}-${index}`}
                            className="rounded-lg border border-neutral-200 bg-white p-4 flex items-start justify-between gap-4"
                        >
                            <div>
                                <p className="font-medium text-neutral-900">{ingredient.name}</p>
                                {!!ingredient.allergens?.length && (
                                    <p className="text-xs text-warning-700 mt-1">
                                        Allergènes : {ingredient.allergens.join(', ')}
                                    </p>
                                )}
                            </div>
                            <div className="text-right text-sm text-neutral-600">
                                <p>{ingredient.quantity} {ingredient.unit}</p>
                                <p>{formatCurrency(ingredient.cost)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h4 className="text-lg font-semibold text-neutral-900 mb-3">Étapes</h4>
                <div className="space-y-3">
                    {sheet.steps.map((step) => (
                        <div key={step.step_number} className="rounded-lg border border-neutral-200 bg-white p-4">
                            <p className="text-sm font-semibold text-primary-700 mb-2">Étape {step.step_number}</p>
                            <p className="text-neutral-700 leading-7">{step.instruction}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function renderMenuPreview(menu: GeneratedMenu) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Saison</p>
                    <p className="font-medium text-neutral-900 capitalize">{menu.season}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Calories totales</p>
                    <p className="font-medium text-neutral-900">{menu.total_calories} kcal</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Équilibré</p>
                    <p className="font-medium text-neutral-900">{menu.is_balanced ? 'Oui' : 'Non'}</p>
                </div>
            </div>

            <div className="space-y-4">
                {menu.items.map((item, index) => (
                    <div key={`${item.title}-${index}`} className="rounded-lg border border-neutral-200 bg-white p-5">
                        <p className="text-xs uppercase tracking-wide text-primary-700 font-semibold mb-2">
                            {normalizeMenuItemType(item.item_type)}
                        </p>
                        <h4 className="text-lg font-semibold text-neutral-900">{item.title}</h4>
                        <p className="text-neutral-600 mt-2">{item.description}</p>

                        {item.recipe && (
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-200">
                                    <p className="text-xs text-neutral-500">Portions</p>
                                    <p className="font-medium text-neutral-900">{item.recipe.servings}</p>
                                </div>
                                <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-200">
                                    <p className="text-xs text-neutral-500">Temps total</p>
                                    <p className="font-medium text-neutral-900">
                                        {item.recipe.prep_time + item.recipe.cook_time} min
                                    </p>
                                </div>
                                <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-200">
                                    <p className="text-xs text-neutral-500">Calories</p>
                                    <p className="font-medium text-neutral-900">{item.recipe.calories_per_serving} kcal</p>
                                </div>
                                <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-200">
                                    <p className="text-xs text-neutral-500">Coût / portion</p>
                                    <p className="font-medium text-neutral-900">{formatCurrency(item.recipe.cost_per_serving)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function renderHaccpPreview(checklist: GeneratedHACCP) {
    return (
        <div className="space-y-6">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs text-neutral-500">Zone</p>
                <p className="font-medium text-neutral-900 capitalize">{checklist.zone}</p>
            </div>

            <div className="space-y-3">
                {checklist.items.map((item, index) => (
                    <div key={`${item.check}-${index}`} className="rounded-lg border border-neutral-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="font-medium text-neutral-900">{item.check}</p>
                                <p className="text-sm text-neutral-500 mt-1">
                                    {item.category} • {item.frequency}
                                </p>
                            </div>
                            <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    item.critical
                                        ? 'bg-warning-50 text-warning-700 border border-warning-200'
                                        : 'bg-success-50 text-success-700 border border-success-200'
                                }`}
                            >
                {item.critical ? 'Critique' : 'Standard'}
              </span>
                        </div>

                        <div className="mt-3 rounded-lg bg-neutral-50 border border-neutral-200 p-3">
                            <p className="text-xs text-neutral-500 mb-1">Action corrective</p>
                            <p className="text-sm text-neutral-700">{item.corrective_action}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function AIStudio() {
    const navigate = useNavigate();
    const [type, setType] = useState<GenerationType>('recipe');
    const [prompt, setPrompt] = useState('');
    const [category, setCategory] = useState('Plat principal');
    const [season, setSeason] = useState('hiver');
    const [menuType, setMenuType] = useState<'gastronomique' | 'business' | 'evenementiel'>('gastronomique');
    const [haccpZone, setHaccpZone] = useState('cuisine');
    const [generating, setGenerating] = useState(false);
    const [generatingImage, setGeneratingImage] = useState(false);
    const [saved, setSaved] = useState(false);
    const [generateImage, setGenerateImage] = useState(true);
    const [result, setResult] = useState<
        GeneratedRecipe | GeneratedTechnicalSheet | GeneratedMenu | GeneratedHACCP | null
    >(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setGenerating(true);
        setGeneratingImage(false);
        setSaved(false);
        setError(null);

        try {
            let generated:
                | GeneratedRecipe
                | GeneratedTechnicalSheet
                | GeneratedMenu
                | GeneratedHACCP
                | null = null;

            switch (type) {
                case 'recipe':
                    generated = await generateRecipe(prompt || 'Création gastronomique originale', category);
                    break;
                case 'technical_sheet':
                    generated = await generateTechnicalSheet(
                        prompt || 'Fiche technique gastronomique',
                        category,
                    );
                    break;
                case 'menu':
                    generated = await generateMenu(season, menuType);
                    break;
                case 'haccp':
                    generated = await generateHACCPChecklist(haccpZone);
                    break;
            }

            if (generated && generateImage && type === 'recipe') {
                setGeneratingImage(true);
                const recipe = generated as GeneratedRecipe;
                const imageUrl = await generateAndUploadRecipeImage({
                    title: recipe.title,
                    description: recipe.description,
                    plating: recipe.plating,
                    category: recipe.category,
                });
                generated = { ...recipe, image_url: imageUrl };
                setGeneratingImage(false);
            }

            if (generated && generateImage && type === 'technical_sheet') {
                setGeneratingImage(true);
                const sheet = generated as GeneratedTechnicalSheet;
                const imageUrl = await generateAndUploadTechnicalSheetImage({
                    title: sheet.title,
                    description: sheet.description,
                    category: sheet.category,
                });
                generated = { ...sheet, image_url: imageUrl };
                setGeneratingImage(false);
            }

            setResult(generated);

            if (generated) {
                const { error: insertError } = await supabase.from('ai_generations').insert({
                    type,
                    prompt,
                    result: generated as unknown as Record<string, unknown>,
                });

                if (insertError) console.error('Erreur ai_generations:', insertError);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setGenerating(false);
            setGeneratingImage(false);
        }
    };

    const handleSave = async () => {
        try {
            if (!result) return;

            if (type === 'recipe') {
                await saveRecipeWithChildren(result as GeneratedRecipe);
                setSaved(true);
                navigate('/admin/recipes');
                return;
            }

            if (type === 'technical_sheet') {
                await saveTechnicalSheetWithChildren(result as GeneratedTechnicalSheet);
                setSaved(true);
                navigate('/admin/technical-sheets');
                return;
            }

            if (type === 'menu') {
                await saveMenuWithRecipes(result as GeneratedMenu, menuType);
                setSaved(true);
                navigate('/admin/menus');
                return;
            }

            if (type === 'haccp') {
                const checklist = result as GeneratedHACCP;
                const { error } = await supabase.from('haccp_records').insert({
                    type: 'checklist',
                    title: checklist.title,
                    zone: checklist.zone,
                    status: 'pending',
                    checklist_items: checklist.items,
                });

                if (error) throw error;

                setSaved(true);
                navigate('/admin/haccp');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur de sauvegarde');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-display font-bold text-neutral-900 flex items-center gap-3">
                    <Brain className="w-8 h-8 text-primary-600" />
                    IA Studio
                </h1>
                <p className="text-neutral-500">
                    Générez automatiquement recettes, fiches techniques, menus et checklists HACCP avec l'IA
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6 space-y-6">
                    <div>
                        <label className="label">Type de génération</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { value: 'recipe' as GenerationType, label: 'Recette', icon: ChefHat },
                                { value: 'technical_sheet' as GenerationType, label: 'Fiche technique', icon: FileText },
                                { value: 'menu' as GenerationType, label: 'Menu', icon: Menu },
                                { value: 'haccp' as GenerationType, label: 'HACCP', icon: ClipboardCheck },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        setType(opt.value);
                                        setResult(null);
                                        setSaved(false);
                                        setError(null);
                                    }}
                                    className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                                        type === opt.value ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-neutral-300'
                                    }`}
                                >
                                    <opt.icon className={`w-6 h-6 ${type === opt.value ? 'text-primary-600' : 'text-neutral-400'}`} />
                                    <span className={`text-sm font-medium ${type === opt.value ? 'text-primary-700' : 'text-neutral-600'}`}>
                    {opt.label}
                  </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {(type === 'recipe' || type === 'technical_sheet') && (
                        <>
                            <div>
                                <label className="label">Catégorie</label>
                                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                                    <option>Entrée</option>
                                    <option>Plat principal</option>
                                    <option>Dessert</option>
                                    <option>Amuse-bouche</option>
                                    <option>Accompagnement</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Prompt</label>
                                <textarea
                                    rows={4}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="input resize-none"
                                    placeholder="Exemple : Saint-Jacques rôties, purée de panais, sauce beurre blanc agrumes"
                                />
                            </div>

                            <label className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                                <input
                                    type="checkbox"
                                    checked={generateImage}
                                    onChange={(e) => setGenerateImage(e.target.checked)}
                                />
                                <span className="text-sm text-neutral-700">
                  Générer aussi une photo IA et l’enregistrer dans Supabase Storage
                </span>
                            </label>
                        </>
                    )}

                    {type === 'menu' && (
                        <>
                            <div>
                                <label className="label">Saison</label>
                                <select value={season} onChange={(e) => setSeason(e.target.value)} className="input">
                                    <option value="hiver">Hiver</option>
                                    <option value="printemps">Printemps</option>
                                    <option value="ete">Été</option>
                                    <option value="automne">Automne</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Type de menu</label>
                                <select value={menuType} onChange={(e) => setMenuType(e.target.value as typeof menuType)} className="input">
                                    <option value="gastronomique">Gastronomique</option>
                                    <option value="business">Business</option>
                                    <option value="evenementiel">Événementiel</option>
                                </select>
                            </div>
                        </>
                    )}

                    {type === 'haccp' && (
                        <div>
                            <label className="label">Zone</label>
                            <select value={haccpZone} onChange={(e) => setHaccpZone(e.target.value)} className="input">
                                <option value="cuisine">Cuisine</option>
                                <option value="stockage">Stockage</option>
                                <option value="livraison">Livraison</option>
                                <option value="preparation">Préparation</option>
                                <option value="service">Service</option>
                            </select>
                        </div>
                    )}

                    <button onClick={handleGenerate} disabled={generating} className="btn-primary w-full gap-2">
                        {generating ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                Génération en cours...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Générer avec l'IA
                            </>
                        )}
                    </button>

                    {generatingImage && (
                        <div className="p-3 rounded-lg bg-primary-50 text-primary-700 text-sm flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            Génération et upload de l’image en cours...
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-warning-800">Erreur</p>
                                <p className="text-sm text-warning-600 mt-1">{error}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="card p-6">
                    {!result && !generating ? (
                        <div className="text-center py-16 text-neutral-400">
                            <Brain className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p>Cliquez sur "Générer avec l'IA"</p>
                        </div>
                    ) : generating ? (
                        <div className="text-center py-16">
                            <RefreshCw className="w-10 h-10 mx-auto mb-4 animate-spin text-primary-600" />
                            <p className="text-primary-700 font-medium">Génération en cours...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {'title' in (result || {}) && (
                                <div>
                                    <h3 className="text-xl font-display font-bold text-neutral-900">{(result as any).title}</h3>
                                    {'description' in (result || {}) && (
                                        <p className="text-neutral-500">{(result as any).description}</p>
                                    )}
                                </div>
                            )}

                            {type === 'recipe' && (result as GeneratedRecipe)?.image_url && (
                                <img
                                    src={(result as GeneratedRecipe).image_url}
                                    alt={(result as GeneratedRecipe).title}
                                    className="w-full h-64 object-cover rounded-lg border border-neutral-200"
                                />
                            )}

                            {type === 'technical_sheet' && (result as GeneratedTechnicalSheet)?.image_url && (
                                <img
                                    src={(result as GeneratedTechnicalSheet).image_url}
                                    alt={(result as GeneratedTechnicalSheet).title}
                                    className="w-full h-64 object-cover rounded-lg border border-neutral-200"
                                />
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={saved}
                                    className={`btn w-full gap-2 ${saved ? 'btn-success' : 'btn-primary'}`}
                                >
                                    <Save className="w-5 h-5" />
                                    {saved ? 'Sauvegardé !' : 'Sauvegarder'}
                                </button>

                                <button onClick={() => void exportPdf(type, result)} className="btn btn-secondary w-full gap-2">
                                    <Download className="w-5 h-5" />
                                    Export PDF
                                </button>
                            </div>

                            {type === 'recipe' && result && renderRecipePreview(result as GeneratedRecipe)}
                            {type === 'technical_sheet' && result && renderTechnicalSheetPreview(result as GeneratedTechnicalSheet)}
                            {type === 'menu' && result && renderMenuPreview(result as GeneratedMenu)}
                            {type === 'haccp' && result && renderHaccpPreview(result as GeneratedHACCP)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
