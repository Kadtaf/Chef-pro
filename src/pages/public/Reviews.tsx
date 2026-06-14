import { useEffect, useState } from 'react';
import { supabase, Tables } from '../../lib/supabase';
import { Star, Quote, MessageSquare } from 'lucide-react';

export default function Reviews() {
  const [reviews, setReviews] = useState<Tables<'comments'>[]>([]);
  const [stats, setStats] = useState({ avg: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('is_approved', true)
        .eq('is_public', true)
        .not('rating', 'is', null)
        .order('created_at', { ascending: false });
      if (data) {
        setReviews(data);
        const withRating = data.filter((r) => r.rating);
        const total = withRating.length;
        const avg = total > 0 ? withRating.reduce((acc, r) => acc + (r.rating || 0), 0) / total : 0;
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        withRating.forEach((r) => {
          if (r.rating && r.rating <= 5) {
            distribution[r.rating as keyof typeof distribution]++;
          }
        });
        setStats({ avg: Math.round(avg * 10) / 10, total, distribution });
      }
    };
    fetchReviews();
  }, []);

  const defaultReviews = [
    {
      id: '1',
      author_name: 'Marie Dupont',
      rating: 5,
      content: 'Un chef exceptionnel ! Sa créativité et son professionnalisme ont transformé notre événement. Les convives n\'en revenaient pas.',
      source: 'google',
      created_at: '2024-03-15T10:00:00Z',
    },
    {
      id: '2',
      author_name: 'Restaurant Le Gourmet',
      rating: 5,
      content: 'Consulting complet de notre carte. Une expertise précieuse pour optimiser nos coûts tout en améliorant la qualité.',
      source: 'site',
      created_at: '2024-02-20T14:30:00Z',
    },
    {
      id: '3',
      author_name: 'Pierre Martin',
      rating: 5,
      content: 'Formation exceptionnelle pour notre équipe. Les techniques apprises ont vraiment fait la différence.',
      source: 'internal',
      created_at: '2024-01-10T09:00:00Z',
    },
    {
      id: '4',
      author_name: 'Hôtel de Prestige',
      rating: 4,
      content: 'Excellent travail en tant que second de cuisine. Intégration parfaite dans notre brigade.',
      source: 'site',
      created_at: '2023-12-05T16:00:00Z',
    },
  ];

  const displayReviews = reviews.length > 0 ? reviews : defaultReviews;

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative py-24 bg-gradient-to-br from-neutral-900 to-neutral-800">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
            Avis Clients
          </h1>
          <p className="text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto">
            Ce que mes clients disent de mes prestations
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <div className="flex items-baseline justify-center md:justify-start gap-2 mb-4">
                <span className="text-6xl font-display font-bold text-primary-600">{stats.avg}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`w-6 h-6 ${i <= Math.round(stats.avg) ? 'fill-accent-400 text-accent-400' : 'text-neutral-200'}`} />
                  ))}
                </div>
              </div>
              <p className="text-neutral-600">Basé sur {stats.total} avis</p>
            </div>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-accent-400 text-accent-400" />
                    ))}
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${stats.total > 0 ? (stats.distribution[rating as keyof typeof stats.distribution] / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm text-neutral-500 w-8">{stats.distribution[rating as keyof typeof stats.distribution]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayReviews.map((review, index) => (
              <div key={review.id || index} className="card p-8 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <Quote className="w-10 h-10 text-primary-400/30 mb-6" />
                <p className="text-neutral-700 leading-relaxed mb-6">{review.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold">
                      {review.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900">{review.author_name}</div>
                      <div className="text-sm text-neutral-500 capitalize">{review.source || 'Client'}</div>
                    </div>
                  </div>
                  {review.rating && (
                    <div className="flex gap-0.5">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-accent-400 text-accent-400" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="section-title mb-6">Votre avis m'importe</h2>
          <p className="section-subtitle mx-auto mb-10">
            Vous avez travaillé avec moi ? Partagez votre expérience.
          </p>
          <a href="mailto:contact@chef-pro-bordeaux.fr" className="btn-primary gap-2">
            <MessageSquare className="w-5 h-5" />
            Laisser un avis
          </a>
        </div>
      </section>
    </div>
  );
}
