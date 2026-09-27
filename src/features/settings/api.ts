import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import type { Tables, TablesUpdate } from '@/shared/types/database';

export type SiteSettings = Tables<'settings'>;

export const settingsKey = ['settings'] as const;

export const DEFAULT_SETTINGS: Pick<
  SiteSettings,
  'site_name' | 'site_description' | 'email' | 'phone' | 'address' | 'seo_title' | 'seo_description'
> = {
  site_name: 'Chef Pro Bordeaux',
  site_description: 'Chef de cuisine freelance à Bordeaux',
  email: 'contact@chef-pro-bordeaux.fr',
  phone: '',
  address: 'Bordeaux, France',
  seo_title: 'Chef Pro Bordeaux — Chef de cuisine freelance',
  seo_description: 'Chef de cuisine freelance à Bordeaux : second de cuisine, consulting culinaire, chef à domicile.',
};

export function useSiteSettings() {
  return useQuery({
    queryKey: settingsKey,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*').maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { successMessage: 'Paramètres enregistrés' },
    mutationFn: async ({ id, ...values }: TablesUpdate<'settings'> & { id: string }) => {
      const { data, error } = await supabase.from('settings').update(values).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => queryClient.setQueryData(settingsKey, data),
  });
}
