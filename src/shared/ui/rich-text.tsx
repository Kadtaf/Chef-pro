import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { parseRichText } from '@/shared/lib/rich-text';

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={index} className="font-semibold text-neutral-900">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

/** Renders editorial rich text (see parseRichText for the supported syntax). */
export function RichText({ source, className }: { source: string; className?: string }) {
  return (
    <div className={cn('space-y-5 text-[1.05rem] leading-relaxed text-neutral-700', className)}>
      {parseRichText(source).map((block, index) => {
        switch (block.type) {
          case 'h2':
            return (
              <h2 key={index} className="pt-4 font-display text-3xl text-neutral-900">
                {inline(block.text)}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={index} className="pt-2 font-display text-2xl text-neutral-900">
                {inline(block.text)}
              </h3>
            );
          case 'p':
            return <p key={index}>{inline(block.text)}</p>;
          case 'ul':
            return (
              <ul key={index} className="space-y-2 pl-1">
                {block.items.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-2.5 size-1.5 shrink-0 rotate-45 bg-secondary-500" aria-hidden />
                    <span>{inline(item)}</span>
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={index} className="space-y-3">
                {block.items.map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-secondary-300 font-display text-lg text-primary-700">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{inline(item)}</span>
                  </li>
                ))}
              </ol>
            );
        }
      })}
    </div>
  );
}
