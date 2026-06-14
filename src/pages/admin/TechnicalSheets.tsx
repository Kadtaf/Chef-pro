import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Tables } from '../../lib/supabase';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, FileText } from 'lucide-react';
import { formatCurrency, getNutriScoreClass } from '../../lib/utils';

export default function TechnicalSheets() {
  const [sheets, setSheets] = useState<Tables<'technical_sheets'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchSheets(); }, []);

  const fetchSheets = async () => {
    const { data } = await supabase.from('technical_sheets').select('*').order('created_at', { ascending: false });
    if (data) setSheets(data);
    setLoading(false);
  };

  const filteredSheets = sheets.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));

  const deleteSheet = async (id: string) => {
    if (confirm('Supprimer cette fiche technique ?')) {
      await supabase.from('technical_sheets').delete().eq('id', id);
      fetchSheets();
    }
  };

  const togglePublished = async (sheet: Tables<'technical_sheets'>) => {
    await supabase.from('technical_sheets').update({ is_published: !sheet.is_published }).eq('id', sheet.id);
    fetchSheets();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Fiches techniques</h1>
          <p className="text-neutral-500">{sheets.length} fiches</p>
        </div>
        <Link to="/admin/technical-sheets/new" className="btn-primary gap-2">
          <Plus className="w-5 h-5" /> Nouvelle fiche
        </Link>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8 text-neutral-500">Chargement...</div>
        ) : filteredSheets.length === 0 ? (
          <div className="col-span-full text-center py-8 text-neutral-500">Aucune fiche trouvée</div>
        ) : (
          filteredSheets.map(sheet => (
            <div key={sheet.id} className="card-hover overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                {sheet.image_url ? (
                  <img src={sheet.image_url} alt={sheet.title} className="w-full h-full object-cover" />
                ) : (
                  <FileText className="w-16 h-16 text-primary-300" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="badge badge-primary">{sheet.category}</span>
                  {sheet.nutri_score && <span className={`badge ${getNutriScoreClass(sheet.nutri_score)}`}>{sheet.nutri_score}</span>}
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">{sheet.title}</h3>
                <div className="flex justify-between text-sm text-neutral-500 mb-4">
                  <span>Coût: {formatCurrency(sheet.cost_per_portion)}/portion</span>
                  <span>Marge: {sheet.margin_ratio}x</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`badge ${sheet.is_published ? 'badge-success' : 'bg-neutral-100 text-neutral-600'}`}>
                    {sheet.is_published ? 'Publié' : 'Brouillon'}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => togglePublished(sheet)} className="p-2 rounded-lg hover:bg-neutral-100">
                      {sheet.is_published ? <EyeOff className="w-4 h-4 text-neutral-400" /> : <Eye className="w-4 h-4 text-neutral-400" />}
                    </button>
                    <Link to={`/admin/technical-sheets/${sheet.id}/edit`} className="p-2 rounded-lg hover:bg-neutral-100">
                      <Edit className="w-4 h-4 text-neutral-400" />
                    </Link>
                    <button onClick={() => deleteSheet(sheet.id)} className="p-2 rounded-lg hover:bg-error-50">
                      <Trash2 className="w-4 h-4 text-error-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
