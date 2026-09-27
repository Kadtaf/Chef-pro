import { Check, EyeOff, MessageSquare, Reply, Star, Trash2, X } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { StarRating } from '@/features/public-site/components/star-rating';
import { formatDateTime } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { useConfirm } from '@/shared/ui/confirm-context';
import { Badge, Card, EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Select, Textarea } from '@/shared/ui/form';
import { PageHeader, SearchInput, StatCard } from '@/shared/ui/layout';
import { commentsCrud, type Review } from './api';

function ReviewCard({ review }: { review: Review }) {
  const patch = commentsCrud.usePatch();
  const remove = commentsCrud.useRemove();
  const confirm = useConfirm();
  const [replying, setReplying] = useState(false);
  const [response, setResponse] = useState(review.response ?? '');

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-secondary-500 font-semibold text-white">
            {review.author_name.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="font-semibold text-neutral-900">{review.author_name}</p>
            <p className="text-xs text-neutral-500">
              {review.author_email ?? 'email non renseigné'} · {formatDateTime(review.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {review.rating && <StarRating rating={review.rating} size="sm" />}
          {review.is_approved ? (
            review.is_public ? (
              <Badge tone="success">Publié</Badge>
            ) : (
              <Badge>Approuvé (privé)</Badge>
            )
          ) : (
            <Badge tone="warning">À modérer</Badge>
          )}
        </div>
      </div>

      <p className="mt-4 leading-relaxed whitespace-pre-line text-neutral-700">{review.content}</p>

      {review.response && !replying && (
        <div className="mt-4 rounded-lg bg-neutral-50 p-3 text-sm">
          <p className="font-medium text-neutral-900">Votre réponse</p>
          <p className="text-neutral-600">{review.response}</p>
        </div>
      )}

      {replying && (
        <div className="mt-4 space-y-2">
          <Textarea
            rows={3}
            aria-label="Réponse publique"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setReplying(false)}>
              <X />
              Annuler
            </Button>
            <Button
              size="sm"
              loading={patch.isPending}
              onClick={() =>
                patch.mutate(
                  { id: review.id, values: { response: response.trim() || null } },
                  { onSuccess: () => setReplying(false) },
                )
              }
            >
              Publier la réponse
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {!review.is_approved ? (
          <Button
            variant="success"
            size="sm"
            onClick={() => patch.mutate({ id: review.id, values: { is_approved: true, is_public: true } })}
          >
            <Check />
            Approuver
          </Button>
        ) : (
          <Button
            variant="subtle"
            size="sm"
            onClick={() => patch.mutate({ id: review.id, values: { is_approved: false } })}
          >
            <EyeOff />
            Retirer du site
          </Button>
        )}
        <Button variant="subtle" size="sm" onClick={() => setReplying(true)}>
          <Reply />
          {review.response ? 'Modifier la réponse' : 'Répondre'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-error-600 hover:bg-error-50"
          onClick={async () => {
            if (await confirm({ title: 'Supprimer cet avis ?' })) remove.mutate(review.id);
          }}
        >
          <Trash2 />
          Supprimer
        </Button>
      </div>
    </Card>
  );
}

export function Component() {
  const { data: reviews = [], isPending, isError, error, refetch } = commentsCrud.useList();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'approved'>('pending');
  const term = useDeferredValue(search).toLowerCase();

  const pending = reviews.filter((r) => !r.is_approved).length;
  const rated = reviews.filter((r) => r.is_approved && r.rating);
  const average = rated.length ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length : 0;

  const visible = reviews.filter(
    (r) =>
      (!term || `${r.author_name} ${r.content}`.toLowerCase().includes(term)) &&
      (status === 'all' || (status === 'pending' ? !r.is_approved : r.is_approved)),
  );

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Avis clients" description="Modération des avis déposés sur le site" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={MessageSquare} label="À modérer" value={pending} tone="warning" />
        <StatCard
          icon={Check}
          label="Publiés"
          value={reviews.filter((r) => r.is_approved && r.is_public).length}
          tone="success"
        />
        <StatCard
          icon={Star}
          label="Note moyenne"
          value={average ? `${average.toFixed(1).replace('.', ',')} / 5` : '—'}
        />
      </div>

      <Card className="flex flex-col gap-3 p-4 md:flex-row">
        <SearchInput
          className="flex-1"
          placeholder="Rechercher…"
          aria-label="Rechercher un avis"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          className="md:w-48"
          aria-label="Statut"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        >
          <option value="pending">À modérer</option>
          <option value="approved">Approuvés</option>
          <option value="all">Tous</option>
        </Select>
      </Card>

      {isPending ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState icon={MessageSquare} title={status === 'pending' ? 'Aucun avis en attente' : 'Aucun avis'} />
      ) : (
        <div className="space-y-4">
          {visible.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
