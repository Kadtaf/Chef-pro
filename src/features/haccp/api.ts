import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCrud } from '@/shared/lib/crud';
import { supabase } from '@/shared/lib/supabase';
import type { ChecklistItem } from './schema';

export const haccpCrud = createCrud('haccp_records', {
  label: 'Enregistrement HACCP',
  orderBy: [{ column: 'created_at', ascending: false }],
});

/** Ticks checklist items and/or sets the final status of a record. */
export function useUpdateHaccpProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      checklist,
      status,
    }: {
      id: string;
      checklist?: ChecklistItem[];
      status?: 'pending' | 'completed' | 'failed';
    }) => {
      const { error } = await supabase
        .from('haccp_records')
        .update({
          ...(checklist ? { checklist_items: checklist } : {}),
          ...(status ? { status, completed_at: status === 'pending' ? null : new Date().toISOString() } : {}),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: haccpCrud.keys.all }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]),
  });
}
