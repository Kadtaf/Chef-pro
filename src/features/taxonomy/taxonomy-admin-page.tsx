import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { Tabs } from 'radix-ui';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { RECIPE_TYPE_SLUGS } from '@ai-contract/vocabulary';
import { slugify } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { useConfirm } from '@/shared/ui/confirm-context';
import { RecipeTypeIcon, SeasonIcon } from '@/shared/ui/culinary-icons';
import { Dialog } from '@/shared/ui/dialog';
import { Card, CardSection, EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Field, Input, Select, Textarea } from '@/shared/ui/form';
import { ImageField } from '@/shared/ui/image-field';
import { PageHeader } from '@/shared/ui/layout';
import { TERM_KIND_LABELS, termsCrud, useSeasons, useUpdateSeason, type Season, type Term, type TermKind } from './api';

const KINDS: TermKind[] = ['type', 'technique', 'cuisine', 'tag'];

const termSchema = z.object({
  name: z.string().trim().min(1, 'Nom requis').max(60),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/, 'Minuscules, chiffres et tirets'),
  description: z.string().trim().max(300),
  icon: z.string(),
});
type TermValues = z.infer<typeof termSchema>;

function TermDialog({
  kind,
  term,
  nextPosition,
  onClose,
}: {
  kind: TermKind;
  term?: Term;
  nextPosition: number;
  onClose: () => void;
}) {
  const save = termsCrud.useSave();
  const form = useForm<TermValues>({
    resolver: zodResolver(termSchema),
    defaultValues: {
      name: term?.name ?? '',
      slug: term?.slug ?? '',
      description: term?.description ?? '',
      icon: term?.icon ?? '',
    },
  });
  const { errors } = form.formState;
  const icon = useWatch({ control: form.control, name: 'icon' });

  const onSubmit = form.handleSubmit(async (values) => {
    await save.mutateAsync({
      ...(term ? { id: term.id } : { position: nextPosition }),
      kind,
      name: values.name,
      slug: values.slug || slugify(values.name),
      description: values.description || null,
      icon: values.icon || null,
    });
    onClose();
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={`${term ? 'Modifier' : 'Ajouter'} — ${TERM_KIND_LABELS[kind].singular.toLowerCase()}`}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="term-form" loading={save.isPending}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form id="term-form" onSubmit={(e) => void onSubmit(e)} className="space-y-4" noValidate>
        <Field label="Nom" required error={errors.name?.message}>
          {(c) => <Input {...c} {...form.register('name')} />}
        </Field>
        <Field label="Identifiant (URL)" hint="Laisser vide pour le générer" error={errors.slug?.message}>
          {(c) => <Input {...c} {...form.register('slug')} />}
        </Field>
        {kind === 'type' && (
          <Field label="Icône">
            {(c) => (
              <div className="flex items-center gap-3">
                <Select {...c} {...form.register('icon')}>
                  <option value="">Par défaut</option>
                  {RECIPE_TYPE_SLUGS.map((slug) => (
                    <option key={slug} value={slug}>
                      {slug}
                    </option>
                  ))}
                </Select>
                <RecipeTypeIcon icon={icon} className="size-6 shrink-0 text-primary-700" />
              </div>
            )}
          </Field>
        )}
        <Field label="Description">{(c) => <Textarea {...c} rows={2} {...form.register('description')} />}</Field>
      </form>
    </Dialog>
  );
}

function TermsPanel({ kind, terms }: { kind: TermKind; terms: Term[] }) {
  const patch = termsCrud.usePatch();
  const remove = termsCrud.useRemove();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<Term | 'new' | null>(null);

  const swap = (index: number, target: number) => {
    const a = terms[index];
    const b = terms[target];
    if (!a || !b) return;
    patch.mutate({ id: a.id, values: { position: target + 1 } });
    patch.mutate({ id: b.id, values: { position: index + 1 } });
  };

  return (
    <CardSection
      title={TERM_KIND_LABELS[kind].plural}
      description={TERM_KIND_LABELS[kind].hint}
      actions={
        <Button size="sm" onClick={() => setEditing('new')}>
          <Plus />
          Ajouter
        </Button>
      }
    >
      {terms.length === 0 ? (
        <EmptyState title="Aucun élément" />
      ) : (
        <ul className="divide-y divide-neutral-100">
          {terms.map((term, index) => (
            <li key={term.id} className="flex items-center gap-3 py-3">
              {kind === 'type' && <RecipeTypeIcon icon={term.icon ?? term.slug} className="size-5 text-primary-700" />}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-neutral-900">{term.name}</p>
                <p className="truncate text-xs text-neutral-500">{term.description ?? term.slug}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Monter"
                disabled={index === 0}
                onClick={() => swap(index, index - 1)}
              >
                <ArrowUp />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Descendre"
                disabled={index === terms.length - 1}
                onClick={() => swap(index, index + 1)}
              >
                <ArrowDown />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Modifier ${term.name}`}
                onClick={() => setEditing(term)}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-error-500 hover:bg-error-50"
                aria-label={`Supprimer ${term.name}`}
                onClick={async () => {
                  if (
                    await confirm({
                      title: `Supprimer « ${term.name} » ?`,
                      description: 'Il sera retiré de toutes les recettes qui l’utilisent.',
                    })
                  )
                    remove.mutate(term.id);
                }}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <TermDialog
          kind={kind}
          term={editing === 'new' ? undefined : editing}
          nextPosition={terms.length + 1}
          onClose={() => setEditing(null)}
        />
      )}
    </CardSection>
  );
}

function SeasonEditor({ season }: { season: Season }) {
  const update = useUpdateSeason();
  const [description, setDescription] = useState(season.description);
  const [image, setImage] = useState(season.image_url ?? '');
  const dirty = description !== season.description || image !== (season.image_url ?? '');

  return (
    <Card className="space-y-4 p-6">
      <h3 className="flex items-center gap-2 font-sans text-lg font-semibold text-neutral-900">
        <SeasonIcon season={season.slug} className="size-5 text-secondary-600" />
        {season.name}
      </h3>
      <Field label="Présentation (pages Menus de saison et accueil)">
        {(c) => <Textarea {...c} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />}
      </Field>
      <ImageField label="Image d'ambiance" folder="seasons" value={image} onChange={setImage} />
      <Button
        disabled={!dirty}
        loading={update.isPending}
        onClick={() => update.mutate({ slug: season.slug, description, image_url: image || null })}
      >
        Enregistrer
      </Button>
    </Card>
  );
}

export function Component() {
  const { data: terms = [], isPending, isError, error, refetch } = termsCrud.useList();
  const seasons = useSeasons();

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Catégories & tags"
        description="Filtres du blog, tags des fiches recettes et vocabulaire du Studio IA"
      />
      {isPending ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <Tabs.Root defaultValue="type">
          <Tabs.List className="mb-6 flex flex-wrap gap-1 rounded-xl bg-neutral-100 p-1" aria-label="Catégories">
            {[...KINDS, 'seasons' as const].map((value) => (
              <Tabs.Trigger
                key={value}
                value={value}
                className="rounded-lg px-4 py-2 text-sm text-neutral-600 data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-sm"
              >
                {value === 'seasons' ? 'Saisons' : TERM_KIND_LABELS[value].plural}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {KINDS.map((kind) => (
            <Tabs.Content key={kind} value={kind}>
              <TermsPanel kind={kind} terms={terms.filter((t) => t.kind === kind)} />
            </Tabs.Content>
          ))}
          <Tabs.Content value="seasons">
            {seasons.isPending ? (
              <PageLoader />
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {seasons.data?.map((season) => (
                  <SeasonEditor key={season.slug} season={season} />
                ))}
              </div>
            )}
          </Tabs.Content>
        </Tabs.Root>
      )}
    </div>
  );
}
