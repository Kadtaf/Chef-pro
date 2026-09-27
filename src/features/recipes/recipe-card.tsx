import { Clock, Heart, Star } from 'lucide-react';
import { Link } from 'react-router';
import { useToggleFavorite } from '@/features/engagement/api';
import { SEASON_LABELS, labelOf } from '@/shared/domain/constants';
import { cn } from '@/shared/lib/cn';
import { formatDuration } from '@/shared/lib/format';
import { imageUrl } from '@/shared/lib/storage';
import { useFavorites } from '@/shared/lib/visitor';
import { SeasonIcon } from '@/shared/ui/culinary-icons';
import { NutriScoreBadge } from '@/shared/ui/nutri-score';

export type RecipeCardData = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  season: string | null;
  image_url: string | null;
  nutri_score: string | null;
  prep_time: number;
  cook_time: number;
  rating_avg?: number | null;
  rating_count?: number | null;
};

const FALLBACK = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800';

export function RecipeCard({ recipe, priority = false }: { recipe: RecipeCardData; priority?: boolean }) {
  const favorites = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const isFavorite = favorites.includes(recipe.id);
  const rating = Number(recipe.rating_avg ?? 0);

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-neutral-200">
        <img
          src={imageUrl(recipe.image_url, 720) ?? FALLBACK}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          className="size-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-neutral-950/55 via-transparent to-transparent" />
        {recipe.season && recipe.season !== 'all' && (
          <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-cream-50/90 px-3 py-1 text-xs font-medium text-neutral-800 backdrop-blur">
            <SeasonIcon season={recipe.season} className="size-3.5 text-secondary-600" />
            {labelOf(SEASON_LABELS, recipe.season)}
          </span>
        )}
        <button
          type="button"
          onClick={() => toggleFavorite(recipe.id, recipe.title)}
          aria-pressed={isFavorite}
          aria-label={
            isFavorite ? `Retirer « ${recipe.title} » des favoris` : `Ajouter « ${recipe.title} » aux favoris`
          }
          className="absolute top-4 right-4 z-10 flex size-10 items-center justify-center rounded-full bg-cream-50/90 text-primary-700 shadow-sm backdrop-blur transition-transform hover:scale-110"
        >
          <Heart key={String(isFavorite)} className={cn('size-5', isFavorite && 'animate-heart fill-primary-700')} />
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-5">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold tracking-[0.18em] text-secondary-700 uppercase">
          <span>{recipe.category}</span>
          <NutriScoreBadge grade={recipe.nutri_score} className="size-6 text-xs" />
        </div>
        <h3 className="mb-2 font-display text-2xl leading-snug text-neutral-900">
          <Link to={`/recettes/${recipe.slug}`} className="after:absolute after:inset-0 hover:text-primary-700">
            {recipe.title}
          </Link>
        </h3>
        {recipe.description && <p className="mb-4 line-clamp-2 text-sm text-neutral-600">{recipe.description}</p>}
        <div className="mt-auto flex items-center gap-4 text-sm text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden />
            {formatDuration(recipe.prep_time + recipe.cook_time)}
          </span>
          {rating > 0 && (
            <span className="flex items-center gap-1.5" title={`${recipe.rating_count ?? 0} avis`}>
              <Star className="size-4 fill-secondary-400 text-secondary-400" aria-hidden />
              {rating.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}
              <span className="sr-only">sur 5</span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
