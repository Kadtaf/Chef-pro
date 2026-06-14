import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { slugify, calculateNutriScore, RECIPE_CATEGORIES } from '../../lib/utils';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';

export default function TechnicalSheetEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'Plat principal',
    description: '',
    image_url: '',
    total_cost: 0,
    selling_price: 0,
    margin_ratio: 2.5,
    portions: 1,
    is_published: false,
    preparation_time: 0,
    cooking_time: 0,
  });

  const [ingredients, setIngredients] = useState<{
    name: string; quantity: number; unit: string; cost: number; allergens: string[];
    calories: number; lipides: number; glucides: number; proteines: number;
  }[]>([]);

  const [steps, setSteps] = useState<{ step_number: number; instruction: string }[]>([]);

  useEffect(() => {
    if (isEdit && id) fetchSheet();
  }, [id]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, slug: slugify(prev.title) }));
  }, [formData.title]);

  useEffect(() => {
    const totalCost = ingredients.reduce((acc, i) => acc + i.cost, 0);
    setFormData(prev => ({
      ...prev,
      total_cost: totalCost,
      cost_per_portion: prev.portions > 0 ? totalCost / prev.portions : 0,
    }));
  }, [ingredients, formData.portions]);

  const fetchSheet = async () => {
    setLoading(true);
    const { data: sheet } = await supabase.from('technical_sheets').select('*').eq('id', id).single();
    const { data: ingredientsData } = await supabase.from('technical_sheet_ingredients').select('*').eq('technical_sheet_id', id);
    const { data: stepsData } = await supabase.from('technical_sheet_steps').select('*').eq('technical_sheet_id', id).order('step_number');

    if (sheet) {
      setFormData({
        title: sheet.title,
        slug: sheet.slug,
        category: sheet.category,
        description: sheet.description || '',
        image_url: sheet.image_url || '',
        total_cost: sheet.total_cost,
        selling_price: sheet.selling_price,
        margin_ratio: sheet.margin_ratio,
        portions: sheet.portions,
        is_published: sheet.is_published,
        preparation_time: sheet.preparation_time,
        cooking_time: sheet.cooking_time,
      });
    }

    if (ingredientsData) setIngredients(ingredientsData.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit, cost: i.cost, allergens: i.allergens || [], calories: i.calories, lipides: i.lipides, glucides: i.glucides, proteines: i.proteines })));
    if (stepsData) setSteps(stepsData.map(s => ({ step_number: s.step_number, instruction: s.instruction })));
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const totalCal = ingredients.reduce((acc, i) => acc + i.calories, 0);
    const totalLip = ingredients.reduce((acc, i) => acc + i.lipides, 0);
    const totalGlu = ingredients.reduce((acc, i) => acc + i.glucides, 0);
    const totalPro = ingredients.reduce((acc, i) => acc + i.proteines, 0);

    const sheetData = {
      ...formData,
      cost_per_portion: formData.portions > 0 ? formData.total_cost / formData.portions : 0,
      allergens: [...new Set(ingredients.flatMap(i => i.allergens))],
      calories_per_portion: formData.portions > 0 ? totalCal / formData.portions : 0,
      lipides: formData.portions > 0 ? totalLip / formData.portions : 0,
      glucides: formData.portions > 0 ? totalGlu / formData.portions : 0,
      proteines: formData.portions > 0 ? totalPro / formData.portions : 0,
      nutri_score: formData.portions > 0 ? calculateNutriScore(totalCal/formData.portions, totalLip/formData.portions, totalGlu/formData.portions, totalPro/formData.portions, 0, 0) : null,
    };

    let sheetId = id;
    if (isEdit) {
      await supabase.from('technical_sheets').update(sheetData).eq('id', id);
    } else {
      const { data: newSheet } = await supabase.from('technical_sheets').insert(sheetData).select('id').single();
      sheetId = newSheet?.id;
    }

    if (sheetId) {
      await supabase.from('technical_sheet_ingredients').delete().eq('technical_sheet_id', sheetId);
      await supabase.from('technical_sheet_steps').delete().eq('technical_sheet_id', sheetId);

      if (ingredients.length > 0) {
        await supabase.from('technical_sheet_ingredients').insert(ingredients.map(ing => ({ ...ing, technical_sheet_id: sheetId })));
      }
      if (steps.length > 0) {
        await supabase.from('technical_sheet_steps').insert(steps.map((step, index) => ({ ...step, step_number: index + 1, technical_sheet_id: sheetId })));
      }
    }

    setSaving(false);
    navigate('/admin/technical-sheets');
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/technical-sheets')} className="btn-ghost"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-display font-bold text-neutral-900">{isEdit ? 'Modifier la fiche' : 'Nouvelle fiche technique'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Informations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="label">Titre *</label><input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="input" /></div>
            <div><label className="label">Catégorie *</label><select required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="input">{RECIPE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="md:col-span-2"><label className="label">Description</label><textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input resize-none" /></div>
            <div><label className="label">Image URL</label><input type="url" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} className="input" /></div>
            <div><label className="label">Portions</label><input type="number" min="1" value={formData.portions} onChange={e => setFormData({ ...formData, portions: parseInt(e.target.value) || 1 })} className="input" /></div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Coûts & Prix</h2>
          <div className="grid grid-cols-3 gap-6">
            <div><label className="label">Prix de vente</label><input type="number" step="0.01" value={formData.selling_price} onChange={e => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })} className="input" /></div>
            <div><label className="label">Ratio marge</label><input type="number" step="0.1" value={formData.margin_ratio} onChange={e => setFormData({ ...formData, margin_ratio: parseFloat(e.target.value) || 2 })} className="input" /></div>
            <div><label className="label">Coût total</label><div className="input bg-neutral-50">{formData.total_cost.toFixed(2)} €</div></div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Ingrédients</h2>
            <button type="button" onClick={() => setIngredients([...ingredients, { name: '', quantity: 0, unit: 'g', cost: 0, allergens: [], calories: 0, lipides: 0, glucides: 0, proteines: 0 }])} className="btn-ghost text-sm"><Plus className="w-4 h-4" /> Ajouter</button>
          </div>
          <div className="space-y-4">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="grid grid-cols-8 gap-2">
                <input type="text" placeholder="Ingrédient" value={ing.name} onChange={e => { const newIngs = [...ingredients]; newIngs[idx].name = e.target.value; setIngredients(newIngs); }} className="input col-span-3" />
                <input type="number" placeholder="Qté" value={ing.quantity || ''} onChange={e => { const newIngs = [...ingredients]; newIngs[idx].quantity = parseFloat(e.target.value) || 0; setIngredients(newIngs); }} className="input" />
                <input type="text" placeholder="Unité" value={ing.unit} onChange={e => { const newIngs = [...ingredients]; newIngs[idx].unit = e.target.value; setIngredients(newIngs); }} className="input" />
                <input type="number" placeholder="Coût" value={ing.cost || ''} onChange={e => { const newIngs = [...ingredients]; newIngs[idx].cost = parseFloat(e.target.value) || 0; setIngredients(newIngs); }} className="input" />
                <button type="button" onClick={() => setIngredients(ingredients.filter((_, i) => i !== idx))} className="p-2 rounded-lg hover:bg-error-50"><Trash2 className="w-4 h-4 text-error-500" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Étapes</h2>
            <button type="button" onClick={() => setSteps([...steps, { step_number: steps.length + 1, instruction: '' }])} className="btn-ghost text-sm"><Plus className="w-4 h-4" /> Ajouter</button>
          </div>
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold flex-shrink-0">{idx + 1}</div>
                <textarea rows={2} value={step.instruction} onChange={e => { const newSteps = [...steps]; newSteps[idx].instruction = e.target.value; setSteps(newSteps); }} className="input flex-1 resize-none" placeholder="Instruction..." />
                <button type="button" onClick={() => setSteps(steps.filter((_, i) => i !== idx))} className="p-2 rounded-lg hover:bg-error-50"><Trash2 className="w-4 h-4 text-error-500" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Paramètres</h2>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={formData.is_published} onChange={e => setFormData({ ...formData, is_published: e.target.checked })} className="w-5 h-5 rounded border-neutral-300" />
            <span className="text-neutral-700">Publier</span>
          </label>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/admin/technical-sheets')} className="btn-outline">Annuler</button>
          <button type="submit" className="btn-primary gap-2" disabled={saving}><Save className="w-5 h-5" />{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
        </div>
      </form>
    </div>
  );
}
