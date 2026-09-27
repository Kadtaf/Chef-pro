import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { EngageRequest } from '@ai-contract';
import { toUserMessage } from '@/shared/lib/errors';
import { invokeFunction } from '@/shared/lib/functions';
import { rememberRating, toggleFavorite, visitorId } from '@/shared/lib/visitor';

type Counters = { views: number; likes: number; rating_avg: number; rating_count: number };

function engage(event: EngageRequest['event'], recipeId: string, rating?: number) {
  return invokeFunction<Counters>('engage', {
    recipe_id: recipeId,
    visitor_id: visitorId(),
    event,
    rating,
  } satisfies EngageRequest);
}

const VIEWED_KEY = 'cp:viewed';

/** Counts one view per recipe and browser session (best effort, never blocks the page). */
export function useTrackView(recipeId: string | undefined) {
  useEffect(() => {
    if (!recipeId) return;
    try {
      const viewed = new Set(JSON.parse(sessionStorage.getItem(VIEWED_KEY) ?? '[]') as string[]);
      if (viewed.has(recipeId)) return;
      viewed.add(recipeId);
      sessionStorage.setItem(VIEWED_KEY, JSON.stringify([...viewed]));
    } catch {
      /* storage unavailable: still count the view */
    }
    void engage('view', recipeId).catch(() => undefined);
  }, [recipeId]);
}

/** Toggles a favourite locally (instant) and records the like for statistics. */
export function useToggleFavorite() {
  return (recipeId: string, title: string) => {
    const isFavorite = toggleFavorite(recipeId);
    toast.success(isFavorite ? `« ${title} » ajoutée à vos favoris` : 'Retirée de vos favoris');
    void engage(isFavorite ? 'like' : 'unlike', recipeId).catch(() => undefined);
  };
}

export function useRateRecipe(recipeSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { toastOnError: false },
    mutationFn: ({ recipeId, rating }: { recipeId: string; rating: number }) => engage('rate', recipeId, rating),
    onSuccess: (_counters, { recipeId, rating }) => {
      rememberRating(recipeId, rating);
      toast.success('Merci pour votre note !');
      return queryClient.invalidateQueries({ queryKey: ['recipes', 'slug', recipeSlug] });
    },
    onError: (error) => toast.error(toUserMessage(error)),
  });
}
