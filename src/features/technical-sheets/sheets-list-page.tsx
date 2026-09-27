import { Eye, EyeOff, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router';
import { computeCosting, foodCostTone } from '@/features/culinary/costing';
import { formatCurrency } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { useConfirm } from '@/shared/ui/confirm-context';
import { EntityCard } from '@/shared/ui/entity-card';
import { Badge, Card, EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { PageHeader, SearchInput } from '@/shared/ui/layout';
import { NutriScoreBadge } from '@/shared/ui/nutri-score';
import { useDeleteSheet, useSheets, useToggleSheetPublished } from './api';

export function Component() {
  const { data: sheets = [], isPending, isError, error, refetch } = useSheets();
  const toggle = useToggleSheetPublished();
  const remove = useDeleteSheet();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const term = useDeferredValue(search).toLowerCase();
  const visible = sheets.filter((s) => s.title.toLowerCase().includes(term) || s.category.toLowerCase().includes(term));

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Fiches techniques"
        description={`${sheets.length} fiche${sheets.length > 1 ? 's' : ''}`}
        actions={
          <Button asChild>
            <Link to="/admin/technical-sheets/new">
              <Plus />
              Nouvelle fiche
            </Link>
          </Button>
        }
      />

      <Card className="p-4">
        <SearchInput
          placeholder="Rechercher par titre ou catégorie…"
          aria-label="Rechercher une fiche technique"
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
          icon={FileText}
          title="Aucune fiche technique"
          description="Créez une fiche ou générez-la avec l'IA Studio."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((sheet) => {
            const costing = computeCosting(Number(sheet.cost_per_portion), Number(sheet.selling_price));
            return (
              <EntityCard
                key={sheet.id}
                to={`/admin/technical-sheets/${sheet.id}`}
                image={sheet.image_url}
                placeholderIcon={FileText}
                title={sheet.title}
                badges={
                  <>
                    <Badge tone="primary">{sheet.category}</Badge>
                    <NutriScoreBadge grade={sheet.nutri_score} className="size-6 text-xs" />
                  </>
                }
                meta={
                  <div className="flex flex-wrap justify-between gap-2">
                    <span>{formatCurrency(sheet.cost_per_portion)} / portion</span>
                    {costing.foodCostPct > 0 && (
                      <Badge tone={foodCostTone(costing.foodCostPct)}>
                        {costing.foodCostPct.toLocaleString('fr-FR')} % · ×{costing.coefficient.toLocaleString('fr-FR')}
                      </Badge>
                    )}
                  </div>
                }
                status={sheet.is_published ? <Badge tone="success">Publiée</Badge> : <Badge>Brouillon</Badge>}
                actions={
                  <>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={sheet.is_published ? 'Dépublier' : 'Publier'}
                      onClick={() => toggle.mutate({ id: sheet.id, is_published: !sheet.is_published })}
                    >
                      {sheet.is_published ? <EyeOff /> : <Eye />}
                    </Button>
                    <Button asChild variant="ghost" size="icon-sm" aria-label="Modifier">
                      <Link to={`/admin/technical-sheets/${sheet.id}/edit`}>
                        <Pencil />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-error-500 hover:bg-error-50"
                      aria-label="Supprimer"
                      onClick={async () => {
                        if (await confirm({ title: `Supprimer « ${sheet.title} » ?` })) remove.mutate(sheet.id);
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
