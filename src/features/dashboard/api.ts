import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/shared/lib/supabase';

const count = z.coerce.number();

/** Shape of the `dashboard_stats()` RPC (validated: it is a JSON blob). */
const statsSchema = z.object({
  recipes: count,
  technicalSheets: count,
  menus: count,
  cards: count,
  missions: z.object({ total: count, inProgress: count, pending: count }),
  revenues: z.object({ total: count, thisMonth: count }),
  comments: z.object({ total: count, pending: count }),
  contactSubmissions: z.object({ total: count, unread: count }),
  haccp: z.object({ pending: count, failed: count }),
  monthly: z.array(z.object({ month: z.string(), revenues: count, missions: count })),
});
export type DashboardStats = z.infer<typeof statsSchema>;

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('dashboard_stats');
      if (error) throw error;
      return statsSchema.parse(data);
    },
  });
}

export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: ['dashboard', 'activity', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('id, action, entity_type, entity_id, details, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}
