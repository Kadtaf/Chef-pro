import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCrud } from '@/shared/lib/crud';
import { supabase } from '@/shared/lib/supabase';
import type { Tables } from '@/shared/types/database';

export type Term = Tables<'taxonomy_terms'>;
export type TermKind = 'type' | 'technique' | 'cuisine' | 'tag';
export type Season = Tables<'seasons'>;

export const TERM_KIND_LABELS: Record<TermKind, { singular: string; plural: string; hint: string }> = {
  type: {
    singular: 'Type de recette',
    plural: 'Types de recettes',
    hint: 'Filtres principaux du blog (entrée, plat, dessert…)',
  },
  technique: { singular: 'Technique', plural: 'Techniques culinaires', hint: 'Tags affichés sur les fiches recettes' },
  cuisine: {
    singular: 'Style de cuisine',
    plural: 'Styles de cuisine',
    hint: 'Traditionnelle, bistronomique… (Studio IA)',
  },
  tag: { singular: 'Tag', plural: 'Tags libres', hint: 'Mots-clés éditoriaux complémentaires' },
};

export const termsCrud = createCrud('taxonomy_terms', {
  label: 'Élément',
  orderBy: [{ column: 'kind' }, { column: 'position' }, { column: 'name' }],
  alsoInvalidate: [['terms']],
});

/** Public taxonomy (all kinds), cached for a long time: it rarely changes. */
export function useTerms(kind?: TermKind) {
  return useQuery({
    queryKey: ['terms'],
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('taxonomy_terms').select('*').order('position').order('name');
      if (error) throw error;
      return data;
    },
    select: (terms) => (kind ? terms.filter((t) => t.kind === kind) : terms),
  });
}

export function useSeasons() {
  return useQuery({
    queryKey: ['seasons'],
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('seasons').select('*').order('position');
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { successMessage: 'Saison mise à jour' },
    mutationFn: async ({ slug, ...values }: Pick<Season, 'slug'> & Partial<Omit<Season, 'slug'>>) => {
      const { error } = await supabase.from('seasons').update(values).eq('slug', slug);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seasons'] }),
  });
}

/** Season of a date (Northern hemisphere, meteorological seasons). */
export function currentSeason(date = new Date()): 'printemps' | 'ete' | 'automne' | 'hiver' {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'printemps';
  if (month >= 6 && month <= 8) return 'ete';
  if (month >= 9 && month <= 11) return 'automne';
  return 'hiver';
}

/** French phrasing per season ("le menu d'été", "ce printemps"…). */
export const SEASON_WORDING: Record<string, { menu: string; now: string }> = {
  printemps: { menu: 'Le menu de printemps', now: 'ce printemps' },
  ete: { menu: "Le menu d'été", now: 'cet été' },
  automne: { menu: "Le menu d'automne", now: 'cet automne' },
  hiver: { menu: "Le menu d'hiver", now: 'cet hiver' },
};
