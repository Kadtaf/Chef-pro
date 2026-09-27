import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/shared/lib/cn';

/** Floating "back to top" button, shown once the visitor has scrolled down. */
export function ScrollToTop({ threshold = 600, className }: { threshold?: number; className?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setVisible(window.scrollY > threshold));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [threshold]);

  const scrollUp = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    // Keep keyboard users in the page flow: focus the main content.
    document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true });
  };

  return (
    <button
      type="button"
      onClick={scrollUp}
      aria-label="Revenir en haut de la page"
      title="Revenir en haut"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={cn(
        'fixed right-4 bottom-4 z-40 flex size-12 items-center justify-center rounded-full bg-primary-700 text-cream-50 shadow-lg ring-1 ring-secondary-400/40 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-800 focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:outline-none sm:right-6 sm:bottom-6 print:hidden',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
        className,
      )}
    >
      <ArrowUp className="size-5" aria-hidden />
    </button>
  );
}
