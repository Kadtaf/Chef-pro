import { useMemo, useState } from 'react';
import { Container, CtaBanner, PageHero } from '@/features/public-site/components/sections';
import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/format';
import { imageUrl } from '@/shared/lib/storage';
import { Badge, EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Seo } from '@/shared/ui/seo';
import { usePublishedPortfolio } from './api';

const FALLBACK = 'https://images.pexels.com/photos/3184192/pexels-photo-3184192.jpeg?auto=compress&cs=tinysrgb&w=800';

export function Component() {
  const { data: items = [], isPending, isError, error, refetch } = usePublishedPortfolio();
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(() => [...new Set(items.map((item) => item.category))], [items]);
  const visible = category ? items.filter((item) => item.category === category) : items;

  return (
    <div className="animate-fade-in">
      <Seo
        title="Portfolio"
        description="Réalisations d'un chef freelance à Bordeaux : restaurants, événements, traiteur et consulting culinaire."
      />
      <PageHero title="Portfolio" subtitle="Découvrez mes réalisations et projets culinaires" />

      {categories.length > 1 && (
        <section className="border-b border-neutral-200 bg-white py-6">
          <Container>
            <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Filtrer par catégorie">
              {[null, ...categories].map((value) => (
                <button
                  key={value ?? 'all'}
                  type="button"
                  aria-pressed={category === value}
                  onClick={() => setCategory(value)}
                  className={cn(
                    'rounded-full px-5 py-2 text-sm font-medium transition-colors',
                    category === value
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
                  )}
                >
                  {value ?? 'Tous'}
                </button>
              ))}
            </div>
          </Container>
        </section>
      )}

      <section className="bg-neutral-50 py-16">
        <Container>
          {isPending ? (
            <PageLoader />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : visible.length === 0 ? (
            <EmptyState
              title="Portfolio en cours de constitution"
              description="Revenez bientôt découvrir mes réalisations."
            />
          ) : (
            <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((item) => (
                <li
                  key={item.id}
                  className="group overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-sm transition-shadow hover:shadow-lg"
                >
                  <div className="aspect-4/3 overflow-hidden">
                    <img
                      src={imageUrl(item.image_url, 800) ?? FALLBACK}
                      alt={item.title}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <Badge tone="primary">{item.category}</Badge>
                      {item.is_featured && <Badge className="bg-accent-100 text-accent-700">Vedette</Badge>}
                    </div>
                    <h2 className="mb-2 text-xl font-semibold text-neutral-900 group-hover:text-primary-600">
                      {item.title}
                    </h2>
                    {item.description && (
                      <p className="mb-4 line-clamp-3 text-sm text-neutral-600">{item.description}</p>
                    )}
                    <p className="flex items-center justify-between text-sm text-neutral-500">
                      <span>{item.client_name}</span>
                      {item.project_date && <time dateTime={item.project_date}>{formatDate(item.project_date)}</time>}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      <CtaBanner
        title="Votre projet ici ?"
        text="Discutons de votre projet et ajoutons-le à mon portfolio."
        primary={{ label: 'Me contacter', to: '/contact' }}
      />
    </div>
  );
}
