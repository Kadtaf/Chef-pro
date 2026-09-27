import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import type { Json, Tables } from '@/shared/types/database';
import type { SheetPayload } from './schema';

export type TechnicalSheet = Tables<'technical_sheets'>;
export type SheetWithChildren = TechnicalSheet & {
  technical_sheet_ingredients: Tables<'technical_sheet_ingredients'>[];
  technical_sheet_steps: Tables<'technical_sheet_steps'>[];
};

export const sheetKeys = {
  all: ['technical_sheets'] as const,
  list: ['technical_sheets', 'list'] as const,
  detail: (id: string) => ['technical_sheets', 'detail', id] as const,
  options: ['technical_sheets', 'options'] as const,
};

export function useSheets() {
  return useQuery({
    queryKey: sheetKeys.list,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('technical_sheets')
        .select(
          'id, title, slug, category, description, image_url, total_cost, cost_per_portion, selling_price, margin_ratio, portions, nutri_score, is_published, allergens, created_at',
        )
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSheetOptions() {
  return useQuery({
    queryKey: sheetKeys.options,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('technical_sheets')
        .select('id, title, category, selling_price, cost_per_portion')
        .order('title');
      if (error) throw error;
      return data;
    },
  });
}

export function useSheet(id: string | undefined) {
  return useQuery({
    queryKey: sheetKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('technical_sheets')
        .select('*, technical_sheet_ingredients(*), technical_sheet_steps(*)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      const sheet = data as SheetWithChildren;
      return {
        ...sheet,
        technical_sheet_ingredients: [...sheet.technical_sheet_ingredients].sort((a, b) =>
          a.created_at.localeCompare(b.created_at),
        ),
        technical_sheet_steps: [...sheet.technical_sheet_steps].sort((a, b) => a.step_number - b.step_number),
      };
    },
  });
}

export async function saveSheet(payload: SheetPayload): Promise<string> {
  const { data, error } = await supabase.rpc('save_technical_sheet', {
    p_sheet: payload.sheet as unknown as Json,
    p_ingredients: payload.ingredients as unknown as Json,
    p_steps: payload.steps as unknown as Json,
  });
  if (error) throw error;
  return data;
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: sheetKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
}

export function useSaveSheet() {
  const invalidate = useInvalidate();
  return useMutation({
    meta: { successMessage: 'Fiche technique enregistrée' },
    mutationFn: saveSheet,
    onSuccess: invalidate,
  });
}

export function useToggleSheetPublished() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase.from('technical_sheets').update({ is_published }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteSheet() {
  const invalidate = useInvalidate();
  return useMutation({
    meta: { successMessage: 'Fiche technique supprimée' },
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('technical_sheets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
