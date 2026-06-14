import { useEffect, useState } from 'react';
import { supabase, Tables } from '../../lib/supabase';
import { Plus, Search, Trash2, Euro, TrendingUp, Calendar, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Revenues() {
  const [revenues, setRevenues] = useState<Tables<'revenues'>[]>([]);
  const [missions, setMissions] = useState<Tables<'missions'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [monthlyData, setMonthlyData] = useState<{ month: string; revenus: number }[]>([]);

  const [formData, setFormData] = useState({
    amount: 0,
    source: '',
    description: '',
    date_received: new Date().toISOString().split('T')[0],
    mission_id: null as string | null,
    payment_method: '',
    invoice_number: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [revenuesRes, missionsRes] = await Promise.all([
      supabase.from('revenues').select('*').order('date_received', { ascending: false }),
      supabase.from('missions').select('*'),
    ]);

    if (revenuesRes.data) setRevenues(revenuesRes.data);
    if (missionsRes.data) setMissions(missionsRes.data);

    // Calculate monthly data
    const monthly: Record<string, number> = {};
    revenuesRes.data?.forEach(r => {
      const month = new Date(r.date_received).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      monthly[month] = (monthly[month] || 0) + r.amount;
    });
    setMonthlyData(Object.entries(monthly).map(([month, revenus]) => ({ month, revenus })).slice(-12));

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('revenues').insert(formData);
    setShowModal(false);
    setFormData({ amount: 0, source: '', description: '', date_received: new Date().toISOString().split('T')[0], mission_id: null, payment_method: '', invoice_number: '' });
    fetchData();
  };

  const deleteRevenue = async (id: string) => {
    if (confirm('Supprimer ce revenu ?')) {
      await supabase.from('revenues').delete().eq('id', id);
      fetchData();
    }
  };

  const totalThisYear = revenues.filter(r => new Date(r.date_received).getFullYear() === new Date().getFullYear()).reduce((acc, r) => acc + r.amount, 0);
  const totalThisMonth = revenues.filter(r => {
    const d = new Date(r.date_received);
    return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
  }).reduce((acc, r) => acc + r.amount, 0);

  const filteredRevenues = revenues.filter(r =>
    r.source?.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    const csv = ['Date,Source,Description,Montant', ...revenues.map(r => `${r.date_received},${r.source || ''},${r.description || ''},${r.amount}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenus-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Revenus</h1>
          <p className="text-neutral-500">{revenues.length} entrées</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-outline gap-2"><Download className="w-5 h-5" /> Exporter</button>
          <button onClick={() => setShowModal(true)} className="btn-primary gap-2"><Plus className="w-5 h-5" /> Nouveau</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-lg bg-success-100 flex items-center justify-center"><Euro className="w-6 h-6 text-success-600" /></div><div><p className="text-2xl font-bold text-neutral-900">{formatCurrency(totalThisYear)}</p><p className="text-sm text-neutral-500">Cette année</p></div></div></div>
        <div className="card p-6"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-primary-600" /></div><div><p className="text-2xl font-bold text-neutral-900">{formatCurrency(totalThisMonth)}</p><p className="text-sm text-neutral-500">Ce mois</p></div></div></div>
        <div className="card p-6"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-lg bg-accent-100 flex items-center justify-center"><Calendar className="w-6 h-6 text-accent-600" /></div><div><p className="text-2xl font-bold text-neutral-900">{revenues.length}</p><p className="text-sm text-neutral-500">Transactions</p></div></div></div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Évolution mensuelle</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${v}`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="revenus" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
      </div></div>

      <div className="table-container">
        <table className="table">
          <thead><tr><th>Date</th><th>Source</th><th>Description</th><th>Montant</th><th className="text-right">Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center py-8 text-neutral-500">Chargement...</td></tr> :
              filteredRevenues.map(r => (
                <tr key={r.id}>
                  <td className="text-neutral-600">{formatDate(r.date_received)}</td>
                  <td><span className="badge badge-primary">{r.source || '-'}</span></td>
                  <td className="text-neutral-600">{r.description || '-'}</td>
                  <td className="font-semibold text-success-600">{formatCurrency(r.amount)}</td>
                  <td className="text-right"><button onClick={() => deleteRevenue(r.id)} className="p-2 rounded-lg hover:bg-error-50"><Trash2 className="w-4 h-4 text-error-500" /></button></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-neutral-100"><h2 className="text-lg font-semibold">Nouveau revenu</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Montant (€) *</label><input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} className="input" /></div>
                <div><label className="label">Date *</label><input type="date" required value={formData.date_received} onChange={e => setFormData({ ...formData, date_received: e.target.value })} className="input" /></div>
              </div>
              <div><label className="label">Source</label><input type="text" value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} className="input" placeholder="Mission, Contrat, etc." /></div>
              <div><label className="label">Description</label><textarea rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input resize-none" /></div>
              <div className="flex gap-4 pt-4"><button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Annuler</button><button type="submit" className="btn-primary flex-1">Enregistrer</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
