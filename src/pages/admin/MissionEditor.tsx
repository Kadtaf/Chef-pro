import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MISSION_STATUSES, MISSION_TYPES, formatCurrency } from '../../lib/utils';
import { Save, ArrowLeft, Calculator } from 'lucide-react';

export default function MissionEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    location: '',
    start_date: '',
    end_date: '',
    status: 'en_attente',
    type: 'chef',
    daily_rate: 350,
    total_revenue: 0,
    notes: '',
  });

  useEffect(() => {
    if (isEdit && id) fetchMission();
  }, [id]);

  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      setFormData(prev => ({ ...prev, total_revenue: days * prev.daily_rate }));
    }
  }, [formData.start_date, formData.end_date, formData.daily_rate]);

  const fetchMission = async () => {
    const { data } = await supabase.from('missions').select('*').eq('id', id).single();
    if (data) {
      setFormData({
        title: data.title,
        client_name: data.client_name,
        client_email: data.client_email || '',
        client_phone: data.client_phone || '',
        location: data.location || '',
        start_date: data.start_date || '',
        end_date: data.end_date || '',
        status: data.status,
        type: data.type,
        daily_rate: data.daily_rate,
        total_revenue: data.total_revenue,
        notes: data.notes || '',
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (isEdit) {
      await supabase.from('missions').update(formData).eq('id', id);
    } else {
      await supabase.from('missions').insert(formData);
    }

    setSaving(false);
    navigate('/admin/missions');
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/missions')} className="btn-ghost"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-display font-bold text-neutral-900">{isEdit ? 'Modifier la mission' : 'Nouvelle mission'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Informations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="label">Titre *</label><input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="input" placeholder="Ex: Remplacement Chef" /></div>
            <div><label className="label">Client *</label><input type="text" required value={formData.client_name} onChange={e => setFormData({ ...formData, client_name: e.target.value })} className="input" placeholder="Nom de l'établissement" /></div>
            <div><label className="label">Email</label><input type="email" value={formData.client_email} onChange={e => setFormData({ ...formData, client_email: e.target.value })} className="input" /></div>
            <div><label className="label">Téléphone</label><input type="tel" value={formData.client_phone} onChange={e => setFormData({ ...formData, client_phone: e.target.value })} className="input" /></div>
            <div className="md:col-span-2"><label className="label">Lieu</label><input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="input" /></div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Dates & Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label className="label">Date de début</label><input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="input" /></div>
            <div><label className="label">Date de fin</label><input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} className="input" /></div>
            <div><label className="label">Type</label><select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="input">
              {MISSION_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select></div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Tarification</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div><label className="label">Tarif journalier (€)</label><input type="number" step="0.01" value={formData.daily_rate} onChange={e => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || 0 })} className="input" /></div>
            <div><label className="label">Total calculé</label><div className="input bg-neutral-50 text-lg font-semibold text-primary-600">{formatCurrency(formData.total_revenue)}</div></div>
            <div><label className="label">Statut</label><select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="input">
              {MISSION_STATUSES.map(s => <option key={s} value={s}>{s === 'en_attente' ? 'En attente' : s === 'en_cours' ? 'En cours' : s === 'terminee' ? 'Terminée' : 'Annulée'}</option>)}
            </select></div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Notes</h2>
          <textarea rows={4} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="input resize-none" placeholder="Notes internes..." />
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/admin/missions')} className="btn-outline">Annuler</button>
          <button type="submit" className="btn-primary gap-2" disabled={saving}><Save className="w-5 h-5" />{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
        </div>
      </form>
    </div>
  );
}
