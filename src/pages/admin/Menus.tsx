import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Tables } from '../../lib/supabase';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Menu } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export default function Menus() {
  const [menus, setMenus] = useState<Tables<'menus'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchMenus(); }, []);

  const fetchMenus = async () => {
    const { data } = await supabase.from('menus').select('*').order('created_at', { ascending: false });
    if (data) setMenus(data);
    setLoading(false);
  };

  const togglePublished = async (menu: Tables<'menus'>) => {
    await supabase.from('menus').update({ is_published: !menu.is_published }).eq('id', menu.id);
    fetchMenus();
  };

  const deleteMenu = async (id: string) => {
    if (confirm('Supprimer ce menu ?')) {
      await supabase.from('menus').delete().eq('id', id);
      fetchMenus();
    }
  };

  const filteredMenus = menus.filter(m => m.title.toLowerCase().includes(search.toLowerCase()));

  const getSeasonBadge = (season: string) => {
    const colors: Record<string, string> = { printemps: 'bg-green-100 text-green-700', ete: 'bg-yellow-100 text-yellow-700', automne: 'bg-orange-100 text-orange-700', hiver: 'bg-blue-100 text-blue-700', all: 'bg-neutral-100 text-neutral-600' };
    return colors[season] || 'bg-neutral-100 text-neutral-600';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Menus</h1>
          <p className="text-neutral-500">{menus.length} menus</p>
        </div>
        <Link to="/admin/menus/new" className="btn-primary gap-2"><Plus className="w-5 h-5" /> Nouveau menu</Link>
      </div>

      <div className="card p-4">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <div className="col-span-full text-center py-8 text-neutral-500">Chargement...</div> :
          filteredMenus.length === 0 ? <div className="col-span-full text-center py-8 text-neutral-500">Aucun menu</div> :
          filteredMenus.map(menu => (
            <div key={menu.id} className="card-hover overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-secondary-100 to-accent-100 flex items-center justify-center">
                {menu.image_url ? <img src={menu.image_url} alt={menu.title} className="w-full h-full object-cover" /> : <Menu className="w-16 h-16 text-secondary-300" />}
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="badge badge-primary">{menu.category}</span>
                  <span className={`badge ${getSeasonBadge(menu.season || 'all')}`}>{menu.season === 'all' ? 'Toutes saisons' : menu.season}</span>
                  {menu.is_balanced && <span className="badge badge-success">Équilibré</span>}
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">{menu.title}</h3>
                <p className="text-sm text-neutral-500 mb-4 line-clamp-2">{menu.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-primary-600">{menu.price > 0 ? formatCurrency(menu.price) : 'Gratuit'}</span>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${menu.is_published ? 'badge-success' : 'bg-neutral-100 text-neutral-600'}`}>{menu.is_published ? 'Publié' : 'Brouillon'}</span>
                    <button onClick={() => togglePublished(menu)} className="p-2 rounded-lg hover:bg-neutral-100">{menu.is_published ? <EyeOff className="w-4 h-4 text-neutral-400" /> : <Eye className="w-4 h-4 text-neutral-400" />}</button>
                    <Link to={`/admin/menus/${menu.id}/edit`} className="p-2 rounded-lg hover:bg-neutral-100"><Edit className="w-4 h-4 text-neutral-400" /></Link>
                    <button onClick={() => deleteMenu(menu.id)} className="p-2 rounded-lg hover:bg-error-50"><Trash2 className="w-4 h-4 text-error-500" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
