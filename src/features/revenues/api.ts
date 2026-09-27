import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { amount } from '@/features/culinary/schema';
import { createCrud } from '@/shared/lib/crud';
import { supabase } from '@/shared/lib/supabase';
import type { Tables } from '@/shared/types/database';

export type Revenue = Tables<'revenues'>;

export const revenuesCrud = createCrud('revenues', {
  label: 'Encaissement',
  orderBy: [{ column: 'date_received', ascending: false }],
  alsoInvalidate: [['missions']],
});

export function useRevenuesByYear(year: number) {
  return useQuery({
    queryKey: ['revenues', 'year', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenues')
        .select('*, missions(id, title, client_name)')
        .gte('date_received', `${year}-01-01`)
        .lte('date_received', `${year}-12-31`)
        .order('date_received', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export const revenueFormSchema = z.object({
  amount: amount().pipe(z.number().positive('Montant requis')),
  date_received: z.iso.date('Date invalide'),
  source: z.string().trim().max(200),
  description: z.string().trim().max(1000),
  mission_id: z.string().nullable(),
  payment_method: z.string().max(40),
  invoice_number: z.string().trim().max(60),
});
export type RevenueFormInput = z.input<typeof revenueFormSchema>;
export type RevenueFormValues = z.output<typeof revenueFormSchema>;

export const emptyRevenue = (missionId: string | null = null): RevenueFormValues => ({
  amount: 0,
  date_received: new Date().toISOString().slice(0, 10),
  source: '',
  description: '',
  mission_id: missionId,
  payment_method: 'Virement',
  invoice_number: '',
});

export function toRevenueRow(values: RevenueFormValues) {
  return {
    ...values,
    source: values.source || null,
    description: values.description || null,
    payment_method: values.payment_method || null,
    invoice_number: values.invoice_number || null,
  };
}
