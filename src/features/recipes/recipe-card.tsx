import { Clock, Flame, Users } from 'lucide-react';
import { Link } from 'react-router';
import { SEASON_LABELS, labelOf } from '@/shared/domain/constants';
import { formatDuration } from '@/shared/lib/format';
import { imageUrl } from '@/shared/lib/storage';
import { Badge } from '@/shared/ui/feedback';
import { NutriScoreBadge } from '@/shared/ui/nutri-score';
import type { Recipe } from './api';

type RecipeSummary = Pick<
  Recipe,
  | 'id'
  | 'slug'
  | 'title'
  | 'description'
  | 'category'
  | 'season'
  | 'image_url'
  | 'nutri_score'
  | 'prep_time'
  | 'cook_time'
  | 'servings'
  | 'calories_per_serving'
  | 'is_featured'
>;

const FALLBACK = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600';

export function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  return (
    <Link
      to={`/recettes/${recipe.slug}`}
      className="group overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-sm transition-all duration-300 hover:border-neutral-200 hover:shadow-lg"
    >
      <div className="relative aspect-4/3 overflow-hidden">
        <img
          src={imageUrl(recipe.image_url, 640) ?? FALLBACK}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {recipe.is_featured && <Badge className="absolute top-3 left-3 bg-accent-500 text-white">Vedette</Badge>}
      </div>
      <div className="p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone="primary">{recipe.category}</Badge>
          <NutriScoreBadge grade={recipe.nutri_score} className="size-6 text-xs" />
          {recipe.season && recipe.season !== 'all' && <Badge>{labelOf(SEASON_LABELS, recipe.season)}</Badge>}
        </div>
        <h3 className="mb-2 line-clamp-1 text-xl font-semibold text-neutral-900 group-hover:text-primary-700">
          {recipe.title}
        </h3>
        {recipe.description && <p className="mb-4 line-clamp-2 text-sm text-neutral-600">{recipe.description}</p>}
        <ul className="flex items-center gap-4 text-sm text-neutral-500">
          <li className="flex items-center gap-1">
            <Clock className="size-4" aria-hidden />
            {formatDuration(recipe.prep_time + recipe.cook_time)}
          </li>
          <li className="flex items-center gap-1">
            <Users className="size-4" aria-hidden />
            {recipe.servings} pers.
          </li>
          <li className="flex items-center gap-1">
            <Flame className="size-4" aria-hidden />
            {Math.round(recipe.calories_per_serving)} kcal
          </li>
        </ul>
      </div>
    </Link>
  );
}
