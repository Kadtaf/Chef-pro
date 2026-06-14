import { useEffect, useState } from 'react';
import { supabase, Tables } from '../../lib/supabase';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Star, FolderOpen } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export default function PortfolioAdmin() {
  const [items, setItems] = useState<Tables<'portfolio_items'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Tables<'portfolio_items'> | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Restaurant',
    image_url: '',
    client_name: '',
    project_date: '',
    is_featured: false,
    is_published: true,
  });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from('portfolio_items').select('*').order('position');
    if (data) setItems(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editItem) {
      await supabase.from('portfolio_items').update(formData).eq('id', editItem.id);
    } else {
      await supabase.from('portfolio_items').insert({ ...formData, position: items.length + 1 });
    }
    setShowModal(false);
    setEditItem(null);
    setFormData({ title: '', description: '', category: 'Restaurant', image_url: '', client_name: '', project_date: '', is_featured: false, is_published: true });
    fetchItems();
  };

  const togglePublished = async (item: Tables<'portfolio_items'>) => {
    await supabase.from('portfolio_items').update({ is_published: !item.is_published }).eq('id', item.id);
    fetchItems();
  };

  const toggleFeatured = async (item: Tables<'portfolio_items'>) => {
    await supabase.from('portfolio_items').update({ is_featured: !item.is_featured }).eq('id', item.id);
    fetchItems();
  };

  const deleteItem = async (id: string) => {
    if (confirm('Supprimer ce projet ?')) {
      await supabase.from('portfolio_items').delete().eq('id', id);
      fetchItems();
    }
  };

  const openEdit = (item: Tables<'portfolio_items'>) => {
    setEditItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      category: item.category,
      image_url: item.image_url || '',
      client_name: item.client_name || '',
      project_date: item.project_date || '',
      is_featured: item.is_featured,
      is_published: item.is_published,
    });
    setShowModal(true);
  };

  const filteredItems = items.filter(i => i.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Portfolio</h1>
          <p className="text-neutral-500">{items.length} projets</p>
        </div>
        <button onClick={() => { setEditItem(null); setFormData({ title: '', description: '', category: 'Restaurant', image_url: '', client_name: '', project_date: '', is_featured: false, is_published: true }); setShowModal(true); }} className="btn-primary gap-2"><Plus className="w-5 h-5" /> Nouveau projet</button>
      </div>

      <div className="card p-4">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <div className="col-span-full text-center py-8 text-neutral-500">Chargement...</div> :
          filteredItems.map(item => (
            <div key={item.id} className="card overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                {item.image_url ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" /> : <FolderOpen className="w-16 h-16 text-primary-300" />}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="badge badge-primary">{item.category}</span>
                  {item.is_featured && <Star className="w-4 h-4 fill-accent-400 text-accent-400" />}
                </div>
                <h3 className="font-semibold text-neutral-900 mb-1">{item.title}</h3>
                <p className="text-sm text-neutral-500 mb-3">{item.client_name}</p>
                <div className="flex justify-between items-center">
                  <span className={`badge ${item.is_published ? 'badge-success' : 'bg-neutral-100 text-neutral-600'}`}>{item.is_published ? 'Publié' : 'Brouillon'}</span>
                  <div className="flex gap-1">
                    <button onClick={() => toggleFeatured(item)} className="p-2 rounded-lg hover:bg-neutral-100"><Star className={`w-4 h-4 ${item.is_featured ? 'fill-accent-400 text-accent-400' : 'text-neutral-400'}`} /></button>
                    <button onClick={() => togglePublished(item)} className="p-2 rounded-lg hover:bg-neutral-100">{item.is_published ? <EyeOff className="w-4 h-4 text-neutral-400" /> : <Eye className="w-4 h-4 text-neutral-400" />}</button>
                    <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-neutral-100"><Edit className="w-4 h-4 text-neutral-400" /></button>
                    <button onClick={() => deleteItem(item.id)} className="p-2 rounded-lg hover:bg-error-50"><Trash2 className="w-4 h-4 text-error-500" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))
        }
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-100"><h2 className="text-lg font-semibold">{editItem ? 'Modifier le projet' : 'Nouveau projet'}</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="label">Titre *</label><input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="input" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Catégorie</label><input type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="input" /></div>
                <div><label className="label">Client</label><input type="text" value={formData.client_name} onChange={e => setFormData({ ...formData, client_name: e.target.value })} className="input" /></div>
              </div>
              <div><label className="label">Description</label><textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input resize-none" /></div>
              <div><label className="label">Image URL</label><input type="url" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} className="input" /></div>
              <div><label className="label">Date du projet</label><input type="date" value={formData.project_date} onChange={e => setFormData({ ...formData, project_date: e.target.value })} className="input" /></div>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3"><input type="checkbox" checked={formData.is_published} onChange={e => setFormData({ ...formData, is_published: e.target.checked })} className="w-5 h-5 rounded" /><span>Publié</span></label>
                <label className="flex items-center gap-3"><input type="checkbox" checked={formData.is_featured} onChange={e => setFormData({ ...formData, is_featured: e.target.checked })} className="w-5 h-5 rounded" /><span>Mettre en vedette</span></label>
              </div>
              <div className="flex gap-4 pt-4"><button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Annuler</button><button type="submit" className="btn-primary flex-1">Enregistrer</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
