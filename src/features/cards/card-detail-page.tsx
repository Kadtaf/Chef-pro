import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { DetailActions } from '@/features/admin-shell/detail-actions';
import { CARD_CATEGORY_LABELS, SEASON_LABELS, labelOf } from '@/shared/domain/constants';
import { formatCurrency } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Badge, Card, EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { EntityHero, HeroBadge } from '@/shared/ui/entity-hero';
import { PageHeader } from '@/shared/ui/layout';
import { useCard, useDeleteCard, useToggleCardPublished } from './api';
import { cardItemTitle, cardToPdf } from './pdf';

export function Component() {
  const { id } = useParams();
  const { data: card, isPending, isError, error, refetch } = useCard(id);
  const toggle = useToggleCardPublished();
  const remove = useDeleteCard();

  if (isPending) return <PageLoader />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Carte"
        backTo="/admin/cards"
        actions={
          <DetailActions
            editTo={`/admin/cards/${card.id}/edit`}
            pdf={() => cardToPdf(card)}
            pdfName={`carte-${card.slug}`}
            onDelete={() => remove.mutateAsync(card.id)}
            deleteLabel="cette carte"
            afterDeleteTo="/admin/cards"
          >
            <Button
              variant="subtle"
              loading={toggle.isPending}
              onClick={() => toggle.mutate({ id: card.id, is_published: !card.is_published })}
            >
              {card.is_published ? <EyeOff /> : <Eye />}
              {card.is_published ? 'Dépublier' : 'Publier'}
            </Button>
          </DetailActions>
        }
      />

      <EntityHero
        image={card.image_url}
        title={card.title}
        titleAs="h2"
        description={card.description}
        badges={
          <>
            <HeroBadge>{labelOf(CARD_CATEGORY_LABELS, card.category)}</HeroBadge>
            <HeroBadge>{labelOf(SEASON_LABELS, card.season)}</HeroBadge>
            {card.is_published ? <Badge tone="success">Publiée</Badge> : <HeroBadge>Brouillon</HeroBadge>}
          </>
        }
      />

      {card.card_sections.length === 0 ? (
        <EmptyState title="Carte vide" description="Ajoutez des sections et des plats depuis l'édition." />
      ) : (
        <Card className="mx-auto max-w-3xl p-6 sm:p-12">
          <div className="space-y-12">
            {card.card_sections.map((section) => (
              <section key={section.id}>
                <h3 className="text-center font-display text-2xl text-neutral-900">{section.title}</h3>
                {section.description && (
                  <p className="mt-1 text-center text-sm text-neutral-500 italic">{section.description}</p>
                )}
                <ul className="mt-6 space-y-5">
                  {section.card_section_items.map((item) => (
                    <li key={item.id} className="flex items-baseline gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900">
                          {cardItemTitle(item)}
                          {item.is_suggestion && (
                            <Badge tone="primary" className="ml-2 align-middle">
                              <Sparkles className="size-3" aria-hidden />
                              Suggestion
                            </Badge>
                          )}
                        </p>
                        {(item.custom_description || item.recipes?.description) && (
                          <p className="text-sm text-neutral-500">
                            {item.custom_description || item.recipes?.description}
                          </p>
                        )}
                        {item.recipes && (
                          <Link
                            to={`/admin/recipes/${item.recipes.id}`}
                            className="text-xs text-primary-600 hover:underline print:hidden"
                          >
                            Recette liée
                          </Link>
                        )}
                      </div>
                      <span aria-hidden className="flex-1 border-b border-dotted border-neutral-300" />
                      <span className="font-semibold text-neutral-900 tabular-nums">{formatCurrency(item.price)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
