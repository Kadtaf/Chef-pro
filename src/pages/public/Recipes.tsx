import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Tables } from '../../lib/supabase';
import { Clock, Users, Flame, Search, Filter, X } from 'lucide-react';

export default function Recipes() {
  const [recipes, setRecipes] = useState<Tables<'recipes'>[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Tables<'recipes'>[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchRecipes = async () => {
      const { data } = await supabase
        .from('recipes')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (data) {
        setRecipes(data);
        setFilteredRecipes(data);
        const cats = [...new Set(data.map((r) => r.category))];
        setCategories(cats);
      }
    };
    fetchRecipes();
  }, []);

  useEffect(() => {
    let result = recipes;
    if (search) {
      result = result.filter((r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (selectedCategory !== 'all') {
      result = result.filter((r) => r.category === selectedCategory);
    }
    if (selectedSeason !== 'all') {
      result = result.filter((r) => r.season === selectedSeason || r.season === 'all');
    }
    setFilteredRecipes(result);
  }, [search, selectedCategory, selectedSeason, recipes]);

  const getNutriScoreClass = (score: string | null) => {
    switch (score) {
      case 'A': return 'bg-success-500 text-white';
      case 'B': return 'bg-success-300 text-neutral-800';
      case 'C': return 'bg-warning-400 text-neutral-800';
      case 'D': return 'bg-orange-400 text-white';
      case 'E': return 'bg-error-500 text-white';
      default: return 'bg-neutral-300 text-neutral-700';
    }
  };

  const seasons = [
    { value: 'all', label: 'Toutes saisons' },
    { value: 'printemps', label: 'Printemps' },
    { value: 'ete', label: 'Été' },
    { value: 'automne', label: 'Automne' },
    { value: 'hiver', label: 'Hiver' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative py-24 bg-gradient-to-br from-neutral-900 to-neutral-800">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
            Recettes
          </h1>
          <p className="text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto">
            Découvrez mes créations culinaires avec valeurs nutritionnelles détaillées
          </p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="py-8 bg-white border-b border-neutral-200 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Rechercher une recette..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-12"
              />
            </div>

            {/* Toggle Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'} md:hidden`}
            >
              <Filter className="w-4 h-4" />
              Filtres
            </button>

            {/* Desktop Filters */}
            <div className="hidden md:flex gap-3 items-center">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input py-2 w-auto"
              >
                <option value="all">Toutes catégories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="input py-2 w-auto"
              >
                {seasons.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {(selectedCategory !== 'all' || selectedSeason !== 'all' || search) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('all');
                    setSelectedSeason('all');
                  }}
                  className="btn-ghost text-sm"
                >
                  <X className="w-4 h-4" />
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="mt-4 flex flex-col gap-3 md:hidden">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input"
              >
                <option value="all">Toutes catégories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="input"
              >
                {seasons.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      {/* Recipes Grid */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredRecipes.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-neutral-500">Aucune recette trouvée</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredRecipes.map((recipe) => (
                <Link
                  key={recipe.id}
                  to={`/recettes/${recipe.slug}`}
                  className="card-hover group"
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={recipe.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600'}
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {recipe.is_featured && (
                      <div className="absolute top-3 left-3">
                        <span className="badge bg-accent-500 text-white">Vedette</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="badge-primary">{recipe.category}</span>
                      {recipe.nutri_score && (
                        <span className={`badge ${getNutriScoreClass(recipe.nutri_score)}`}>
                          {recipe.nutri_score}
                        </span>
                      )}
                      {recipe.season && recipe.season !== 'all' && (
                        <span className="badge bg-neutral-100 text-neutral-600 capitalize">{recipe.season}</span>
                      )}
                    </div>
                    <h3 className="text-xl font-display font-semibold text-neutral-900 mb-2 line-clamp-1">
                      {recipe.title}
                    </h3>
                    <p className="text-sm text-neutral-600 mb-4 line-clamp-2">{recipe.description}</p>
                    <div className="flex items-center gap-4 text-sm text-neutral-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{recipe.prep_time + recipe.cook_time} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{recipe.servings}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Flame className="w-4 h-4" />
                        <span>{recipe.calories_per_serving} kcal</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
