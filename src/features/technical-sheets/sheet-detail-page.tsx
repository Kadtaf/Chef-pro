import { Clock, Eye, EyeOff, Flame, Users } from 'lucide-react';
import { useParams } from 'react-router';
import { DetailActions } from '@/features/admin-shell/detail-actions';
import { AllergenList, NutritionTable } from '@/features/culinary/nutrition-panel';
import { formatCurrency, formatDuration, formatNumber } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Badge, Card, CardSection, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { EntityHero, HeroBadge } from '@/shared/ui/entity-hero';
import { PageHeader } from '@/shared/ui/layout';
import { NutriScoreBadge, NutriScoreScale } from '@/shared/ui/nutri-score';
import { Table, Td, Th } from '@/shared/ui/table';
import { useDeleteSheet, useSheet, useToggleSheetPublished } from './api';
import { CostingPanel } from './costing-panel';
import { sheetToPdf } from './pdf';
import { sheetViewModel } from './sheet-view';

export function Component() {
  const { id } = useParams();
  const { data: sheet, isPending, isError, error, refetch } = useSheet(id);
  const toggle = useToggleSheetPublished();
  const remove = useDeleteSheet();

  if (isPending) return <PageLoader />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const view = sheetViewModel(sheet);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Fiche technique"
        backTo="/admin/technical-sheets"
        actions={
          <DetailActions
            editTo={`/admin/technical-sheets/${sheet.id}/edit`}
            pdf={() => sheetToPdf(sheet)}
            pdfName={`fiche-technique-${sheet.slug}`}
            onDelete={() => remove.mutateAsync(sheet.id)}
            deleteLabel="cette fiche technique"
            afterDeleteTo="/admin/technical-sheets"
          >
            <Button
              variant="subtle"
              loading={toggle.isPending}
              onClick={() => toggle.mutate({ id: sheet.id, is_published: !sheet.is_published })}
            >
              {sheet.is_published ? <EyeOff /> : <Eye />}
              {sheet.is_published ? 'Dépublier' : 'Publier'}
            </Button>
          </DetailActions>
        }
      />

      <EntityHero
        image={sheet.image_url}
        title={sheet.title}
        titleAs="h2"
        description={sheet.description}
        badges={
          <>
            <HeroBadge>{sheet.category}</HeroBadge>
            <NutriScoreBadge grade={sheet.nutri_score} />
            {sheet.is_published ? <Badge tone="success">Publiée</Badge> : <HeroBadge>Brouillon</HeroBadge>}
          </>
        }
      />

      <Card className="flex flex-wrap gap-x-8 gap-y-3 px-6 py-4 text-sm text-neutral-600">
        <span className="flex items-center gap-2">
          <Users className="size-5 text-primary-600" aria-hidden /> {sheet.portions} portions
        </span>
        <span className="flex items-center gap-2">
          <Clock className="size-5 text-primary-600" aria-hidden /> Préparation {formatDuration(sheet.preparation_time)}
        </span>
        <span className="flex items-center gap-2">
          <Flame className="size-5 text-primary-600" aria-hidden /> Cuisson {formatDuration(sheet.cooking_time)}
        </span>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <CardSection title="Ingrédients">
            <Table>
              <thead>
                <tr>
                  <Th>Ingrédient</Th>
                  <Th className="text-right">Quantité</Th>
                  <Th className="text-right">Coût HT</Th>
                  <Th className="hidden md:table-cell">Allergènes</Th>
                </tr>
              </thead>
              <tbody>
                {sheet.technical_sheet_ingredients.map((ingredient) => (
                  <tr key={ingredient.id}>
                    <Td className="font-medium">{ingredient.name}</Td>
                    <Td className="text-right tabular-nums">
                      {formatNumber(ingredient.quantity)} {ingredient.unit}
                    </Td>
                    <Td className="text-right tabular-nums">{formatCurrency(ingredient.cost)}</Td>
                    <Td className="hidden text-neutral-500 md:table-cell">{ingredient.allergens.join(', ') || '—'}</Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <Td>Total</Td>
                  <Td />
                  <Td className="text-right">{formatCurrency(view.totalCost)}</Td>
                  <Td className="hidden md:table-cell" />
                </tr>
              </tfoot>
            </Table>
          </CardSection>

          <CardSection title="Progression technique">
            <ol className="space-y-5">
              {sheet.technical_sheet_steps.map((step, index) => (
                <li key={step.id} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700">
                    {index + 1}
                  </span>
                  <p className="pt-1 leading-relaxed whitespace-pre-line text-neutral-700">{step.instruction}</p>
                </li>
              ))}
            </ol>
          </CardSection>
        </div>

        <aside className="space-y-6">
          <CostingPanel costing={view.costing} costPerPortion={view.costPerPortion} />
          <CardSection title="Nutrition (par portion)">
            <div className="space-y-4">
              <NutriScoreScale grade={sheet.nutri_score} />
              <NutritionTable perPortion={view.nutrition.perPortion} per100g={view.nutrition.per100g} />
            </div>
          </CardSection>
          <CardSection title="Allergènes">
            <AllergenList allergens={view.allergens} />
          </CardSection>
        </aside>
      </div>
    </div>
  );
}
