import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import type { Database, Json, Tables } from '@/shared/types/database';
import type { RecipePayload } from './schema';

export type Recipe = Tables<'recipes'>;
export type RecipeTerm = Pick<Tables<'taxonomy_terms'>, 'id' | 'kind' | 'name' | 'slug' | 'icon'>;
export type RecipeWithChildren = Recipe & {
  recipe_ingredients: Tables<'recipe_ingredients'>[];
  recipe_steps: Tables<'recipe_steps'>[];
  recipe_terms: { term_id: string; taxonomy_terms: RecipeTerm | null }[];
};

/** Row returned by the search_recipes RPC (blog listing). */
export type RecipeSummary = Database['public']['Functions']['search_recipes']['Returns'][number];

export type BlogFilters = {
  q?: string;
  season?: string;
  type?: string;
  sort?: 'recent' | 'popular' | 'rated' | 'quick';
  page?: number;
};

export const BLOG_PAGE_SIZE = 12;

export type RecipeFilters = {
  search?: string;
  category?: string;
  status?: 'all' | 'published' | 'draft';
  page?: number;
};

export const PAGE_SIZE = 20;

export const recipeKeys = {
  all: ['recipes'] as const,
  adminList: (filters: RecipeFilters) => ['recipes', 'admin', filters] as const,
  detail: (id: string) => ['recipes', 'detail', id] as const,
  published: ['recipes', 'published'] as const,
  featured: ['recipes', 'featured'] as const,
  bySlug: (slug: string) => ['recipes', 'slug', slug] as const,
  options: ['recipes', 'options'] as const,
  blog: (filters: BlogFilters) => ['recipes', 'blog', filters] as const,
  related: (id: string) => ['recipes', 'related', id] as const,
  byIds: (ids: string[]) => ['recipes', 'ids', ids] as const,
  pairings: ['recipes', 'pairings'] as const,
};

const LIST_COLUMNS =
  'id, title, slug, description, category, season, difficulty, prep_time, cook_time, servings, image_url, calories_per_serving, cost_per_serving, nutri_score, is_published, is_featured, created_at, views_count, likes_count, rating_avg, rating_count';

const WITH_CHILDREN =
  '*, recipe_ingredients(*), recipe_steps(*), recipe_terms(term_id, taxonomy_terms(id, kind, name, slug, icon))';

function sortChildren(recipe: RecipeWithChildren): RecipeWithChildren {
  return {
    ...recipe,
    recipe_ingredients: [...recipe.recipe_ingredients].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    recipe_steps: [...recipe.recipe_steps].sort((a, b) => a.step_number - b.step_number),
  };
}

/* ---------------------------------- Public --------------------------------- */

export function usePublishedRecipes() {
  return useQuery({
    queryKey: recipeKeys.published,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select(LIST_COLUMNS)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useFeaturedRecipes(limit = 3) {
  return useQuery({
    queryKey: [...recipeKeys.featured, limit],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select(LIST_COLUMNS)
        .eq('is_published', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}

export function usePublishedRecipe(slug: string | undefined) {
  return useQuery({
    queryKey: recipeKeys.bySlug(slug ?? ''),
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select(WITH_CHILDREN)
        .eq('slug', slug!)
        .eq('is_published', true)
        .maybeSingle();
      if (error) throw error;
      return data ? sortChildren(data) : null;
    },
  });
}

/** Blog listing: server-side search, filters, sort and pagination. */
export function useBlogRecipes(filters: BlogFilters) {
  return useQuery({
    queryKey: recipeKeys.blog(filters),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const page = filters.page ?? 0;
      const { data, error } = await supabase.rpc('search_recipes', {
        p_query: filters.q || undefined,
        p_season: filters.season || undefined,
        p_type: filters.type || undefined,
        p_sort: filters.sort ?? 'recent',
        p_limit: BLOG_PAGE_SIZE,
        p_offset: page * BLOG_PAGE_SIZE,
      });
      if (error) throw error;
      return { rows: data, total: Number(data[0]?.total_count ?? 0) };
    },
  });
}

export function useRelatedRecipes(recipeId: string | undefined, limit = 3) {
  return useQuery({
    queryKey: recipeKeys.related(recipeId ?? ''),
    enabled: !!recipeId,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('related_recipes', { p_recipe_id: recipeId!, p_limit: limit });
      if (error) throw error;
      return data;
    },
  });
}

/** Published recipes by id, kept in the given order (favourites page). */
export function useRecipesByIds(ids: string[]) {
  return useQuery({
    queryKey: recipeKeys.byIds(ids),
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select(LIST_COLUMNS)
        .in('id', ids)
        .eq('is_published', true);
      if (error) throw error;
      return ids.flatMap((id) => data.filter((r) => r.id === id));
    },
  });
}

export function useWinePairings() {
  return useQuery({
    queryKey: recipeKeys.pairings,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('id, title, slug, image_url, category, season, wine_pairing')
        .eq('is_published', true)
        .not('wine_pairing', 'is', null)
        .neq('wine_pairing', '')
        .order('title');
      if (error) throw error;
      return data;
    },
  });
}

/* ---------------------------------- Admin ---------------------------------- */

export function useAdminRecipes(filters: RecipeFilters) {
  return useQuery({
    queryKey: recipeKeys.adminList(filters),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const page = filters.page ?? 0;
      let query = supabase
        .from('recipes')
        .select(LIST_COLUMNS, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (filters.search) query = query.ilike('title', `%${filters.search.replace(/[%_]/g, '\\$&')}%`);
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.status === 'published') query = query.eq('is_published', true);
      if (filters.status === 'draft') query = query.eq('is_published', false);
      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data, total: count ?? 0 };
    },
  });
}

/** Lightweight list used by pickers (menus, cards). */
export function useRecipeOptions() {
  return useQuery({
    queryKey: recipeKeys.options,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('id, title, category, calories_per_serving, nutri_score, cost_per_serving')
        .order('title');
      if (error) throw error;
      return data;
    },
  });
}

export function useRecipe(id: string | undefined) {
  return useQuery({
    queryKey: recipeKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('recipes').select(WITH_CHILDREN).eq('id', id!).single();
      if (error) throw error;
      return sortChildren(data);
    },
  });
}

export async function saveRecipe(payload: RecipePayload): Promise<string> {
  const { data, error } = await supabase.rpc('save_recipe', {
    p_recipe: payload.recipe as unknown as Json,
    p_ingredients: payload.ingredients as unknown as Json,
    p_steps: payload.steps as unknown as Json,
    p_term_ids: payload.termIds,
  });
  if (error) throw error;
  return data;
}

function useInvalidateRecipes() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: recipeKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
}

export function useSaveRecipe() {
  const invalidate = useInvalidateRecipes();
  return useMutation({
    meta: { successMessage: 'Recette enregistrée' },
    mutationFn: saveRecipe,
    onSuccess: invalidate,
  });
}

export function useUpdateRecipeFlags() {
  const invalidate = useInvalidateRecipes();
  return useMutation({
    mutationFn: async ({ id, ...flags }: { id: string; is_published?: boolean; is_featured?: boolean }) => {
      const { error } = await supabase.from('recipes').update(flags).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteRecipe() {
  const invalidate = useInvalidateRecipes();
  return useMutation({
    meta: { successMessage: 'Recette supprimée' },
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recipes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
