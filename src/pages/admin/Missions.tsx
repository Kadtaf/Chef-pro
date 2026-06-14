import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, Tables } from '../../lib/supabase';
import { Plus, Search, Edit, Trash2, Briefcase, MapPin, Calendar, Euro } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { MISSION_STATUSES, MISSION_TYPES } from '../../lib/utils';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'terminee': return 'badge-success';
    case 'en_cours': return 'badge-primary';
    case 'annulee': return 'badge-error';
    default: return 'badge-warning';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'terminee': return 'Terminée';
    case 'en_cours': return 'En cours';
    case 'annulee': return 'Annulée';
    default: return 'En attente';
  }
};

export default function Missions() {
  const [missions, setMissions] = useState<Tables<'missions'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { fetchMissions(); }, []);

  const fetchMissions = async () => {
    const { data } = await supabase.from('missions').select('*').order('created_at', { ascending: false });
    if (data) setMissions(data);
    setLoading(false);
  };

  const filteredMissions = missions.filter(m => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase()) || m.client_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenues = missions.filter(m => m.status === 'terminee').reduce((acc, m) => acc + m.total_revenue, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Missions</h1>
          <p className="text-neutral-500">{missions.length} missions • {formatCurrency(totalRevenues)} total</p>
        </div>
        <Link to="/admin/missions/new" className="btn-primary gap-2"><Plus className="w-5 h-5" /> Nouvelle mission</Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4"><div className="text-2xl font-bold text-neutral-900">{missions.filter(m => m.status === 'en_attente').length}</div><div className="text-sm text-neutral-500">En attente</div></div>
        <div className="card p-4"><div className="text-2xl font-bold text-primary-600">{missions.filter(m => m.status === 'en_cours').length}</div><div className="text-sm text-neutral-500">En cours</div></div>
        <div className="card p-4"><div className="text-2xl font-bold text-success-600">{missions.filter(m => m.status === 'terminee').length}</div><div className="text-sm text-neutral-500">Terminées</div></div>
        <div className="card p-4"><div className="text-2xl font-bold text-error-600">{missions.filter(m => m.status === 'annulee').length}</div><div className="text-sm text-neutral-500">Annulées</div></div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-full md:w-auto">
            <option value="all">Tous statuts</option>
            {MISSION_STATUSES.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <div className="col-span-full text-center py-8 text-neutral-500">Chargement...</div> :
          filteredMissions.length === 0 ? <div className="col-span-full text-center py-8 text-neutral-500">Aucune mission</div> :
          filteredMissions.map(mission => (
            <div key={mission.id} className="card-hover p-6">
              <div className="flex justify-between items-start mb-4">
                <span className={`badge ${getStatusColor(mission.status)}`}>{getStatusLabel(mission.status)}</span>
                <span className="badge bg-neutral-100 text-neutral-600">{mission.type}</span>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1">{mission.title}</h3>
              <p className="text-sm text-neutral-500 mb-4">{mission.client_name}</p>
              <div className="space-y-2 text-sm text-neutral-600 mb-4">
                {mission.location && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-neutral-400" />{mission.location}</div>}
                {mission.start_date && <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-neutral-400" />{formatDate(mission.start_date)}</div>}
                <div className="flex items-center gap-2"><Euro className="w-4 h-4 text-neutral-400" />{formatCurrency(mission.total_revenue)}</div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500">{formatCurrency(mission.daily_rate)}/jour</span>
                <div className="flex gap-2">
                  <Link to={`/admin/missions/${mission.id}/edit`} className="p-2 rounded-lg hover:bg-neutral-100"><Edit className="w-4 h-4 text-neutral-400" /></Link>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
