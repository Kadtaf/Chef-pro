import { useEffect, useState } from 'react';
import { supabase, Tables } from '../../lib/supabase';
import { Search, Mail, Check, Trash2, Clock } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export default function ContactSubmissions() {
  const [submissions, setSubmissions] = useState<Tables<'contact_submissions'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'unread'>('all');

  useEffect(() => { fetchSubmissions(); }, []);

  const fetchSubmissions = async () => {
    const { data } = await supabase.from('contact_submissions').select('*').order('created_at', { ascending: false });
    if (data) setSubmissions(data);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('contact_submissions').update({ is_read: true }).eq('id', id);
    fetchSubmissions();
  };

  const deleteSubmission = async (id: string) => {
    if (confirm('Supprimer ce message ?')) {
      await supabase.from('contact_submissions').delete().eq('id', id);
      fetchSubmissions();
    }
  };

  const filteredSubmissions = submissions.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()) || s.message.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || (statusFilter === 'read' ? s.is_read : !s.is_read);
    return matchSearch && matchStatus;
  });

  const unreadCount = submissions.filter(s => !s.is_read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Messages de contact</h1>
          <p className="text-neutral-500">{submissions.length} messages • {unreadCount} non lus</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="input w-full md:w-auto">
            <option value="all">Tous</option>
            <option value="unread">Non lus</option>
            <option value="read">Lus</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? <div className="text-center py-8 text-neutral-500">Chargement...</div> :
          filteredSubmissions.length === 0 ? <div className="text-center py-8 text-neutral-500">Aucun message</div> :
          filteredSubmissions.map(sub => (
            <div key={sub.id} className={`card p-6 ${!sub.is_read ? 'border-l-4 border-primary-500' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold">
                    {sub.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">{sub.name}</p>
                    <a href={`mailto:${sub.email}`} className="text-sm text-primary-600 hover:underline">{sub.email}</a>
                    {sub.phone && <p className="text-sm text-neutral-500">{sub.phone}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sub.subject && <span className="badge badge-primary">{sub.subject}</span>}
                  <span className={`badge ${sub.is_read ? 'bg-neutral-100 text-neutral-600' : 'badge-warning'}`}>
                    {sub.is_read ? 'Lu' : 'Non lu'}
                  </span>
                </div>
              </div>

              <p className="text-neutral-700 mb-4">{sub.message}</p>

              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-sm text-neutral-500">
                  <Clock className="w-4 h-4" />
                  {formatDate(sub.created_at)}
                </span>
                <div className="flex gap-2">
                  {!sub.is_read && (
                    <button onClick={() => markAsRead(sub.id)} className="btn-outline text-sm gap-1"><Check className="w-4 h-4" /> Marquer comme lu</button>
                  )}
                  <a href={`mailto:${sub.email}?subject=Re: ${sub.subject || 'Votre message'}`} className="btn-primary text-sm gap-1"><Mail className="w-4 h-4" /> Répondre</a>
                  <button onClick={() => deleteSubmission(sub.id)} className="p-2 rounded-lg hover:bg-error-50"><Trash2 className="w-4 h-4 text-error-500" /></button>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
