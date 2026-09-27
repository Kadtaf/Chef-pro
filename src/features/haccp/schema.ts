import { z } from 'zod';
import type { AiHaccp } from '@ai-contract';
import { HACCP_STATUS_VALUES, HACCP_TYPE_VALUES } from '@/shared/domain/constants';
import type { Json, Tables } from '@/shared/types/database';

export type HaccpRecord = Tables<'haccp_records'>;

export const checklistItemSchema = z.object({
  item: z.string().trim().min(1, 'Point de contrôle requis').max(500),
  category: z.string().trim().max(60),
  frequency: z.string().trim().max(60),
  critical: z.boolean(),
  corrective_action: z.string().trim().max(1000),
  completed: z.boolean(),
});
export type ChecklistItem = z.output<typeof checklistItemSchema>;

const text = (value: unknown) => (typeof value === 'string' ? value : '');

/** Stored JSON may come from older versions: normalise defensively. */
export function parseChecklist(value: Json): ChecklistItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const raw = entry as Record<string, unknown>;
    const item = text(raw.item ?? raw.check).trim();
    if (!item) return [];
    return [
      {
        item,
        category: text(raw.category),
        frequency: text(raw.frequency),
        critical: Boolean(raw.critical),
        corrective_action: text(raw.corrective_action),
        completed: Boolean(raw.completed),
      },
    ];
  });
}

const optionalNumber = z.preprocess(
  (v) => (v === '' || v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v)) ? null : v),
  z.coerce.number().min(-60).max(300).nullable(),
);

export const haccpFormSchema = z
  .object({
    id: z.string().optional(),
    type: z.enum(HACCP_TYPE_VALUES),
    status: z.enum(HACCP_STATUS_VALUES),
    title: z.string().trim().min(2, 'Titre requis').max(200),
    description: z.string().trim().max(2000),
    zone: z.string().trim().max(120),
    responsible_person: z.string().trim().max(120),
    temperature: optionalNumber,
    temperature_min: optionalNumber,
    temperature_max: optionalNumber,
    notes: z.string().trim().max(4000),
    checklist_items: z.array(checklistItemSchema),
  })
  .refine((v) => v.type !== 'temperature' || v.temperature !== null, {
    path: ['temperature'],
    message: 'Relevé de température requis',
  })
  .refine((v) => v.temperature_min === null || v.temperature_max === null || v.temperature_min <= v.temperature_max, {
    path: ['temperature_max'],
    message: 'Le maximum doit être supérieur au minimum',
  });

export type HaccpFormInput = z.input<typeof haccpFormSchema>;
export type HaccpFormValues = z.output<typeof haccpFormSchema>;

/** Regulatory presets (arrêté du 21 décembre 2009 / GBPH restauration). */
export const TEMPERATURE_PRESETS = [
  { label: 'Froid positif (0 à +4 °C)', min: 0, max: 4 },
  { label: 'Produits surgelés (≤ −18 °C)', min: null, max: -18 },
  { label: 'Maintien au chaud (≥ +63 °C)', min: 63, max: null },
  { label: 'Refroidissement rapide (< +10 °C en 2 h)', min: null, max: 10 },
  { label: 'Cuisson à cœur volaille (≥ +74 °C)', min: 74, max: null },
] as const;

export function temperatureCompliance(record: {
  temperature: number | null;
  temperature_min: number | null;
  temperature_max: number | null;
}): 'ok' | 'ko' | 'unknown' {
  if (record.temperature === null) return 'unknown';
  if (record.temperature_min === null && record.temperature_max === null) return 'unknown';
  const t = Number(record.temperature);
  if (record.temperature_min !== null && t < Number(record.temperature_min)) return 'ko';
  if (record.temperature_max !== null && t > Number(record.temperature_max)) return 'ko';
  return 'ok';
}

export const emptyHaccp = (type: HaccpFormValues['type'] = 'checklist'): HaccpFormValues => ({
  type,
  status: 'pending',
  title: '',
  description: '',
  zone: '',
  responsible_person: '',
  temperature: null,
  temperature_min: null,
  temperature_max: null,
  notes: '',
  checklist_items: [],
});

export function haccpToForm(record: HaccpRecord): HaccpFormValues {
  return {
    id: record.id,
    type: record.type,
    status: record.status,
    title: record.title,
    description: record.description ?? '',
    zone: record.zone ?? '',
    responsible_person: record.responsible_person ?? '',
    temperature: record.temperature,
    temperature_min: record.temperature_min,
    temperature_max: record.temperature_max,
    notes: record.notes ?? '',
    checklist_items: parseChecklist(record.checklist_items),
  };
}

export function toHaccpRow(values: HaccpFormValues) {
  const { id, ...fields } = values;
  const isTemperature = fields.type === 'temperature';
  const compliance = temperatureCompliance(fields);
  // A temperature reading outside its range is automatically non-compliant.
  const status = isTemperature && compliance === 'ko' ? 'failed' : fields.status;
  return {
    ...(id ? { id } : {}),
    ...fields,
    status,
    completed_at: status === 'pending' ? null : new Date().toISOString(),
    description: fields.description || null,
    zone: fields.zone || null,
    responsible_person: fields.responsible_person || null,
    notes: fields.notes || null,
    temperature: isTemperature ? fields.temperature : null,
    temperature_min: isTemperature ? fields.temperature_min : null,
    temperature_max: isTemperature ? fields.temperature_max : null,
    checklist_items: fields.checklist_items as unknown as Json,
  };
}

export function haccpFromAi(ai: AiHaccp): ReturnType<typeof toHaccpRow> {
  return toHaccpRow({
    ...emptyHaccp('checklist'),
    title: ai.title,
    zone: ai.zone,
    checklist_items: ai.items.map((item) => ({
      item: item.check,
      category: item.category,
      frequency: item.frequency,
      critical: item.critical,
      corrective_action: item.corrective_action,
      completed: false,
    })),
  });
}
