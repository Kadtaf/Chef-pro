import { useQuery } from '@tanstack/react-query';
import { createCrud } from '@/shared/lib/crud';
import { supabase } from '@/shared/lib/supabase';

export const missionsCrud = createCrud('missions', {
  label: 'Mission',
  orderBy: [
    { column: 'start_date', ascending: false },
    { column: 'created_at', ascending: false },
  ],
  alsoInvalidate: [['revenues']],
});

/** Payments received for a mission. */
export function useMissionRevenues(missionId: string | undefined) {
  return useQuery({
    queryKey: ['revenues', 'mission', missionId],
    enabled: !!missionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenues')
        .select('*')
        .eq('mission_id', missionId!)
        .order('date_received', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useMissionOptions() {
  return useQuery({
    queryKey: ['missions', 'options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('missions')
        .select('id, title, client_name')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
