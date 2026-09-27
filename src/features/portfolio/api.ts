import { useQuery } from '@tanstack/react-query';
import { createCrud } from '@/shared/lib/crud';
import { supabase } from '@/shared/lib/supabase';
import type { Tables } from '@/shared/types/database';

export type PortfolioItem = Tables<'portfolio_items'>;

export const PORTFOLIO_CATEGORIES = ['Restaurant', 'Événement', 'Traiteur', 'Consulting', 'Formation', 'Autre'];

export const portfolioCrud = createCrud('portfolio_items', {
  label: 'Projet',
  orderBy: [{ column: 'position' }, { column: 'created_at', ascending: false }],
});

export function usePublishedPortfolio(options: { featuredOnly?: boolean; limit?: number } = {}) {
  return useQuery({
    queryKey: ['portfolio_items', 'published', options],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      let query = supabase
        .from('portfolio_items')
        .select('id, title, description, category, image_url, project_date, client_name, is_featured')
        .eq('is_published', true)
        .order('position')
        .order('created_at', { ascending: false });
      if (options.featuredOnly) query = query.eq('is_featured', true);
      if (options.limit) query = query.limit(options.limit);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
