import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import type { Json, Tables } from '@/shared/types/database';

export type Menu = Tables<'menus'>;
export type MenuItemWithRecipe = Tables<'menu_items'> & {
  recipes: Pick<
    Tables<'recipes'>,
    'id' | 'title' | 'slug' | 'description' | 'image_url' | 'calories_per_serving' | 'nutri_score' | 'cost_per_serving'
  > | null;
};
export type MenuWithItems = Menu & { menu_items: MenuItemWithRecipe[] };

export const menuKeys = {
  all: ['menus'] as const,
  list: ['menus', 'list'] as const,
  detail: (id: string) => ['menus', 'detail', id] as const,
};

export function useMenus() {
  return useQuery({
    queryKey: menuKeys.list,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menus')
        .select('*, menu_items(count)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(({ menu_items, ...menu }) => ({
        ...menu,
        itemCount: (menu_items as unknown as { count: number }[])[0]?.count ?? 0,
      }));
    },
  });
}

export function useMenu(id: string | undefined) {
  return useQuery({
    queryKey: menuKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menus')
        .select(
          '*, menu_items(*, recipes(id, title, slug, description, image_url, calories_per_serving, nutri_score, cost_per_serving))',
        )
        .eq('id', id!)
        .single();
      if (error) throw error;
      const menu = data as unknown as MenuWithItems;
      return { ...menu, menu_items: [...menu.menu_items].sort((a, b) => a.position - b.position) };
    },
  });
}

export type MenuPayload = { menu: Record<string, unknown>; items: Record<string, unknown>[] };

export async function saveMenu(payload: MenuPayload): Promise<string> {
  const { data, error } = await supabase.rpc('save_menu', {
    p_menu: payload.menu as Json,
    p_items: payload.items as Json,
  });
  if (error) throw error;
  return data;
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: menuKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['recipes'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
}

export function useSaveMenu() {
  const invalidate = useInvalidate();
  return useMutation({ meta: { successMessage: 'Menu enregistré' }, mutationFn: saveMenu, onSuccess: invalidate });
}

export function useToggleMenuPublished() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase.from('menus').update({ is_published }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteMenu() {
  const invalidate = useInvalidate();
  return useMutation({
    meta: { successMessage: 'Menu supprimé' },
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('menus').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
