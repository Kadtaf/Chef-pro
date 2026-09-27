import { Star } from 'lucide-react';
import { useState } from 'react';
import { useRateRecipe } from '@/features/engagement/api';
import { cn } from '@/shared/lib/cn';
import { useMyRating } from '@/shared/lib/visitor';

/** Anonymous 1–5 star rating (one vote per visitor, editable). */
export function RatingWidget({
  recipeId,
  recipeSlug,
  average,
  count,
}: {
  recipeId: string;
  recipeSlug: string;
  average: number;
  count: number;
}) {
  const mine = useMyRating(recipeId);
  const [hover, setHover] = useState<number | null>(null);
  const rate = useRateRecipe(recipeSlug);
  const shown = hover ?? mine ?? 0;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center">
      <p className="eyebrow justify-center">Votre avis</p>
      <h2 className="mb-2 text-3xl text-neutral-900">
        {mine ? 'Merci pour votre note' : 'Avez-vous réalisé cette recette ?'}
      </h2>
      <p className="mb-5 text-sm text-neutral-500">
        {count > 0
          ? `Note moyenne ${average.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}/5 · ${count} note${count > 1 ? 's' : ''}`
          : 'Soyez le premier à la noter.'}
      </p>
      <div onMouseLeave={() => setHover(null)}>
        <div className="flex justify-center gap-1" role="radiogroup" aria-label="Noter la recette">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mine === value}
              aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
              disabled={rate.isPending}
              onMouseEnter={() => setHover(value)}
              onFocus={() => setHover(value)}
              onBlur={() => setHover(null)}
              onClick={() => rate.mutate({ recipeId, rating: value })}
              className="rounded p-1 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  'size-9 transition-colors',
                  value <= shown ? 'fill-secondary-400 text-secondary-400' : 'text-neutral-300',
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
