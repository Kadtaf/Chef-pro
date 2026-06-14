import { useEffect, useState } from 'react';
import { supabase, Tables } from '../../lib/supabase';
import { Search, Check, Trash2, MessageSquare, Star, Reply } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export default function Comments() {
  const [comments, setComments] = useState<Tables<'comments'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => { fetchComments(); }, []);

  const fetchComments = async () => {
    const { data } = await supabase.from('comments').select('*').order('created_at', { ascending: false });
    if (data) setComments(data);
    setLoading(false);
  };

  const approveComment = async (id: string) => {
    await supabase.from('comments').update({ is_approved: true }).eq('id', id);
    fetchComments();
  };

  const deleteComment = async (id: string) => {
    if (confirm('Supprimer ce commentaire ?')) {
      await supabase.from('comments').delete().eq('id', id);
      fetchComments();
    }
  };

  const submitReply = async (id: string) => {
    await supabase.from('comments').update({ response: replyText }).eq('id', id);
    setReplyingTo(null);
    setReplyText('');
    fetchComments();
  };

  const filteredComments = comments.filter(c => {
    const matchSearch = c.author_name.toLowerCase().includes(search.toLowerCase()) || c.content.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || (statusFilter === 'approved' ? c.is_approved : !c.is_approved);
    return matchSearch && matchStatus;
  });

  const pendingCount = comments.filter(c => !c.is_approved).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Commentaires</h1>
          <p className="text-neutral-500">{comments.length} commentaires • {pendingCount} en attente</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="input w-full md:w-auto">
            <option value="all">Tous</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvés</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? <div className="text-center py-8 text-neutral-500">Chargement...</div> :
          filteredComments.length === 0 ? <div className="text-center py-8 text-neutral-500">Aucun commentaire</div> :
          filteredComments.map(comment => (
            <div key={comment.id} className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold">
                    {comment.author_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">{comment.author_name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-500">{formatDate(comment.created_at)}</span>
                      {comment.rating && (
                        <div className="flex gap-0.5">{Array.from({ length: comment.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-accent-400 text-accent-400" />)}</div>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`badge ${comment.is_approved ? 'badge-success' : 'badge-warning'}`}>
                  {comment.is_approved ? 'Approuvé' : 'En attente'}
                </span>
              </div>

              <p className="text-neutral-700 mb-4">{comment.content}</p>

              {comment.response && (
                <div className="bg-neutral-50 rounded-lg p-4 mb-4 border-l-4 border-primary-500">
                  <p className="text-sm font-medium text-neutral-600 mb-1">Réponse</p>
                  <p className="text-neutral-700">{comment.response}</p>
                </div>
              )}

              {replyingTo === comment.id ? (
                <div className="mt-4">
                  <textarea rows={2} value={replyText} onChange={e => setReplyText(e.target.value)} className="input resize-none mb-2" placeholder="Votre réponse..." />
                  <div className="flex gap-2">
                    <button onClick={() => submitReply(comment.id)} className="btn-primary text-sm">Envoyer</button>
                    <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="btn-ghost text-sm">Annuler</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 mt-4">
                  {!comment.is_approved && (
                    <button onClick={() => approveComment(comment.id)} className="btn-outline text-sm gap-1"><Check className="w-4 h-4" /> Approuver</button>
                  )}
                  {!comment.response && (
                    <button onClick={() => setReplyingTo(comment.id)} className="btn-ghost text-sm gap-1"><Reply className="w-4 h-4" /> Répondre</button>
                  )}
                  <button onClick={() => deleteComment(comment.id)} className="p-2 rounded-lg hover:bg-error-50 ml-auto"><Trash2 className="w-4 h-4 text-error-500" /></button>
                </div>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}
