import { useMutation, useQuery } from '@tanstack/react-query';
import type { PublicSubmitRequest } from '@ai-contract';
import { createCrud } from '@/shared/lib/crud';
import { invokeFunction } from '@/shared/lib/functions';
import { supabase } from '@/shared/lib/supabase';
import type { Tables } from '@/shared/types/database';

export type Review = Tables<'comments'>;

export const commentsCrud = createCrud('comments', {
  label: 'Avis',
  orderBy: [{ column: 'created_at', ascending: false }],
});

export function usePublicReviews(limit?: number) {
  return useQuery({
    queryKey: ['comments', 'public', limit ?? 'all'],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      let query = supabase
        .from('comments')
        .select('id, author_name, rating, content, source, response, created_at')
        .eq('is_approved', true)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      if (limit) query = query.not('rating', 'is', null).limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

/** Sends a public form (contact or review) through the protected edge function. */
export function usePublicSubmit() {
  return useMutation({
    meta: { toastOnError: false },
    mutationFn: (payload: PublicSubmitRequest) => invokeFunction<{ ok: boolean }>('public-submit', payload),
  });
}
