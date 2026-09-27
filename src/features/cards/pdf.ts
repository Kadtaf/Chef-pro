import type { PdfDocument } from '@/features/export/pdf-document';
import { CARD_CATEGORY_LABELS, SEASON_LABELS, labelOf } from '@/shared/domain/constants';
import { formatCurrency } from '@/shared/lib/format';
import type { CardWithSections } from './api';

export function cardItemTitle(item: CardWithSections['card_sections'][number]['card_section_items'][number]) {
  return item.custom_title || item.recipes?.title || 'Plat';
}

export function cardToPdf(card: CardWithSections): PdfDocument {
  return {
    title: card.title,
    subtitle: card.description ?? undefined,
    badges: [labelOf(CARD_CATEGORY_LABELS, card.category), labelOf(SEASON_LABELS, card.season)],
    imageUrl: card.image_url,
    sections: card.card_sections.map((section) => ({
      heading: section.title,
      blocks: [
        ...(section.description ? [{ kind: 'paragraph' as const, text: section.description }] : []),
        {
          kind: 'table' as const,
          head: ['Plat', 'Prix'],
          rows: section.card_section_items.map((item) => [
            [
              `${cardItemTitle(item)}${item.is_suggestion ? ' (suggestion du chef)' : ''}`,
              item.custom_description || item.recipes?.description || '',
            ]
              .filter(Boolean)
              .join('\n'),
            formatCurrency(item.price),
          ]),
        },
      ],
    })),
    footer: `Chef Pro Bordeaux — ${card.title} · Prix nets TTC, service compris`,
  };
}
