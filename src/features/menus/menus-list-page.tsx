import { Eye, EyeOff, Pencil, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router';
import { MENU_CATEGORY_LABELS, SEASON_LABELS, labelOf } from '@/shared/domain/constants';
import { formatCurrency } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { useConfirm } from '@/shared/ui/confirm-context';
import { EntityCard } from '@/shared/ui/entity-card';
import { Badge, Card, EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { PageHeader, SearchInput } from '@/shared/ui/layout';
import { NutriScoreBadge } from '@/shared/ui/nutri-score';
import { useDeleteMenu, useMenus, useToggleMenuPublished } from './api';

export function Component() {
  const { data: menus = [], isPending, isError, error, refetch } = useMenus();
  const toggle = useToggleMenuPublished();
  const remove = useDeleteMenu();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const term = useDeferredValue(search).toLowerCase();
  const visible = menus.filter((m) => m.title.toLowerCase().includes(term));

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Menus"
        description={`${menus.length} menu${menus.length > 1 ? 's' : ''}`}
        actions={
          <Button asChild>
            <Link to="/admin/menus/new">
              <Plus />
              Nouveau menu
            </Link>
          </Button>
        }
      />
      <Card className="p-4">
        <SearchInput
          placeholder="Rechercher un menu…"
          aria-label="Rechercher un menu"
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
          icon={UtensilsCrossed}
          title="Aucun menu"
          description="Composez un menu à partir de vos recettes ou avec l'IA Studio."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((menu) => (
            <EntityCard
              key={menu.id}
              to={`/admin/menus/${menu.id}`}
              image={menu.image_url}
              placeholderIcon={UtensilsCrossed}
              title={menu.title}
              badges={
                <>
                  <Badge tone="primary">{labelOf(MENU_CATEGORY_LABELS, menu.category)}</Badge>
                  <NutriScoreBadge grade={menu.avg_nutri_score} className="size-6 text-xs" />
                </>
              }
              meta={
                <div className="flex justify-between">
                  <span>
                    {menu.itemCount} plat{menu.itemCount > 1 ? 's' : ''} · {labelOf(SEASON_LABELS, menu.season)}
                  </span>
                  <span className="font-semibold text-primary-600">
                    {menu.price > 0 ? formatCurrency(menu.price) : ''}
                  </span>
                </div>
              }
              status={menu.is_published ? <Badge tone="success">Publié</Badge> : <Badge>Brouillon</Badge>}
              actions={
                <>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={menu.is_published ? 'Dépublier' : 'Publier'}
                    onClick={() => toggle.mutate({ id: menu.id, is_published: !menu.is_published })}
                  >
                    {menu.is_published ? <EyeOff /> : <Eye />}
                  </Button>
                  <Button asChild variant="ghost" size="icon-sm" aria-label="Modifier">
                    <Link to={`/admin/menus/${menu.id}/edit`}>
                      <Pencil />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-error-500 hover:bg-error-50"
                    aria-label="Supprimer"
                    onClick={async () => {
                      if (
                        await confirm({
                          title: `Supprimer « ${menu.title} » ?`,
                          description: 'Les recettes liées sont conservées.',
                        })
                      )
                        remove.mutate(menu.id);
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
