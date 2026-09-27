import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import type { Tables, TablesInsert } from '@/shared/types/database';

export type Service = Tables<'services'>;

export const serviceKeys = {
  all: ['services'] as const,
  published: ['services', 'published'] as const,
  admin: ['services', 'admin'] as const,
};

/** Normalises the JSONB `features` column into a list of strings. */
export function serviceFeatures(features: Service['features']): string[] {
  if (Array.isArray(features)) return features.map(String);
  if (typeof features === 'string') {
    try {
      const parsed: unknown = JSON.parse(features);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function usePublishedServices() {
  return useQuery({
    queryKey: serviceKeys.published,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_published', true)
        .order('position')
        .order('created_at');
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminServices() {
  return useQuery({
    queryKey: serviceKeys.admin,
    queryFn: async () => {
      const { data, error } = await supabase.from('services').select('*').order('position').order('created_at');
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveService() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { successMessage: 'Service enregistré' },
    mutationFn: async ({ id, ...values }: TablesInsert<'services'> & { id?: string }) => {
      const query = id
        ? supabase.from('services').update(values).eq('id', id)
        : supabase.from('services').insert(values);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { successMessage: 'Service supprimé' },
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}
