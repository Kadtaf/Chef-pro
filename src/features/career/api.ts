import { useQuery } from '@tanstack/react-query';
import { createCrud } from '@/shared/lib/crud';
import { supabase } from '@/shared/lib/supabase';
import type { Tables } from '@/shared/types/database';

export type CareerExperience = Tables<'career_experiences'>;

export const careerCrud = createCrud('career_experiences', {
  label: 'Expérience',
  orderBy: [{ column: 'position' }, { column: 'start_year', ascending: false }],
});

export function usePublishedCareer() {
  return useQuery({
    queryKey: ['career_experiences', 'published'],
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('career_experiences')
        .select('*')
        .eq('is_published', true)
        .order('position')
        .order('start_year', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function careerPeriod(experience: Pick<CareerExperience, 'start_year' | 'end_year'>): string {
  if (experience.end_year === null) return `Depuis ${experience.start_year}`;
  if (experience.end_year === experience.start_year) return String(experience.start_year);
  return `${experience.start_year} – ${experience.end_year}`;
}

export function careerYears(experience: Pick<CareerExperience, 'start_year' | 'end_year'>): number {
  const end = experience.end_year ?? new Date().getFullYear();
  return Math.max(1, end - experience.start_year);
}
