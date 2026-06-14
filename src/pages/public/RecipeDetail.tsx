import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, Tables } from '../../lib/supabase';
import { Clock, Users, Flame, ChefHat, ArrowLeft, Printer } from 'lucide-react';
import { formatDate, formatDuration, formatCurrency, getNutriScoreClass } from '../../lib/utils';

export default function RecipeDetail() {
  const { slug } = useParams();
  const [recipe, setRecipe] = useState<Tables<'recipes'> | null>(null);
  const [ingredients, setIngredients] = useState<Tables<'recipe_ingredients'>[]>([]);
  const [steps, setSteps] = useState<Tables<'recipe_steps'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = async () => {
      setLoading(true);
      const { data: recipeData } = await supabase
        .from('recipes')
        .select('*')
        .eq('slug', slug)
        .single();

      if (recipeData) {
        setRecipe(recipeData);
        const [ingredientsRes, stepsRes] = await Promise.all([
          supabase.from('recipe_ingredients').select('*').eq('recipe_id', recipeData.id),
          supabase.from('recipe_steps').select('*').eq('recipe_id', recipeData.id).order('step_number'),
        ]);
        if (ingredientsRes.data) setIngredients(ingredientsRes.data);
        if (stepsRes.data) setSteps(stepsRes.data);
      }
      setLoading(false);
    };
    fetchRecipe();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50">
        <h1 className="text-2xl font-display font-bold text-neutral-900 mb-4">Recette non trouvée</h1>
        <Link to="/recettes" className="btn-primary">Retour aux recettes</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px]">
        <img
          src={recipe.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200'}
          alt={recipe.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/90 via-neutral-900/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-4xl mx-auto">
            <Link
              to="/recettes"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux recettes
            </Link>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="badge bg-white/20 backdrop-blur text-white">{recipe.category}</span>
              {recipe.nutri_score && (
                <span className={`badge ${getNutriScoreClass(recipe.nutri_score)}`}>Nutri-Score {recipe.nutri_score}</span>
              )}
              {recipe.season && recipe.season !== 'all' && (
                <span className="badge bg-white/20 backdrop-blur text-white capitalize">{recipe.season}</span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">{recipe.title}</h1>
            <p className="text-lg text-white/80 max-w-2xl">{recipe.description}</p>
          </div>
        </div>
      </section>

      {/* Info Bar */}
      <section className="bg-white border-b border-neutral-200 py-6 sticky top-20 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-6 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-600" />
                <div>
                  <span className="text-neutral-400">Prép.:</span> {formatDuration(recipe.prep_time)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary-600" />
                <div>
                  <span className="text-neutral-400">Cuisson:</span> {formatDuration(recipe.cook_time)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                <div>{recipe.servings} portions</div>
              </div>
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-primary-600" />
                <div className="capitalize">{recipe.difficulty}</div>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="btn-outline text-sm hidden md:flex"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Ingredients */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-36">
                <h2 className="text-xl font-display font-semibold text-neutral-900 mb-6">Ingrédients</h2>
                <ul className="space-y-3">
                  {ingredients.length > 0 ? (
                    ingredients.map((ing) => (
                      <li key={ing.id} className="flex justify-between items-start text-sm">
                        <span className="text-neutral-700">{ing.name}</span>
                        <span className="text-neutral-500 flex-shrink-0 ml-4">
                          {ing.quantity} {ing.unit}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-neutral-500">Ingrédients non spécifiés</li>
                  )}
                </ul>
                {recipe.cost_per_serving > 0 && (
                  <div className="mt-6 pt-6 border-t border-neutral-100">
                    <p className="text-sm text-neutral-600">
                      <span className="font-medium">Coût estimé:</span>{' '}
                      {formatCurrency(recipe.cost_per_serving)}/portion
                    </p>
                  </div>
                )}
                {ingredients.some((i) => i.allergens && i.allergens.length > 0) && (
                  <div className="mt-6 pt-6 border-t border-neutral-100">
                    <p className="text-sm font-medium text-neutral-700 mb-2">Allergènes:</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(ingredients.flatMap((i) => i.allergens || []))).map((a) => (
                        <span key={a} className="badge badge-warning">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Steps */}
            <div className="lg:col-span-2">
              <div className="card p-8">
                <h2 className="text-xl font-display font-semibold text-neutral-900 mb-8">Préparation</h2>
                {steps.length > 0 ? (
                  <ol className="space-y-8">
                    {steps.map((step) => (
                      <li key={step.id} className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                          {step.step_number}
                        </div>
                        <div className="flex-1 pt-2">
                          <p className="text-neutral-700 leading-relaxed">{step.instruction}</p>
                          {step.image_url && (
                            <img
                              src={step.image_url}
                              alt={`Étape ${step.step_number}`}
                              className="mt-4 rounded-lg max-h-64 object-cover"
                            />
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-neutral-500">Instructions non spécifiées</p>
                )}
              </div>

              {/* Nutrition */}
              <div className="card p-8 mt-8">
                <h2 className="text-xl font-display font-semibold text-neutral-900 mb-6">
                  Valeurs nutritionnelles
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 rounded-lg bg-neutral-50">
                    <div className="text-2xl font-display font-bold text-primary-600">
                      {recipe.calories_per_serving}
                    </div>
                    <div className="text-sm text-neutral-500">kcal/portion</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-neutral-50">
                    <div className="text-2xl font-display font-bold text-primary-600">
                      {recipe.proteines}g
                    </div>
                    <div className="text-sm text-neutral-500">Protéines</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-neutral-50">
                    <div className="text-2xl font-display font-bold text-primary-600">
                      {recipe.glucides}g
                    </div>
                    <div className="text-sm text-neutral-500">Glucides</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-neutral-50">
                    <div className="text-2xl font-display font-bold text-primary-600">
                      {recipe.lipides}g
                    </div>
                    <div className="text-sm text-neutral-500">Lipides</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-neutral-50">
                    <div className="text-2xl font-display font-bold text-primary-600">
                      {recipe.fibres}g
                    </div>
                    <div className="text-sm text-neutral-500">Fibres</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-neutral-50">
                    <div className="text-2xl font-display font-bold text-primary-600">
                      {recipe.sel}g
                    </div>
                    <div className="text-sm text-neutral-500">Sel</div>
                  </div>
                </div>
                <p className="text-xs text-neutral-400 mt-4">
                  * Valeurs approximatives par portion
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
