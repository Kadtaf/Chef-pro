import { z } from 'zod';
import { amount } from '@/features/culinary/schema';
import { MISSION_STATUS_VALUES, MISSION_TYPE_VALUES } from '@/shared/domain/constants';
import type { Tables } from '@/shared/types/database';

export type Mission = Tables<'missions'>;

const isoDate = z.union([z.iso.date('Date invalide'), z.literal('')]);

export const missionFormSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().trim().min(2, 'Intitulé requis').max(200),
    client_name: z.string().trim().min(1, 'Client requis').max(200),
    client_email: z.union([z.email('Email invalide'), z.literal('')]),
    client_phone: z.string().trim().max(40),
    location: z.string().trim().max(200),
    start_date: isoDate,
    end_date: isoDate,
    status: z.enum(MISSION_STATUS_VALUES),
    type: z.enum(MISSION_TYPE_VALUES),
    daily_rate: amount(),
    total_revenue: amount(),
    notes: z.string().trim().max(5000),
  })
  .refine((v) => !v.start_date || !v.end_date || v.start_date <= v.end_date, {
    path: ['end_date'],
    message: 'La fin doit être après le début',
  });

export type MissionFormInput = z.input<typeof missionFormSchema>;
export type MissionFormValues = z.output<typeof missionFormSchema>;

export const emptyMission = (): MissionFormValues => ({
  title: '',
  client_name: '',
  client_email: '',
  client_phone: '',
  location: '',
  start_date: '',
  end_date: '',
  status: 'en_attente',
  type: 'chef',
  daily_rate: 350,
  total_revenue: 0,
  notes: '',
});

export function missionToForm(mission: Mission): MissionFormValues {
  return {
    id: mission.id,
    title: mission.title,
    client_name: mission.client_name,
    client_email: mission.client_email ?? '',
    client_phone: mission.client_phone ?? '',
    location: mission.location ?? '',
    start_date: mission.start_date ?? '',
    end_date: mission.end_date ?? '',
    status: mission.status,
    type: mission.type ?? 'chef',
    daily_rate: Number(mission.daily_rate),
    total_revenue: Number(mission.total_revenue),
    notes: mission.notes ?? '',
  };
}

export function toMissionRow(values: MissionFormValues) {
  const { id, ...fields } = values;
  return {
    ...(id ? { id } : {}),
    ...fields,
    client_email: fields.client_email || null,
    client_phone: fields.client_phone || null,
    location: fields.location || null,
    start_date: fields.start_date || null,
    end_date: fields.end_date || null,
    notes: fields.notes || null,
  };
}

/** Inclusive number of days between two ISO dates, optionally excluding weekends. */
export function missionDays(start: string, end: string, { weekdaysOnly = false } = {}): number {
  if (!start || !end || start > end) return 0;
  let days = 0;
  const cursor = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  while (cursor <= last) {
    const day = cursor.getDay();
    if (!weekdaysOnly || (day !== 0 && day !== 6)) days++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}
