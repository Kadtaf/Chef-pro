import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { generateRecipe, generateTechnicalSheet, generateMenu, generateHACCPChecklist, optimizeMenu, GeneratedRecipe, GeneratedTechnicalSheet, GeneratedMenu } from '../../lib/ai-service';
import { Brain, Sparkles, ChefHat, FileText, Menu, ClipboardCheck, Download, Save, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

type GenerationType = 'recipe' | 'technical_sheet' | 'menu' | 'haccp';

export default function AIStudio() {
  const [type, setType] = useState<GenerationType>('recipe');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedRecipe | GeneratedTechnicalSheet | GeneratedMenu | null>(null);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setSaved(false);

    let generated;
    switch (type) {
      case 'recipe':
        generated = generateRecipe(prompt || 'Création gastronomique', 'Plat principal');
        break;
      case 'technical_sheet':
        generated = generateTechnicalSheet(prompt || 'Fiche technique', 'Plat principal');
        break;
      case 'menu':
        generated = generateMenu('hiver', 'gastronomique');
        break;
      default:
        generated = null;
    }

    setResult(generated);
    setGenerating(false);

    // Save to AI history
    if (generated) {
      await supabase.from('ai_generations').insert({
        type,
        prompt,
        result: generated as unknown as Record<string, unknown>,
      });
    }
  };

  const handleSaveAsRecipe = async () => {
    if (!result || type !== 'recipe') return;

    const recipe = result as GeneratedRecipe;
    await supabase.from('recipes').insert({
      title: recipe.title,
      slug: recipe.slug,
      description: recipe.description,
      category: recipe.category,
      season: recipe.season,
      difficulty: recipe.difficulty,
      prep_time: recipe.prep_time,
      cook_time: recipe.cook_time,
      servings: recipe.servings,
      cost_per_serving: recipe.cost_per_serving,
      calories_per_serving: recipe.calories_per_serving,
      lipides: recipe.lipides,
      glucides: recipe.glucides,
      proteines: recipe.proteines,
      fibres: recipe.fibres,
      sel: recipe.sel,
      nutri_score: recipe.nutri_score,
      is_published: false,
    });

    setSaved(true);
  };

  const handleSaveAsTechnicalSheet = async () => {
    if (!result || type !== 'technical_sheet') return;

    const sheet = result as GeneratedTechnicalSheet;
    await supabase.from('technical_sheets').insert({
      title: sheet.title,
      slug: sheet.slug,
      category: sheet.category,
      description: sheet.description,
      total_cost: sheet.total_cost,
      selling_price: sheet.selling_price,
      margin_ratio: sheet.margin_ratio,
      portions: sheet.portions,
      cost_per_portion: sheet.cost_per_portion,
      allergens: sheet.allergens,
      calories_per_portion: sheet.calories_per_portion,
      lipides: sheet.lipides,
      glucides: sheet.glucides,
      proteines: sheet.proteines,
      fibres: sheet.fibres,
      sel: sheet.sel,
      nutri_score: sheet.nutri_score,
      preparation_time: sheet.preparation_time,
      cooking_time: sheet.cooking_time,
      is_published: false,
    });

    setSaved(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-neutral-900 flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary-600" />
          IA Studio
        </h1>
        <p className="text-neutral-500">Générez automatiquement recettes, fiches techniques et menus avec l'IA</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">Configuration</h2>

          <div className="space-y-6">
            <div>
              <label className="label">Type de génération</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'recipe', label: 'Recette', icon: ChefHat },
                  { value: 'technical_sheet', label: 'Fiche technique', icon: FileText },
                  { value: 'menu', label: 'Menu', icon: Menu },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setType(opt.value as GenerationType); setResult(null); setSaved(false); }}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                      type === opt.value ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <opt.icon className={`w-6 h-6 ${type === opt.value ? 'text-primary-600' : 'text-neutral-400'}`} />
                    <span className={`text-sm font-medium ${type === opt.value ? 'text-primary-700' : 'text-neutral-600'}`}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {type !== 'menu' && (
              <div>
                <label className="label">Prompt (optionnel)</label>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="input resize-none"
                  placeholder="Décrivez ce que vous voulez générer..."
                />
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-primary w-full gap-2"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Générer
                </>
              )}
            </button>
          </div>

          {/* Features Info */}
          <div className="mt-8 pt-6 border-t border-neutral-200">
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">Fonctionnalités IA</h3>
            <div className="space-y-3 text-sm text-neutral-600">
              <div className="flex items-start gap-2"><Sparkles className="w-4 h-4 text-primary-500 mt-0.5" /><span>Génération de recettes complètes avec nutrition</span></div>
              <div className="flex items-start gap-2"><FileText className="w-4 h-4 text-primary-500 mt-0.5" /><span>Création de fiches techniques avec coûts</span></div>
              <div className="flex items-start gap-2"><Menu className="w-4 h-4 text-primary-500 mt-0.5" /><span>Menus saisonniers et équilibrés</span></div>
              <div className="flex items-start gap-2"><ClipboardCheck className="w-4 h-4 text-primary-500 mt-0.5" /><span>Checklists HACCP automatiques</span></div>
              <div className="flex items-start gap-2"><Brain className="w-4 h-4 text-primary-500 mt-0.5" /><span>Optimisation des coûts et marges</span></div>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">Résultat</h2>

          {!result ? (
            <div className="text-center py-16 text-neutral-400">
              <Brain className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>Cliquez sur "Générer" pour créer du contenu avec l'IA</p>
            </div>
          ) : type === 'recipe' ? (
            <RecipeResult recipe={result as GeneratedRecipe} onSave={handleSaveAsRecipe} saved={saved} />
          ) : type === 'technical_sheet' ? (
            <TechnicalSheetResult sheet={result as GeneratedTechnicalSheet} onSave={handleSaveAsTechnicalSheet} saved={saved} />
          ) : type === 'menu' ? (
            <MenuResult menu={result as GeneratedMenu} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RecipeResult({ recipe, onSave, saved }: { recipe: GeneratedRecipe; onSave: () => void; saved: boolean }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-display font-bold text-neutral-900">{recipe.title}</h3>
        <p className="text-neutral-500">{recipe.description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="badge badge-primary">{recipe.category}</span>
        <span className="badge bg-neutral-100 text-neutral-600">{recipe.difficulty}</span>
        <span className="badge bg-success-100 text-success-700">Nutri-Score {recipe.nutri_score}</span>
      </div>

      <div className="grid grid-cols-4 gap-4 text-center">
        <div className="p-3 bg-neutral-50 rounded-lg"><div className="text-lg font-bold text-primary-600">{recipe.prep_time + recipe.cook_time} min</div><div className="text-xs text-neutral-500">Total</div></div>
        <div className="p-3 bg-neutral-50 rounded-lg"><div className="text-lg font-bold text-primary-600">{recipe.servings}</div><div className="text-xs text-neutral-500">Portions</div></div>
        <div className="p-3 bg-neutral-50 rounded-lg"><div className="text-lg font-bold text-primary-600">{recipe.calories_per_serving}</div><div className="text-xs text-neutral-500">Kcal/pers</div></div>
        <div className="p-3 bg-neutral-50 rounded-lg"><div className="text-lg font-bold text-primary-600">{formatCurrency(recipe.cost_per_serving)}</div><div className="text-xs text-neutral-500">Coût/pers</div></div>
      </div>

      <div>
        <h4 className="font-semibold text-neutral-900 mb-2">Ingrédients</h4>
        <ul className="space-y-1 text-sm text-neutral-600">
          {recipe.ingredients.slice(0, 6).map((ing, i) => <li key={i} className="flex justify-between"><span>{ing.name}</span><span>{ing.quantity} {ing.unit}</span></li>)}
        </ul>
      </div>

      <div>
        <h4 className="font-semibold text-neutral-900 mb-2">Étapes</h4>
        <ol className="space-y-2 text-sm text-neutral-600">
          {recipe.steps.slice(0, 4).map((step, i) => <li key={i} className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs flex-shrink-0">{step.step_number}</span><span>{step.instruction}</span></li>)}
        </ol>
      </div>

      <button onClick={onSave} disabled={saved} className={`btn w-full gap-2 ${saved ? 'btn-success' : 'btn-primary'}`}>
        <Save className="w-5 h-5" />
        {saved ? 'Sauvegardé !' : 'Sauvegarder comme brouillon'}
      </button>
    </div>
  );
}

function TechnicalSheetResult({ sheet, onSave, saved }: { sheet: GeneratedTechnicalSheet; onSave: () => void; saved: boolean }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-display font-bold text-neutral-900">{sheet.title}</h3>
        <p className="text-neutral-500">{sheet.description}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-neutral-50 rounded-lg"><div className="text-lg font-bold text-primary-600">{formatCurrency(sheet.cost_per_portion)}</div><div className="text-xs text-neutral-500">Coût/portion</div></div>
        <div className="p-3 bg-neutral-50 rounded-lg"><div className="text-lg font-bold text-primary-600">{formatCurrency(sheet.selling_price)}</div><div className="text-xs text-neutral-500">Prix vente</div></div>
        <div className="p-3 bg-neutral-50 rounded-lg"><div className="text-lg font-bold text-success-600">x{sheet.margin_ratio}</div><div className="text-xs text-neutral-500">Marge</div></div>
      </div>

      <div className="flex flex-wrap gap-2">
        {sheet.allergens.map((a) => <span key={a} className="badge badge-warning">{a}</span>)}
      </div>

      <button onClick={onSave} disabled={saved} className={`btn w-full gap-2 ${saved ? 'btn-success' : 'btn-primary'}`}>
        <Save className="w-5 h-5" />
        {saved ? 'Sauvegardé !' : 'Sauvegarder comme brouillon'}
      </button>
    </div>
  );
}

function MenuResult({ menu }: { menu: GeneratedMenu }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-display font-bold text-neutral-900">{menu.title}</h3>
        <p className="text-neutral-500">{menu.description}</p>
      </div>

      <div className="space-y-4">
        {menu.items.map((item, i) => (
          <div key={i} className="p-4 bg-neutral-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-primary capitalize">{item.item_type}</span>
            </div>
            <h4 className="font-semibold text-neutral-900">{item.title}</h4>
            <p className="text-sm text-neutral-500">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="p-4 bg-success-50 rounded-lg">
        <span className="font-semibold text-success-700">Total: {menu.total_calories} kcal</span>
        <span className="text-success-600 text-sm ml-4">Menu équilibré</span>
      </div>
    </div>
  );
}
