import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Tables } from '../../lib/supabase';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Star } from 'lucide-react';
import { formatCurrency, formatDate, getNutriScoreClass } from '../../lib/utils';

export default function Recipes() {
  const [recipes, setRecipes] = useState<Tables<'recipes'>[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Tables<'recipes'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [published, setPublished] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    fetchRecipes();
  }, []);

  useEffect(() => {
    let result = recipes;
    if (search) {
      result = result.filter((r) =>
        r.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (category !== 'all') {
      result = result.filter((r) => r.category === category);
    }
    if (published !== 'all') {
      result = result.filter((r) =>
        published === 'published' ? r.is_published : !r.is_published
      );
    }
    setFilteredRecipes(result);
  }, [search, category, published, recipes]);

  const fetchRecipes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setRecipes(data);
      setFilteredRecipes(data);
    }
    setLoading(false);
  };

  const togglePublished = async (recipe: Tables<'recipes'>) => {
    await supabase
      .from('recipes')
      .update({ is_published: !recipe.is_published })
      .eq('id', recipe.id);
    fetchRecipes();
  };

  const toggleFeatured = async (recipe: Tables<'recipes'>) => {
    await supabase
      .from('recipes')
      .update({ is_featured: !recipe.is_featured })
      .eq('id', recipe.id);
    fetchRecipes();
  };

  const deleteRecipe = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette recette ?')) {
      await supabase.from('recipes').delete().eq('id', id);
      fetchRecipes();
    }
  };

  const categories = [...new Set(recipes.map((r) => r.category))];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Recettes</h1>
          <p className="text-neutral-500">{recipes.length} recettes</p>
        </div>
        <Link to="/admin/recipes/new" className="btn-primary gap-2">
          <Plus className="w-5 h-5" />
          Nouvelle recette
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input w-full md:w-auto"
          >
            <option value="all">Toutes catégories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={published}
            onChange={(e) => setPublished(e.target.value as typeof published)}
            className="input w-full md:w-auto"
          >
            <option value="all">Tous</option>
            <option value="published">Publiés</option>
            <option value="draft">Brouillons</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Recette</th>
              <th>Catégorie</th>
              <th>Temps</th>
              <th>Calories</th>
              <th>Nutri-Score</th>
              <th>Statut</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-neutral-500">
                  Chargement...
                </td>
              </tr>
            ) : filteredRecipes.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-neutral-500">
                  Aucune recette trouvée
                </td>
              </tr>
            ) : (
              filteredRecipes.map((recipe) => (
                <tr key={recipe.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <img
                        src={recipe.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=100'}
                        alt={recipe.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium text-neutral-900">{recipe.title}</p>
                        <p className="text-xs text-neutral-500">{recipe.servings} portions</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-primary">{recipe.category}</span>
                  </td>
                  <td className="text-neutral-600">
                    {recipe.prep_time + recipe.cook_time} min
                  </td>
                  <td className="text-neutral-600">
                    {recipe.calories_per_serving} kcal
                  </td>
                  <td>
                    {recipe.nutri_score ? (
                      <span className={`badge ${getNutriScoreClass(recipe.nutri_score)}`}>
                        {recipe.nutri_score}
                      </span>
                    ) : (
                      <span className="text-neutral-400">-</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {recipe.is_published ? (
                        <span className="badge badge-success">Publié</span>
                      ) : (
                        <span className="badge bg-neutral-100 text-neutral-600">Brouillon</span>
                      )}
                      {recipe.is_featured && (
                        <Star className="w-4 h-4 fill-accent-400 text-accent-400" />
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleFeatured(recipe)}
                        className="p-2 rounded-lg hover:bg-neutral-100"
                        title={recipe.is_featured ? 'Retirer vedette' : 'Mettre en vedette'}
                      >
                        <Star className={`w-4 h-4 ${recipe.is_featured ? 'fill-accent-400 text-accent-400' : 'text-neutral-400'}`} />
                      </button>
                      <button
                        onClick={() => togglePublished(recipe)}
                        className="p-2 rounded-lg hover:bg-neutral-100"
                        title={recipe.is_published ? 'Dépublier' : 'Publier'}
                      >
                        {recipe.is_published ? (
                          <EyeOff className="w-4 h-4 text-neutral-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-neutral-400" />
                        )}
                      </button>
                      <Link
                        to={`/admin/recipes/${recipe.id}/edit`}
                        className="p-2 rounded-lg hover:bg-neutral-100"
                      >
                        <Edit className="w-4 h-4 text-neutral-400" />
                      </Link>
                      <button
                        onClick={() => deleteRecipe(recipe.id)}
                        className="p-2 rounded-lg hover:bg-error-50"
                      >
                        <Trash2 className="w-4 h-4 text-error-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
