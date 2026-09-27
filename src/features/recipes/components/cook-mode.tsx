import { ChevronLeft, ChevronRight, ListChecks, X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useEffect, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

type WakeLock = { release: () => Promise<void> };

/** Keeps the screen awake while cooking (Screen Wake Lock API, when available). */
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let lock: WakeLock | undefined;
    const nav = navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLock> } };
    void nav.wakeLock
      ?.request('screen')
      .then((l) => (lock = l))
      .catch(() => undefined);
    return () => void lock?.release().catch(() => undefined);
  }, [active]);
}

/** Full-screen, one-step-at-a-time view for cooking with the recipe open. */
export function CookMode({
  open,
  onOpenChange,
  title,
  steps,
  ingredients,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  steps: string[];
  ingredients: { name: string; quantity: string }[];
}) {
  const [index, setIndex] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  useWakeLock(open);
  const last = steps.length - 1;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') setIndex((i) => Math.min(last, i + 1));
      if (event.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, last]);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setIndex(0);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-neutral-950 text-cream-50 focus:outline-none">
          <header className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] text-secondary-400 uppercase">Mode cuisine</p>
              <DialogPrimitive.Title className="font-display text-2xl">{title}</DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                Étapes de la recette, une à une. Utilisez les flèches pour naviguer.
              </DialogPrimitive.Description>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="text-cream-50 hover:bg-white/10 hover:text-cream-50"
                aria-pressed={showIngredients}
                onClick={() => setShowIngredients((v) => !v)}
              >
                <ListChecks />
                <span className="hidden sm:inline">Ingrédients</span>
              </Button>
              <DialogPrimitive.Close asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-cream-50 hover:bg-white/10"
                  aria-label="Quitter le mode cuisine"
                >
                  <X />
                </Button>
              </DialogPrimitive.Close>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden">
            {showIngredients && (
              <aside className="w-full max-w-sm overflow-y-auto border-r border-white/10 p-6 max-sm:absolute max-sm:inset-x-0 max-sm:top-[73px] max-sm:bottom-0 max-sm:max-w-none max-sm:bg-neutral-950">
                <ul className="space-y-3">
                  {ingredients.map((i) => (
                    <li key={i.name} className="flex justify-between gap-3 border-b border-white/10 pb-3 text-lg">
                      <span>{i.name}</span>
                      <span className="text-secondary-300 tabular-nums">{i.quantity}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
            <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10 text-center">
              <p className="mb-6 font-display text-7xl text-secondary-400">{index + 1}</p>
              <p className="max-w-3xl text-2xl leading-relaxed md:text-4xl md:leading-snug" aria-live="polite">
                {steps[index]}
              </p>
            </div>
          </div>

          <footer className="flex items-center justify-between gap-4 border-t border-white/10 px-5 py-4">
            <Button
              variant="ghost"
              size="lg"
              className="text-cream-50 hover:bg-white/10"
              disabled={index === 0}
              onClick={() => setIndex((i) => i - 1)}
            >
              <ChevronLeft />
              Précédente
            </Button>
            <div className="flex gap-1.5" aria-label={`Étape ${index + 1} sur ${steps.length}`}>
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === index ? 'w-6 bg-secondary-400' : 'w-1.5 bg-white/25',
                  )}
                />
              ))}
            </div>
            {index < last ? (
              <Button
                size="lg"
                className="bg-secondary-500 text-neutral-950 hover:bg-secondary-400"
                onClick={() => setIndex((i) => i + 1)}
              >
                Suivante
                <ChevronRight />
              </Button>
            ) : (
              <DialogPrimitive.Close asChild>
                <Button size="lg" className="bg-secondary-500 text-neutral-950 hover:bg-secondary-400">
                  Bon appétit !
                </Button>
              </DialogPrimitive.Close>
            )}
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
