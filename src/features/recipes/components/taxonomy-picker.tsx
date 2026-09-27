import { Settings2 } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Link } from 'react-router';
import { TERM_KIND_LABELS, useTerms, type TermKind } from '@/features/taxonomy/api';
import { cn } from '@/shared/lib/cn';
import { RecipeTypeIcon } from '@/shared/ui/culinary-icons';
import { CardSection } from '@/shared/ui/feedback';

type FormWithTerms = { term_ids: string[] };

const KINDS: TermKind[] = ['type', 'technique', 'cuisine', 'tag'];

/** Blog classification of a recipe: types (filters), techniques, cuisine style and free tags. */
export function TaxonomyPicker() {
  const { control, setValue } = useFormContext<FormWithTerms>();
  const selected = useWatch({ control, name: 'term_ids' }) ?? [];
  const { data: terms = [] } = useTerms();

  const toggle = (id: string) =>
    setValue('term_ids', selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id], {
      shouldDirty: true,
    });

  const hasType = terms.some((t) => t.kind === 'type' && selected.includes(t.id));

  return (
    <CardSection
      title="Classement dans le blog"
      description={hasType ? undefined : 'Choisissez au moins un type : il détermine les filtres du blog.'}
      actions={
        <Link to="/admin/taxonomy" className="inline-flex items-center gap-1 text-sm text-primary-700 hover:underline">
          <Settings2 className="size-4" aria-hidden />
          Gérer
        </Link>
      }
    >
      <div className="space-y-5">
        {KINDS.map((kind) => {
          const options = terms.filter((t) => t.kind === kind);
          if (options.length === 0) return null;
          return (
            <fieldset key={kind}>
              <legend className="mb-2 text-sm font-medium text-neutral-700">{TERM_KIND_LABELS[kind].plural}</legend>
              <div className="flex flex-wrap gap-2">
                {options.map((term) => {
                  const active = selected.includes(term.id);
                  return (
                    <button
                      key={term.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggle(term.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors',
                        active
                          ? 'border-primary-700 bg-primary-700 text-white'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-300',
                      )}
                    >
                      {kind === 'type' && <RecipeTypeIcon icon={term.icon ?? term.slug} className="size-3.5" />}
                      {term.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
    </CardSection>
  );
}
