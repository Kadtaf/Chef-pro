import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';

type Course = { type: string; label: string };

/** Courses of the automatically composed seasonal menu, in serving order. */
export const MENU_COURSES: Course[] = [
  { type: 'entree', label: 'Entrée' },
  { type: 'plat', label: 'Plat' },
  { type: 'dessert', label: 'Dessert' },
];

/**
 * "Menu du Chef" composed from published recipes: for each course, the
 * best-rated recipe of the season (all-season recipes included).
 */
export function useSeasonalMenu(season: string) {
  return useQuery({
    queryKey: ['recipes', 'seasonal-menu', season],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const courses = await Promise.all(
        MENU_COURSES.map(async (course) => {
          const { data, error } = await supabase.rpc('search_recipes', {
            p_season: season,
            p_type: course.type,
            p_sort: 'rated',
            p_limit: 1,
          });
          if (error) throw error;
          return { ...course, recipe: data[0] ?? null };
        }),
      );
      return courses;
    },
  });
}

export function useSeasonRecipes(season: string, limit = 6) {
  return useQuery({
    queryKey: ['recipes', 'season', season, limit],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_recipes', {
        p_season: season,
        p_sort: 'popular',
        p_limit: limit,
      });
      if (error) throw error;
      return data;
    },
  });
}

/** Menus composed and published by the chef in the back-office. */
export function usePublishedMenus(season: string) {
  return useQuery({
    queryKey: ['menus', 'published', season],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menus')
        .select(
          'id, title, description, price, season, image_url, menu_items(position, item_type, custom_title, custom_description, recipes(title, slug))',
        )
        .eq('is_published', true)
        .in('season', [season, 'all'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((menu) => ({
        ...menu,
        menu_items: [...menu.menu_items].sort((a, b) => a.position - b.position),
      }));
    },
  });
}
