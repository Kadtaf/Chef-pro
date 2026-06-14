import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Tables } from '../../lib/supabase';
import { slugify, calculateNutriScore, ALLERGENS, RECIPE_CATEGORIES, SEASONS, DIFFICULTY_LEVELS } from '../../lib/utils';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';

export default function RecipeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    category: 'Plat principal',
    season: 'all',
    difficulty: 'moyen',
    prep_time: 0,
    cook_time: 0,
    servings: 4,
    cost_per_serving: 0,
    image_url: '',
    is_published: false,
    is_featured: false,
  });

  const [ingredients, setIngredients] = useState<{
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
  }[]>([]);

  const [steps, setSteps] = useState<{ step_number: number; instruction: string }[]>([]);
  const [nutriScore, setNutriScore] = useState<'A' | 'B' | 'C' | 'D' | 'E' | null>(null);

  useEffect(() => {
    if (isEdit && id) {
      fetchRecipe();
    }
  }, [id]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, slug: slugify(prev.title) }));
  }, [formData.title]);

  useEffect(() => {
    const totalCal = ingredients.reduce((acc, i) => acc + i.calories, 0);
    const totalLip = ingredients.reduce((acc, i) => acc + i.lipides, 0);
    const totalGlu = ingredients.reduce((acc, i) => acc + i.glucides, 0);
    const totalPro = ingredients.reduce((acc, i) => acc + i.proteines, 0);
    const totalFib = ingredients.reduce((acc, i) => acc + i.fibres, 0);
    const totalSel = ingredients.reduce((acc, i) => acc + i.sel, 0);

    if (formData.servings > 0 && totalCal > 0) {
      const calPerServing = totalCal / formData.servings;
      const score = calculateNutriScore(
        calPerServing,
        totalLip / formData.servings,
        totalGlu / formData.servings,
        totalPro / formData.servings,
        totalFib / formData.servings,
        totalSel / formData.servings
      );
      setNutriScore(score);
    }
  }, [ingredients, formData.servings]);

  const fetchRecipe = async () => {
    setLoading(true);
    const { data: recipe } = await supabase.from('recipes').select('*').eq('id', id).single();
    const { data: ingredientsData } = await supabase.from('recipe_ingredients').select('*').eq('recipe_id', id);
    const { data: stepsData } = await supabase.from('recipe_steps').select('*').eq('recipe_id', id).order('step_number');

    if (recipe) {
      setFormData({
        title: recipe.title,
        slug: recipe.slug,
        description: recipe.description || '',
        category: recipe.category,
        season: recipe.season || 'all',
        difficulty: recipe.difficulty || 'moyen',
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        cost_per_serving: recipe.cost_per_serving,
        image_url: recipe.image_url || '',
        is_published: recipe.is_published,
        is_featured: recipe.is_featured,
      });
      setNutriScore(recipe.nutri_score as 'A' | 'B' | 'C' | 'D' | 'E' | null);
    }

    if (ingredientsData) {
      setIngredients(ingredientsData.map(i => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        cost: i.cost,
        allergens: i.allergens || [],
        calories: i.calories,
        lipides: i.lipides,
        glucides: i.glucides,
        proteines: i.proteines,
        fibres: i.fibres,
        sel: i.sel,
      })));
    }

    if (stepsData) {
      setSteps(stepsData.map(s => ({
        step_number: s.step_number,
        instruction: s.instruction,
      })));
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const totalCal = ingredients.reduce((acc, i) => acc + i.calories, 0);
    const totalLip = ingredients.reduce((acc, i) => acc + i.lipides, 0);
    const totalGlu = ingredients.reduce((acc, i) => acc + i.glucides, 0);
    const totalPro = ingredients.reduce((acc, i) => acc + i.proteines, 0);
    const totalFib = ingredients.reduce((acc, i) => acc + i.fibres, 0);
    const totalSel = ingredients.reduce((acc, i) => acc + i.sel, 0);

    const recipeData = {
      ...formData,
      calories_per_serving: formData.servings > 0 ? totalCal / formData.servings : 0,
      lipides: formData.servings > 0 ? totalLip / formData.servings : 0,
      glucides: formData.servings > 0 ? totalGlu / formData.servings : 0,
      proteines: formData.servings > 0 ? totalPro / formData.servings : 0,
      fibres: formData.servings > 0 ? totalFib / formData.servings : 0,
      sel: formData.servings > 0 ? totalSel / formData.servings : 0,
      nutri_score: nutriScore,
      cost_per_serving: formData.servings > 0 ? ingredients.reduce((acc, i) => acc + i.cost, 0) / formData.servings : 0,
    };

    let recipeId = id;

    if (isEdit) {
      await supabase.from('recipes').update(recipeData).eq('id', id);
    } else {
      const { data: newRecipe } = await supabase
        .from('recipes')
        .insert(recipeData)
        .select('id')
        .single();
      recipeId = newRecipe?.id;
    }

    if (recipeId) {
      // Delete existing ingredients and steps
      await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId);
      await supabase.from('recipe_steps').delete().eq('recipe_id', recipeId);

      // Insert new ingredients
      if (ingredients.length > 0) {
        await supabase.from('recipe_ingredients').insert(
          ingredients.map(ing => ({ ...ing, recipe_id: recipeId }))
        );
      }

      // Insert new steps
      if (steps.length > 0) {
        await supabase.from('recipe_steps').insert(
          steps.map((step, index) => ({
            ...step,
            step_number: index + 1,
            recipe_id: recipeId,
          }))
        );
      }
    }

    setSaving(false);
    navigate('/admin/recipes');
  };

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { name: '', quantity: 0, unit: 'g', cost: 0, allergens: [], calories: 0, lipides: 0, glucides: 0, proteines: 0, fibres: 0, sel: 0 },
    ]);
  };

  const addStep = () => {
    setSteps([...steps, { step_number: steps.length + 1, instruction: '' }]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/recipes')} className="btn-ghost">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">
            {isEdit ? 'Modifier la recette' : 'Nouvelle recette'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Informations générales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Titre *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Slug</label>
              <input
                type="text"
                value={formData.slug}
                className="input bg-neutral-50"
                readOnly
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input resize-none"
              />
            </div>
            <div>
              <label className="label">Catégorie *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input"
              >
                {RECIPE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Saison</label>
              <select
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                className="input"
              >
                {SEASONS.map((s) => (
                  <option key={s} value={s}>{s === 'all' ? 'Toutes saisons' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Difficulté</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="input"
              >
                {DIFFICULTY_LEVELS.map((d) => (
                  <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Image URL</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="input"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Time & Servings */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Temps & Portions</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="label">Temps de préparation (min)</label>
              <input
                type="number"
                min="0"
                value={formData.prep_time}
                onChange={(e) => setFormData({ ...formData, prep_time: parseInt(e.target.value) || 0 })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Temps de cuisson (min)</label>
              <input
                type="number"
                min="0"
                value={formData.cook_time}
                onChange={(e) => setFormData({ ...formData, cook_time: parseInt(e.target.value) || 0 })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Portions *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.servings}
                onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) || 1 })}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Ingrédients</h2>
            <button type="button" onClick={addIngredient} className="btn-ghost text-sm">
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
          <div className="space-y-4">
            {ingredients.map((ing, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-start">
                <input
                  type="text"
                  placeholder="Ingrédient"
                  value={ing.name}
                  onChange={(e) => {
                    const newIngs = [...ingredients];
                    newIngs[index].name = e.target.value;
                    setIngredients(newIngs);
                  }}
                  className="input col-span-4"
                />
                <input
                  type="number"
                  placeholder="Qté"
                  value={ing.quantity || ''}
                  onChange={(e) => {
                    const newIngs = [...ingredients];
                    newIngs[index].quantity = parseFloat(e.target.value) || 0;
                    setIngredients(newIngs);
                  }}
                  className="input col-span-1"
                />
                <input
                  type="text"
                  placeholder="Unité"
                  value={ing.unit}
                  onChange={(e) => {
                    const newIngs = [...ingredients];
                    newIngs[index].unit = e.target.value;
                    setIngredients(newIngs);
                  }}
                  className="input col-span-1"
                />
                <input
                  type="number"
                  placeholder="Kcal"
                  value={ing.calories || ''}
                  onChange={(e) => {
                    const newIngs = [...ingredients];
                    newIngs[index].calories = parseFloat(e.target.value) || 0;
                    setIngredients(newIngs);
                  }}
                  className="input col-span-1"
                />
                <input
                  type="number"
                  placeholder="Lip."
                  value={ing.lipides || ''}
                  onChange={(e) => {
                    const newIngs = [...ingredients];
                    newIngs[index].lipides = parseFloat(e.target.value) || 0;
                    setIngredients(newIngs);
                  }}
                  className="input col-span-1"
                />
                <input
                  type="number"
                  placeholder="Glu."
                  value={ing.glucides || ''}
                  onChange={(e) => {
                    const newIngs = [...ingredients];
                    newIngs[index].glucides = parseFloat(e.target.value) || 0;
                    setIngredients(newIngs);
                  }}
                  className="input col-span-1"
                />
                <input
                  type="number"
                  placeholder="Pro."
                  value={ing.proteines || ''}
                  onChange={(e) => {
                    const newIngs = [...ingredients];
                    newIngs[index].proteines = parseFloat(e.target.value) || 0;
                    setIngredients(newIngs);
                  }}
                  className="input col-span-1"
                />
                <button
                  type="button"
                  onClick={() => setIngredients(ingredients.filter((_, i) => i !== index))}
                  className="p-2 rounded-lg hover:bg-error-50 col-span-1"
                >
                  <Trash2 className="w-4 h-4 text-error-500" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Étapes</h2>
            <button type="button" onClick={addStep} className="btn-ghost text-sm">
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold flex-shrink-0">
                  {index + 1}
                </div>
                <textarea
                  rows={2}
                  value={step.instruction}
                  onChange={(e) => {
                    const newSteps = [...steps];
                    newSteps[index].instruction = e.target.value;
                    setSteps(newSteps);
                  }}
                  className="input flex-1 resize-none"
                  placeholder="Instruction..."
                />
                <button
                  type="button"
                  onClick={() => setSteps(steps.filter((_, i) => i !== index))}
                  className="p-2 rounded-lg hover:bg-error-50"
                >
                  <Trash2 className="w-4 h-4 text-error-500" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Paramètres</h2>
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="w-5 h-5 rounded border-neutral-300"
              />
              <span className="text-neutral-700">Publier</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-5 h-5 rounded border-neutral-300"
              />
              <span className="text-neutral-700">Mettre en vedette</span>
            </label>
          </div>
        </div>

        {/* Nutri-Score Preview */}
        {nutriScore && (
          <div className="card p-6 bg-gradient-to-br from-neutral-50 to-neutral-100">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Nutri-Score calculé</h2>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold text-white ${nutriScore === 'A' ? 'bg-success-500' : nutriScore === 'B' ? 'bg-success-300' : nutriScore === 'C' ? 'bg-warning-400' : nutriScore === 'D' ? 'bg-orange-400' : 'bg-error-500'}`}>
                {nutriScore}
              </div>
              <p className="text-sm text-neutral-600">
                Ce score est calculé automatiquement en fonction des valeurs nutritionnelles.
              </p>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/admin/recipes')} className="btn-outline">
            Annuler
          </button>
          <button type="submit" className="btn-primary gap-2" disabled={saving}>
            <Save className="w-5 h-5" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
