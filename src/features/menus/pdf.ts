import type { PdfDocument } from '@/features/export/pdf-document';
import { MENU_CATEGORY_LABELS, MENU_ITEM_TYPE_LABELS, SEASON_LABELS, labelOf } from '@/shared/domain/constants';
import { formatCurrency } from '@/shared/lib/format';
import type { MenuWithItems } from './api';

export function menuItemTitle(item: MenuWithItems['menu_items'][number]): string {
  return item.custom_title || item.recipes?.title || 'Plat';
}

export function menuToPdf(menu: MenuWithItems): PdfDocument {
  return {
    title: menu.title,
    subtitle: menu.description ?? undefined,
    badges: [
      labelOf(MENU_CATEGORY_LABELS, menu.category),
      labelOf(SEASON_LABELS, menu.season),
      menu.price ? formatCurrency(menu.price) : '',
    ].filter(Boolean),
    imageUrl: menu.image_url,
    sections: [
      {
        heading: 'Au menu',
        blocks: menu.menu_items.flatMap((item) => [
          {
            kind: 'paragraph' as const,
            text: `${labelOf(MENU_ITEM_TYPE_LABELS, item.item_type).toUpperCase()} — ${menuItemTitle(item)}`,
          },
          ...(item.custom_description || item.recipes?.description
            ? [{ kind: 'paragraph' as const, text: (item.custom_description || item.recipes?.description) ?? '' }]
            : []),
        ]),
      },
      {
        heading: 'Informations',
        blocks: [
          {
            kind: 'keyValue',
            items: [
              { label: 'Prix par personne', value: formatCurrency(menu.price) },
              { label: 'Calories estimées', value: `${Math.round(menu.total_calories)} kcal` },
              { label: 'Nutri-Score moyen', value: menu.avg_nutri_score ?? '-' },
              { label: 'Menu équilibré', value: menu.is_balanced ? 'Oui' : 'Non' },
            ],
          },
        ],
      },
    ],
    footer: `Chef Pro Bordeaux — ${menu.title}`,
  };
}
