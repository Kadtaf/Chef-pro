import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { slugify } from '../../lib/utils';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';

export default function CardEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    category: 'restaurant',
    image_url: '',
    is_published: false,
    is_balanced: false,
  });

  const [sections, setSections] = useState<{ title: string; description: string; position: number }[]>([]);

  useEffect(() => {
    if (isEdit && id) fetchCard();
  }, [id]);

  useEffect(() => { setFormData(prev => ({ ...prev, slug: slugify(prev.title) })); }, [formData.title]);

  const fetchCard = async () => {
    setLoading(true);
    const { data: card } = await supabase.from('cards').select('*').eq('id', id).single();
    const { data: cardSections } = await supabase.from('card_sections').select('*').eq('card_id', id).order('position');

    if (card) {
      setFormData({
        title: card.title, slug: card.slug, description: card.description || '', category: card.category || 'restaurant',
        image_url: card.image_url || '', is_published: card.is_published, is_balanced: card.is_balanced,
      });
    }
    if (cardSections) setSections(cardSections.map(s => ({ title: s.title, description: s.description || '', position: s.position })));
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let cardId = id;
    if (isEdit) {
      await supabase.from('cards').update(formData).eq('id', id);
    } else {
      const { data: newCard } = await supabase.from('cards').insert(formData).select('id').single();
      cardId = newCard?.id;
    }

    if (cardId) {
      await supabase.from('card_sections').delete().eq('card_id', cardId);
      if (sections.length > 0) {
        await supabase.from('card_sections').insert(sections.map((section, index) => ({ ...section, position: index + 1, card_id: cardId })));
      }
    }

    setSaving(false);
    navigate('/admin/cards');
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/cards')} className="btn-ghost"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-display font-bold text-neutral-900">{isEdit ? 'Modifier la carte' : 'Nouvelle carte'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Informations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="label">Titre *</label><input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="input" /></div>
            <div><label className="label">Catégorie</label><select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="input">
              <option value="restaurant">Restaurant</option><option value="traiteur">Traiteur</option><option value="evenement">Événement</option><option value="saisonniere">Saisonnière</option>
            </select></div>
            <div className="md:col-span-2"><label className="label">Description</label><textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input resize-none" /></div>
            <div className="md:col-span-2"><label className="label">Image URL</label><input type="url" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} className="input" /></div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Sections</h2>
            <button type="button" onClick={() => setSections([...sections, { title: '', description: '', position: sections.length + 1 }])} className="btn-ghost text-sm"><Plus className="w-4 h-4" /> Ajouter</button>
          </div>
          <div className="space-y-4">
            {sections.map((section, idx) => (
              <div key={idx} className="p-4 bg-neutral-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <input type="text" placeholder="Titre de la section" value={section.title} onChange={e => { const newSections = [...sections]; newSections[idx].title = e.target.value; setSections(newSections); }} className="input" />
                  <input type="text" placeholder="Description" value={section.description} onChange={e => { const newSections = [...sections]; newSections[idx].description = e.target.value; setSections(newSections); }} className="input" />
                </div>
                <button type="button" onClick={() => setSections(sections.filter((_, i) => i !== idx))} className="text-sm text-error-500 hover:text-error-600">Supprimer</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Paramètres</h2>
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3"><input type="checkbox" checked={formData.is_published} onChange={e => setFormData({ ...formData, is_published: e.target.checked })} className="w-5 h-5 rounded border-neutral-300" /><span className="text-neutral-700">Publier</span></label>
            <label className="flex items-center gap-3"><input type="checkbox" checked={formData.is_balanced} onChange={e => setFormData({ ...formData, is_balanced: e.target.checked })} className="w-5 h-5 rounded border-neutral-300" /><span className="text-neutral-700">Carte équilibrée</span></label>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/admin/cards')} className="btn-outline">Annuler</button>
          <button type="submit" className="btn-primary gap-2" disabled={saving}><Save className="w-5 h-5" />{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
        </div>
      </form>
    </div>
  );
}
