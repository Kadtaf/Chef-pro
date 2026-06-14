import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Tables } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';

export default function Portfolio() {
  const [items, setItems] = useState<Tables<'portfolio_items'>[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchPortfolio = async () => {
      const { data } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('is_published', true)
        .order('position');
      if (data) {
        setItems(data);
        const cats = [...new Set(data.map((item) => item.category))];
        setCategories(cats);
      }
    };
    fetchPortfolio();
  }, []);

  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter((item) => item.category === selectedCategory);

  const defaultItems = [
    {
      id: '1',
      title: 'Restaurant Gastronomique - Bordeaux',
      description: 'Refonte complète de la carte et formation de la brigade',
      category: 'Restaurant',
      image_url: 'https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg?auto=compress&cs=tinysrgb&w=800',
      client_name: 'Restaurant Le Saint-Jacques',
      project_date: '2024-01-15',
      is_featured: true,
      is_published: true,
      position: 1,
      created_at: '',
      updated_at: '',
    },
    {
      id: '2',
      title: 'Mariage Château - Saint-Émilion',
      description: 'Service gastronomique pour 200 convives',
      category: 'Événementiel',
      image_url: 'https://images.pexels.com/photos/2291462/pexels-photo-2291462.jpeg?auto=compress&cs=tinysrgb&w=800',
      client_name: 'Famille Dubois',
      project_date: '2024-03-20',
      is_featured: true,
      is_published: true,
      position: 2,
      created_at: '',
      updated_at: '',
    },
    {
      id: '3',
      title: 'Consulting Traiteur Premium',
      description: 'Optimisation des coûts et création de nouvelles recettes',
      category: 'Consulting',
      image_url: 'https://images.pexels.com/photos/3184192/pexels-photo-3184192.jpeg?auto=compress&cs=tinysrgb&w=800',
      client_name: 'Traiteurs de France',
      project_date: '2024-02-10',
      is_featured: false,
      is_published: true,
      position: 3,
      created_at: '',
      updated_at: '',
    },
    {
      id: '4',
      title: 'Formation Équipe - Hôtel 5 étoiles',
      description: 'Formation aux techniques gastronomiques modernes',
      category: 'Formation',
      image_url: 'https://images.pexels.com/photos/3184189/pexels-photo-3184189.jpeg?auto=compress&cs=tinysrgb&w=800',
      client_name: 'Hôtel de Sèze',
      project_date: '2024-04-05',
      is_featured: false,
      is_published: true,
      position: 4,
      created_at: '',
      updated_at: '',
    },
    {
      id: '5',
      title: 'Ouverture Restaurant - Arcachon',
      description: 'Accompagnement complet pour l\'ouverture',
      category: 'Restaurant',
      image_url: 'https://images.pexels.com/photos/674881/pexels-photo-674881.jpeg?auto=compress&cs=tinysrgb&w=800',
      client_name: 'La Cabane du Port',
      project_date: '2023-12-01',
      is_featured: true,
      is_published: true,
      position: 5,
      created_at: '',
      updated_at: '',
    },
    {
      id: '6',
      title: 'Menu de Noël Entreprise',
      description: 'Création d\'un menu festif pour 100 personnes',
      category: 'Événementiel',
      image_url: 'https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=800',
      client_name: 'Total Energies Bordeaux',
      project_date: '2023-12-22',
      is_featured: false,
      is_published: true,
      position: 6,
      created_at: '',
      updated_at: '',
    },
  ];

  const displayItems = items.length > 0 ? items : defaultItems;

  const displayCategories = categories.length > 0 ? categories : ['Restaurant', 'Événementiel', 'Consulting', 'Formation'];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative py-24 bg-gradient-to-br from-neutral-900 to-neutral-800">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
            Portfolio
          </h1>
          <p className="text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto">
            Découvrez mes réalisations et projets culinaires
          </p>
        </div>
      </section>

      {/* Filter */}
      <section className="py-8 bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Tous
            </button>
            {displayCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayItems.map((item, index) => (
              <div
                key={item.id}
                className="card-hover group overflow-hidden"
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={item.image_url || 'https://images.pexels.com/photos/3184192/pexels-photo-3184192.jpeg?auto=compress&cs=tinysrgb&w=800'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="badge-primary">{item.category}</span>
                    {item.is_featured && (
                      <span className="badge bg-accent-100 text-accent-700">Vedette</span>
                    )}
                  </div>
                  <h3 className="text-xl font-display font-semibold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-neutral-600 mb-4 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between text-sm text-neutral-500">
                    <span>{item.client_name}</span>
                    {item.project_date && (
                      <span>{formatDate(item.project_date, { month: 'short' })}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="section-title mb-6">Votre projet ici ?</h2>
          <p className="section-subtitle mx-auto mb-10">
            Discutons de votre projet et ajoutons-le à mon portfolio
          </p>
          <Link to="/contact" className="btn-primary gap-2">
            Me contacter
          </Link>
        </div>
      </section>
    </div>
  );
}
