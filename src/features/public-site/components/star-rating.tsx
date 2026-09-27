import { Star } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={`${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={cn(
            size === 'sm' ? 'size-4' : 'size-5',
            i <= rating ? 'fill-accent-400 text-accent-400' : 'text-neutral-300',
          )}
        />
      ))}
    </span>
  );
}
