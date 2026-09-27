import { cn } from '@/shared/lib/cn';

const GRADES = ['A', 'B', 'C', 'D', 'E'] as const;

const COLORS: Record<(typeof GRADES)[number], string> = {
  A: 'bg-[#038141] text-white',
  B: 'bg-[#85bb2f] text-white',
  C: 'bg-[#fecb02] text-neutral-900',
  D: 'bg-[#ee8100] text-white',
  E: 'bg-[#e63e11] text-white',
};

function isGrade(value: string | null | undefined): value is (typeof GRADES)[number] {
  return !!value && (GRADES as readonly string[]).includes(value);
}

/** Compact badge (single letter). */
export function NutriScoreBadge({ grade, className }: { grade: string | null | undefined; className?: string }) {
  if (!isGrade(grade)) return null;
  return (
    <span
      className={cn(
        'inline-flex size-7 items-center justify-center rounded-md text-sm font-bold',
        COLORS[grade],
        className,
      )}
      title={`Nutri-Score ${grade} (estimation)`}
    >
      {grade}
      <span className="sr-only"> Nutri-Score</span>
    </span>
  );
}

/** Full five-letter scale with the current grade highlighted. */
export function NutriScoreScale({ grade }: { grade: string | null | undefined }) {
  return (
    <div className="inline-flex flex-col items-start gap-1">
      <div
        className="flex items-end gap-0.5"
        role="img"
        aria-label={isGrade(grade) ? `Nutri-Score ${grade}` : 'Nutri-Score non calculé'}
      >
        {GRADES.map((g) => (
          <span
            key={g}
            className={cn(
              'flex items-center justify-center rounded font-bold transition-all',
              COLORS[g],
              g === grade ? 'size-10 text-lg ring-2 ring-neutral-900/20' : 'size-7 text-xs opacity-40',
            )}
          >
            {g}
          </span>
        ))}
      </div>
      <span className="text-xs text-neutral-500">
        {isGrade(grade) ? 'Nutri-Score estimé (algorithme 2023)' : 'Nutri-Score non calculé (poids de portion inconnu)'}
      </span>
    </div>
  );
}
