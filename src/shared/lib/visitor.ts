import { useSyncExternalStore } from 'react';

/**
 * Anonymous visitor state kept in the browser only (no account, no cookie):
 * a random visitor id (one rating per recipe and visitor), favourites and
 * the ratings already given. Every access is guarded: storage may be
 * unavailable (private mode, blocked site data).
 */
const KEYS = { visitor: 'cp:visitor', favorites: 'cp:favorites', ratings: 'cp:ratings' } as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: state lives for this page only */
  }
}

let memoryVisitorId: string | undefined;

export function visitorId(): string {
  const stored = read<string | null>(KEYS.visitor, null);
  if (stored) return stored;
  memoryVisitorId ??= crypto.randomUUID();
  write(KEYS.visitor, memoryVisitorId);
  return memoryVisitorId;
}

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((listener) => listener());

let favoritesCache: string[] | null = null;
let ratingsCache: Record<string, number> | null = null;

function subscribe(listener: Listener) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEYS.favorites) favoritesCache = null;
    if (event.key === KEYS.ratings) ratingsCache = null;
    listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function getFavorites(): string[] {
  favoritesCache ??= read<string[]>(KEYS.favorites, []);
  return favoritesCache;
}

/** Toggles a favourite and returns whether the recipe is now a favourite. */
export function toggleFavorite(recipeId: string): boolean {
  const current = getFavorites();
  const isFavorite = !current.includes(recipeId);
  favoritesCache = isFavorite ? [recipeId, ...current] : current.filter((id) => id !== recipeId);
  write(KEYS.favorites, favoritesCache);
  emit();
  return isFavorite;
}

export function useFavorites(): string[] {
  return useSyncExternalStore(subscribe, getFavorites, () => []);
}

export function getRatings(): Record<string, number> {
  ratingsCache ??= read<Record<string, number>>(KEYS.ratings, {});
  return ratingsCache;
}

export function rememberRating(recipeId: string, rating: number): void {
  ratingsCache = { ...getRatings(), [recipeId]: rating };
  write(KEYS.ratings, ratingsCache);
  emit();
}

export function useMyRating(recipeId: string): number | undefined {
  return useSyncExternalStore(
    subscribe,
    () => getRatings()[recipeId],
    () => undefined,
  );
}
