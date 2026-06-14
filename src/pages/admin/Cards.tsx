import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Tables } from '../../lib/supabase';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, CreditCard } from 'lucide-react';

export default function Cards() {
  const [cards, setCards] = useState<Tables<'cards'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchCards(); }, []);

  const fetchCards = async () => {
    const { data } = await supabase.from('cards').select('*').order('created_at', { ascending: false });
    if (data) setCards(data);
    setLoading(false);
  };

  const togglePublished = async (card: Tables<'cards'>) => {
    await supabase.from('cards').update({ is_published: !card.is_published }).eq('id', card.id);
    fetchCards();
  };

  const deleteCard = async (id: string) => {
    if (confirm('Supprimer cette carte ?')) {
      await supabase.from('cards').delete().eq('id', id);
      fetchCards();
    }
  };

  const filteredCards = cards.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Cartes</h1>
          <p className="text-neutral-500">{cards.length} cartes</p>
        </div>
        <Link to="/admin/cards/new" className="btn-primary gap-2"><Plus className="w-5 h-5" /> Nouvelle carte</Link>
      </div>

      <div className="card p-4">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <div className="col-span-full text-center py-8 text-neutral-500">Chargement...</div> :
          filteredCards.length === 0 ? <div className="col-span-full text-center py-8 text-neutral-500">Aucune carte</div> :
          filteredCards.map(card => (
            <div key={card.id} className="card-hover overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-accent-100 to-primary-100 flex items-center justify-center">
                {card.image_url ? <img src={card.image_url} alt={card.title} className="w-full h-full object-cover" /> : <CreditCard className="w-16 h-16 text-accent-300" />}
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="badge badge-primary">{card.category}</span>
                  {card.is_balanced && <span className="badge badge-success">Équilibrée</span>}
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">{card.title}</h3>
                <p className="text-sm text-neutral-500 mb-4 line-clamp-2">{card.description}</p>
                <div className="flex justify-between items-center">
                  <span className={`badge ${card.is_published ? 'badge-success' : 'bg-neutral-100 text-neutral-600'}`}>{card.is_published ? 'Publié' : 'Brouillon'}</span>
                  <div className="flex gap-1">
                    <button onClick={() => togglePublished(card)} className="p-2 rounded-lg hover:bg-neutral-100">{card.is_published ? <EyeOff className="w-4 h-4 text-neutral-400" /> : <Eye className="w-4 h-4 text-neutral-400" />}</button>
                    <Link to={`/admin/cards/${card.id}/edit`} className="p-2 rounded-lg hover:bg-neutral-100"><Edit className="w-4 h-4 text-neutral-400" /></Link>
                    <button onClick={() => deleteCard(card.id)} className="p-2 rounded-lg hover:bg-error-50"><Trash2 className="w-4 h-4 text-error-500" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
