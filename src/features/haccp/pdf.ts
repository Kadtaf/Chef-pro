import type { PdfDocument } from '@/features/export/pdf-document';
import { HACCP_STATUS_LABELS, HACCP_TYPE_LABELS } from '@/shared/domain/constants';
import { formatDateTime } from '@/shared/lib/format';
import { parseChecklist, type HaccpRecord } from './schema';

export function haccpToPdf(record: HaccpRecord): PdfDocument {
  const checklist = parseChecklist(record.checklist_items);
  return {
    title: record.title,
    subtitle: record.description ?? undefined,
    badges: [HACCP_TYPE_LABELS[record.type], HACCP_STATUS_LABELS[record.status]],
    sections: [
      {
        heading: 'Enregistrement',
        blocks: [
          {
            kind: 'keyValue',
            items: [
              { label: 'Zone', value: record.zone ?? '-' },
              { label: 'Responsable', value: record.responsible_person ?? '-' },
              { label: 'Créé le', value: formatDateTime(record.created_at) },
              { label: 'Validé le', value: record.completed_at ? formatDateTime(record.completed_at) : '-' },
              ...(record.type === 'temperature'
                ? [
                    {
                      label: 'Température relevée',
                      value: record.temperature !== null ? `${record.temperature} °C` : '-',
                    },
                    {
                      label: 'Plage réglementaire',
                      value: `${record.temperature_min ?? '-'} / ${record.temperature_max ?? '-'} °C`,
                    },
                  ]
                : []),
            ],
          },
        ],
      },
      ...(checklist.length
        ? [
            {
              heading: 'Points de contrôle',
              blocks: [
                {
                  kind: 'table' as const,
                  head: ['Point de contrôle', 'Fréquence', 'Critique', 'Fait'],
                  rows: checklist.map((item) => [
                    item.corrective_action ? `${item.item}\nAction corrective : ${item.corrective_action}` : item.item,
                    item.frequency || '-',
                    item.critical ? 'Oui' : 'Non',
                    item.completed ? 'Oui' : 'Non',
                  ]),
                },
              ],
            },
          ]
        : []),
      ...(record.notes
        ? [{ heading: 'Observations', blocks: [{ kind: 'paragraph' as const, text: record.notes }] }]
        : []),
      {
        heading: 'Visa',
        blocks: [{ kind: 'paragraph', text: 'Nom et signature du responsable : ______________________________' }],
      },
    ],
    footer: `Plan de maîtrise sanitaire — ${record.title}`,
  };
}
