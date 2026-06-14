import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, Tables } from '../../lib/supabase';
import { slugify, SEASONS } from '../../lib/utils';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';

export default function MenuEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [recipes, setRecipes] = useState<Tables<'recipes'>[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    category: 'gastronomique',
    season: 'all',
    price: 0,
    image_url: '',
    is_published: false,
    is_balanced: false,
  });

  const [items, setItems] = useState<{
    item_type: string; recipe_id: string | null; custom_title: string; custom_description: string; position: number;
  }[]>([]);

  useEffect(() => {
    supabase.from('recipes').select('*').eq('is_published', true).then(({ data }) => { if (data) setRecipes(data); });
    if (isEdit && id) fetchMenu();
  }, [id]);

  useEffect(() => { setFormData(prev => ({ ...prev, slug: slugify(prev.title) })); }, [formData.title]);

  const fetchMenu = async () => {
    setLoading(true);
    const { data: menu } = await supabase.from('menus').select('*').eq('id', id).single();
    const { data: menuItems } = await supabase.from('menu_items').select('*').eq('menu_id', id).order('position');

    if (menu) {
      setFormData({
        title: menu.title, slug: menu.slug, description: menu.description || '', category: menu.category || 'gastronomique',
        season: menu.season || 'all', price: menu.price, image_url: menu.image_url || '', is_published: menu.is_published, is_balanced: menu.is_balanced,
      });
    }
    if (menuItems) setItems(menuItems.map(i => ({ item_type: i.item_type || 'plat', recipe_id: i.recipe_id, custom_title: i.custom_title || '', custom_description: i.custom_description || '', position: i.position })));
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const menuData = { ...formData, total_calories: 0, avg_nutri_score: null };

    let menuId = id;
    if (isEdit) {
      await supabase.from('menus').update(menuData).eq('id', id);
    } else {
      const { data: newMenu } = await supabase.from('menus').insert(menuData).select('id').single();
      menuId = newMenu?.id;
    }

    if (menuId) {
      await supabase.from('menu_items').delete().eq('menu_id', menuId);
      if (items.length > 0) {
        await supabase.from('menu_items').insert(items.map((item, index) => ({ ...item, position: index + 1, menu_id: menuId })));
      }
    }

    setSaving(false);
    navigate('/admin/menus');
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/menus')} className="btn-ghost"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-display font-bold text-neutral-900">{isEdit ? 'Modifier le menu' : 'Nouveau menu'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Informations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="label">Titre *</label><input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="input" /></div>
            <div><label className="label">Catégorie</label><select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="input">
              <option value="gastronomique">Gastronomique</option><option value="business">Business</option><option value="evenementiel">Événementiel</option><option value="du_jour">Du jour</option><option value="saisonnier">Saisonnier</option>
            </select></div>
            <div className="md:col-span-2"><label className="label">Description</label><textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input resize-none" /></div>
            <div><label className="label">Saison</label><select value={formData.season} onChange={e => setFormData({ ...formData, season: e.target.value })} className="input">
              {SEASONS.map(s => <option key={s} value={s}>{s === 'all' ? 'Toutes saisons' : s}</option>)}
            </select></div>
            <div><label className="label">Prix</label><input type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} className="input" /></div>
            <div className="md:col-span-2"><label className="label">Image URL</label><input type="url" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} className="input" /></div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Contenu du menu</h2>
            <button type="button" onClick={() => setItems([...items, { item_type: 'plat', recipe_id: null, custom_title: '', custom_description: '', position: items.length + 1 }])} className="btn-ghost text-sm"><Plus className="w-4 h-4" /> Ajouter</button>
          </div>
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="p-4 bg-neutral-50 rounded-lg">
                <div className="grid grid-cols-4 gap-4 mb-3">
                  <select value={item.item_type} onChange={e => { const newItems = [...items]; newItems[idx].item_type = e.target.value; setItems(newItems); }} className="input">
                    <option value="entree">Entrée</option><option value="plat">Plat</option><option value="dessert">Dessert</option><option value="accompagnement">Accompagnement</option><option value="boisson">Boisson</option>
                  </select>
                  <select value={item.recipe_id || ''} onChange={e => { const newItems = [...items]; newItems[idx].recipe_id = e.target.value || null; setItems(newItems); }} className="input col-span-3">
                    <option value="">-- Recherche ou personnalisé --</option>
                    {recipes.filter(r => r.category.toLowerCase().includes(item.item_type)).map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                  </select>
                </div>
                {!item.recipe_id && (
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Titre personnalisé" value={item.custom_title} onChange={e => { const newItems = [...items]; newItems[idx].custom_title = e.target.value; setItems(newItems); }} className="input" />
                    <input type="text" placeholder="Description" value={item.custom_description} onChange={e => { const newItems = [...items]; newItems[idx].custom_description = e.target.value; setItems(newItems); }} className="input" />
                  </div>
                )}
                <div className="flex justify-end mt-2">
                  <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-sm text-error-500 hover:text-error-600">Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Paramètres</h2>
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3"><input type="checkbox" checked={formData.is_published} onChange={e => setFormData({ ...formData, is_published: e.target.checked })} className="w-5 h-5 rounded border-neutral-300" /><span className="text-neutral-700">Publier</span></label>
            <label className="flex items-center gap-3"><input type="checkbox" checked={formData.is_balanced} onChange={e => setFormData({ ...formData, is_balanced: e.target.checked })} className="w-5 h-5 rounded border-neutral-300" /><span className="text-neutral-700">Menu équilibré</span></label>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/admin/menus')} className="btn-outline">Annuler</button>
          <button type="submit" className="btn-primary gap-2" disabled={saving}><Save className="w-5 h-5" />{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
        </div>
      </form>
    </div>
  );
}
