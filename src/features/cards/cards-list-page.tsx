import { CreditCard, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router';
import { CARD_CATEGORY_LABELS, SEASON_LABELS, labelOf } from '@/shared/domain/constants';
import { Button } from '@/shared/ui/button';
import { useConfirm } from '@/shared/ui/confirm-context';
import { EntityCard } from '@/shared/ui/entity-card';
import { Badge, Card, EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { PageHeader, SearchInput } from '@/shared/ui/layout';
import { useCards, useDeleteCard, useToggleCardPublished } from './api';

export function Component() {
  const { data: cards = [], isPending, isError, error, refetch } = useCards();
  const toggle = useToggleCardPublished();
  const remove = useDeleteCard();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const term = useDeferredValue(search).toLowerCase();
  const visible = cards.filter((c) => c.title.toLowerCase().includes(term));

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Cartes"
        description={`${cards.length} carte${cards.length > 1 ? 's' : ''}`}
        actions={
          <Button asChild>
            <Link to="/admin/cards/new">
              <Plus />
              Nouvelle carte
            </Link>
          </Button>
        }
      />
      <Card className="p-4">
        <SearchInput
          placeholder="Rechercher une carte…"
          aria-label="Rechercher une carte"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      {isPending ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Aucune carte"
          description="Créez une carte ou générez-la avec l'IA Studio."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((card) => (
            <EntityCard
              key={card.id}
              to={`/admin/cards/${card.id}`}
              image={card.image_url}
              placeholderIcon={CreditCard}
              title={card.title}
              badges={<Badge tone="primary">{labelOf(CARD_CATEGORY_LABELS, card.category)}</Badge>}
              meta={
                <span>
                  {card.sectionCount} section{card.sectionCount > 1 ? 's' : ''} · {labelOf(SEASON_LABELS, card.season)}
                </span>
              }
              status={card.is_published ? <Badge tone="success">Publiée</Badge> : <Badge>Brouillon</Badge>}
              actions={
                <>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={card.is_published ? 'Dépublier' : 'Publier'}
                    onClick={() => toggle.mutate({ id: card.id, is_published: !card.is_published })}
                  >
                    {card.is_published ? <EyeOff /> : <Eye />}
                  </Button>
                  <Button asChild variant="ghost" size="icon-sm" aria-label="Modifier">
                    <Link to={`/admin/cards/${card.id}/edit`}>
                      <Pencil />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-error-500 hover:bg-error-50"
                    aria-label="Supprimer"
                    onClick={async () => {
                      if (await confirm({ title: `Supprimer « ${card.title} » ?` })) remove.mutate(card.id);
                    }}
                  >
                    <Trash2 />
                  </Button>
                </>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
