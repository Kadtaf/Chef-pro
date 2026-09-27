import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/** Fades content in when it scrolls into view (disabled with prefers-reduced-motion by CSS). */
export function Reveal({
  as: Tag = 'div',
  delay = 0,
  className,
  children,
}: {
  as?: ElementType;
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  // Without IntersectionObserver (old browsers, tests) content is shown immediately.
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} data-visible={visible} className={cn('reveal', className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
