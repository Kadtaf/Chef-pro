import { Eye, EyeOff, Flame, Scale } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { DetailActions } from '@/features/admin-shell/detail-actions';
import { MENU_CATEGORY_LABELS, MENU_ITEM_TYPE_LABELS, SEASON_LABELS, labelOf } from '@/shared/domain/constants';
import { formatCurrency } from '@/shared/lib/format';
import { imageUrl } from '@/shared/lib/storage';
import { Button } from '@/shared/ui/button';
import { Badge, Card, CardSection, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { EntityHero, HeroBadge } from '@/shared/ui/entity-hero';
import { PageHeader } from '@/shared/ui/layout';
import { NutriScoreBadge } from '@/shared/ui/nutri-score';
import { useDeleteMenu, useMenu, useToggleMenuPublished } from './api';
import { menuItemTitle, menuToPdf } from './pdf';

export function Component() {
  const { id } = useParams();
  const { data: menu, isPending, isError, error, refetch } = useMenu(id);
  const toggle = useToggleMenuPublished();
  const remove = useDeleteMenu();

  if (isPending) return <PageLoader />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const cost = menu.menu_items.reduce((sum, item) => sum + Number(item.recipes?.cost_per_serving ?? 0), 0);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Menu"
        backTo="/admin/menus"
        actions={
          <DetailActions
            editTo={`/admin/menus/${menu.id}/edit`}
            pdf={() => menuToPdf(menu)}
            pdfName={`menu-${menu.slug}`}
            onDelete={() => remove.mutateAsync(menu.id)}
            deleteLabel="ce menu"
            afterDeleteTo="/admin/menus"
          >
            <Button
              variant="subtle"
              loading={toggle.isPending}
              onClick={() => toggle.mutate({ id: menu.id, is_published: !menu.is_published })}
            >
              {menu.is_published ? <EyeOff /> : <Eye />}
              {menu.is_published ? 'Dépublier' : 'Publier'}
            </Button>
          </DetailActions>
        }
      />

      <EntityHero
        image={menu.image_url}
        title={menu.title}
        titleAs="h2"
        description={menu.description}
        badges={
          <>
            <HeroBadge>{labelOf(MENU_CATEGORY_LABELS, menu.category)}</HeroBadge>
            <HeroBadge>{labelOf(SEASON_LABELS, menu.season)}</HeroBadge>
            {menu.is_published ? <Badge tone="success">Publié</Badge> : <HeroBadge>Brouillon</HeroBadge>}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card className="p-6 sm:p-10">
            <h3 className="mb-8 text-center font-display text-2xl text-neutral-900">Au menu</h3>
            <ol className="space-y-8">
              {menu.menu_items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-start sm:text-left"
                >
                  {item.recipes?.image_url && (
                    <img
                      src={imageUrl(item.recipes.image_url, 160)}
                      alt=""
                      className="size-20 rounded-xl object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-xs font-semibold tracking-widest text-primary-600 uppercase">
                      {labelOf(MENU_ITEM_TYPE_LABELS, item.item_type)}
                    </p>
                    <p className="font-display text-xl text-neutral-900">{menuItemTitle(item)}</p>
                    {(item.custom_description || item.recipes?.description) && (
                      <p className="mt-1 text-sm text-neutral-600">
                        {item.custom_description || item.recipes?.description}
                      </p>
                    )}
                    {item.recipes && (
                      <p className="mt-2 flex items-center justify-center gap-2 text-xs text-neutral-500 sm:justify-start">
                        <NutriScoreBadge grade={item.recipes.nutri_score} className="size-5 text-[10px]" />
                        {Math.round(item.recipes.calories_per_serving)} kcal ·
                        <Link to={`/admin/recipes/${item.recipes.id}`} className="text-primary-600 hover:underline">
                          voir la recette
                        </Link>
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            {menu.price > 0 && (
              <p className="mt-10 text-center font-display text-3xl font-bold text-primary-600">
                {formatCurrency(menu.price)}
              </p>
            )}
          </Card>
        </div>

        <CardSection title="Indicateurs">
          <dl className="space-y-4">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-neutral-500">
                <Flame className="size-4" aria-hidden /> Calories
              </dt>
              <dd className="font-semibold">{Math.round(menu.total_calories)} kcal</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-neutral-500">Nutri-Score moyen</dt>
              <dd>{menu.avg_nutri_score ? <NutriScoreBadge grade={menu.avg_nutri_score} /> : '—'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-neutral-500">
                <Scale className="size-4" aria-hidden /> Équilibré
              </dt>
              <dd>{menu.is_balanced ? <Badge tone="success">Oui</Badge> : <Badge>Non</Badge>}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-neutral-500">Coût matière</dt>
              <dd className="font-semibold">{formatCurrency(cost)}</dd>
            </div>
          </dl>
        </CardSection>
      </div>
    </div>
  );
}
