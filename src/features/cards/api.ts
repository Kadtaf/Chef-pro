import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import type { Json, Tables } from '@/shared/types/database';

export type Card = Tables<'cards'>;
export type CardSectionWithItems = Tables<'card_sections'> & {
  card_section_items: (Tables<'card_section_items'> & {
    recipes: Pick<Tables<'recipes'>, 'id' | 'title' | 'description' | 'nutri_score' | 'cost_per_serving'> | null;
  })[];
};
export type CardWithSections = Card & { card_sections: CardSectionWithItems[] };

export const cardKeys = {
  all: ['cards'] as const,
  list: ['cards', 'list'] as const,
  detail: (id: string) => ['cards', 'detail', id] as const,
};

export function useCards() {
  return useQuery({
    queryKey: cardKeys.list,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cards')
        .select('*, card_sections(count)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(({ card_sections, ...card }) => ({
        ...card,
        sectionCount: (card_sections as unknown as { count: number }[])[0]?.count ?? 0,
      }));
    },
  });
}

export function useCard(id: string | undefined) {
  return useQuery({
    queryKey: cardKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cards')
        .select(
          '*, card_sections(*, card_section_items(*, recipes(id, title, description, nutri_score, cost_per_serving)))',
        )
        .eq('id', id!)
        .single();
      if (error) throw error;
      const card = data as unknown as CardWithSections;
      return {
        ...card,
        card_sections: [...card.card_sections]
          .sort((a, b) => a.position - b.position)
          .map((section) => ({
            ...section,
            card_section_items: [...section.card_section_items].sort((a, b) => a.position - b.position),
          })),
      };
    },
  });
}

export type CardPayload = { card: Record<string, unknown>; sections: Record<string, unknown>[] };

export async function saveCard(payload: CardPayload): Promise<string> {
  const { data, error } = await supabase.rpc('save_card', {
    p_card: payload.card as Json,
    p_sections: payload.sections as Json,
  });
  if (error) throw error;
  return data;
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: cardKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
}

export function useSaveCard() {
  const invalidate = useInvalidate();
  return useMutation({ meta: { successMessage: 'Carte enregistrée' }, mutationFn: saveCard, onSuccess: invalidate });
}

export function useToggleCardPublished() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase.from('cards').update({ is_published }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteCard() {
  const invalidate = useInvalidate();
  return useMutation({
    meta: { successMessage: 'Carte supprimée' },
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
