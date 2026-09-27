import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, Award, Eye, EyeOff, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useGenerateImage } from '@/features/ai-studio/api';
import { imageUrl } from '@/shared/lib/storage';
import { Button } from '@/shared/ui/button';
import { useConfirm } from '@/shared/ui/confirm-context';
import { Dialog } from '@/shared/ui/dialog';
import { Badge, Card, EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Checkbox, Field, Input, Textarea } from '@/shared/ui/form';
import { ImageField } from '@/shared/ui/image-field';
import { PageHeader } from '@/shared/ui/layout';
import { careerCrud, careerPeriod, type CareerExperience } from './api';

const year = z.coerce.number().int().min(1970).max(2100);
const schema = z
  .object({
    role: z.string().trim().min(2, 'Poste requis'),
    establishment: z.string().trim().min(2, 'Établissement requis'),
    city: z.string().trim().max(80),
    start_year: year,
    end_year: z.union([year, z.literal(''), z.nan()]),
    summary: z.string().trim().max(1500),
    missions: z.string(),
    skills: z.string(),
    techniques: z.string(),
    cuisine_types: z.string(),
    image_url: z.union([z.url('URL invalide'), z.literal('')]),
    image_prompt: z.string().trim().max(500),
    is_published: z.boolean(),
  })
  .refine((v) => typeof v.end_year !== 'number' || Number.isNaN(v.end_year) || v.end_year >= v.start_year, {
    path: ['end_year'],
    message: "L'année de fin doit suivre l'année de début",
  });
type Input = z.input<typeof schema>;
type Values = z.output<typeof schema>;

const lines = (value: string) =>
  value
    .split('\n')
    .map((l) => l.replace(/^[-•]\s*/, '').trim())
    .filter(Boolean);
const list = (value: string) =>
  value
    .split(',')
    .map((l) => l.trim())
    .filter(Boolean);

const toValues = (e?: CareerExperience): Values => ({
  role: e?.role ?? '',
  establishment: e?.establishment ?? '',
  city: e?.city ?? '',
  start_year: e?.start_year ?? new Date().getFullYear(),
  end_year: e?.end_year ?? '',
  summary: e?.summary ?? '',
  missions: e?.missions.join('\n') ?? '',
  skills: e?.skills.join(', ') ?? '',
  techniques: e?.techniques.join(', ') ?? '',
  cuisine_types: e?.cuisine_types.join(', ') ?? '',
  image_url: e?.image_url ?? '',
  image_prompt: e?.image_prompt ?? '',
  is_published: e?.is_published ?? true,
});

function ExperienceDialog({
  experience,
  nextPosition,
  onClose,
}: {
  experience?: CareerExperience;
  nextPosition: number;
  onClose: () => void;
}) {
  const save = careerCrud.useSave();
  const generateImage = useGenerateImage();
  const form = useForm<Input, unknown, Values>({ resolver: zodResolver(schema), defaultValues: toValues(experience) });
  const { errors } = form.formState;
  const image = useWatch({ control: form.control, name: 'image_url' });

  const onGenerate = async () => {
    const { role, establishment, image_prompt, summary } = form.getValues();
    const url = await generateImage.mutateAsync({
      title: `${role} — ${establishment}`,
      description: image_prompt || summary,
      category: 'Ambiance de cuisine professionnelle (sans logo ni texte)',
      folder: 'career',
    });
    form.setValue('image_url', url, { shouldDirty: true });
  };

  const onSubmit = form.handleSubmit(async (v) => {
    await save.mutateAsync({
      ...(experience ? { id: experience.id } : { position: nextPosition }),
      role: v.role,
      establishment: v.establishment,
      city: v.city || null,
      start_year: v.start_year,
      end_year: typeof v.end_year === 'number' && !Number.isNaN(v.end_year) ? v.end_year : null,
      summary: v.summary,
      missions: lines(v.missions),
      skills: list(v.skills),
      techniques: list(v.techniques),
      cuisine_types: list(v.cuisine_types),
      image_url: v.image_url || null,
      image_prompt: v.image_prompt || null,
      is_published: v.is_published,
    });
    onClose();
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={experience ? "Modifier l'expérience" : 'Nouvelle expérience'}
      size="xl"
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="career-form" loading={save.isPending}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form id="career-form" onSubmit={(e) => void onSubmit(e)} className="grid gap-4 md:grid-cols-2" noValidate>
        <Field label="Poste" required error={errors.role?.message}>
          {(c) => <Input {...c} placeholder="Chef de cuisine" {...form.register('role')} />}
        </Field>
        <Field label="Établissement" required error={errors.establishment?.message}>
          {(c) => <Input {...c} {...form.register('establishment')} />}
        </Field>
        <Field label="Ville">{(c) => <Input {...c} {...form.register('city')} />}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Début" required error={errors.start_year?.message}>
            {(c) => <Input {...c} type="number" {...form.register('start_year', { valueAsNumber: true })} />}
          </Field>
          <Field label="Fin" hint="Vide = en cours" error={errors.end_year?.message}>
            {(c) => <Input {...c} type="number" {...form.register('end_year', { valueAsNumber: true })} />}
          </Field>
        </div>
        <Field label="Description professionnelle" className="md:col-span-2">
          {(c) => <Textarea {...c} rows={3} {...form.register('summary')} />}
        </Field>
        <Field label="Missions principales" hint="Une par ligne" className="md:col-span-2">
          {(c) => <Textarea {...c} rows={5} {...form.register('missions')} />}
        </Field>
        <Field label="Compétences démontrées" hint="Séparées par des virgules">
          {(c) => <Input {...c} {...form.register('skills')} />}
        </Field>
        <Field label="Techniques culinaires" hint="Séparées par des virgules">
          {(c) => <Input {...c} {...form.register('techniques')} />}
        </Field>
        <Field label="Types de cuisine" hint="Traditionnelle, semi-gastronomique…" className="md:col-span-2">
          {(c) => <Input {...c} {...form.register('cuisine_types')} />}
        </Field>
        <div className="space-y-3 md:col-span-2">
          <ImageField
            label="Photo"
            folder="career"
            value={image}
            onChange={(url) => form.setValue('image_url', url, { shouldDirty: true, shouldValidate: true })}
            error={errors.image_url?.message}
          />
          <Field
            label="Description pour la génération IA"
            hint="Visuel d'ambiance illustrant le type de cuisine — il ne doit pas prétendre représenter l'établissement réel."
          >
            {(c) => <Textarea {...c} rows={2} {...form.register('image_prompt')} />}
          </Field>
          <Button variant="subtle" size="sm" loading={generateImage.isPending} onClick={() => void onGenerate()}>
            <Sparkles />
            Générer un visuel d&apos;ambiance
          </Button>
        </div>
        <Checkbox label="Afficher sur la page « À propos »" {...form.register('is_published')} />
      </form>
    </Dialog>
  );
}

export function Component() {
  const { data: experiences = [], isPending, isError, error, refetch } = careerCrud.useList();
  const patch = careerCrud.usePatch();
  const remove = careerCrud.useRemove();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<CareerExperience | 'new' | null>(null);

  const swap = (index: number, target: number) => {
    const a = experiences[index];
    const b = experiences[target];
    if (!a || !b) return;
    patch.mutate({ id: a.id, values: { position: target + 1 } });
    patch.mutate({ id: b.id, values: { position: index + 1 } });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Parcours du Chef"
        description="Fiches « Parcours culinaire & réalisations professionnelles » de la page À propos"
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus />
            Ajouter une expérience
          </Button>
        }
      />
      {isPending ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : experiences.length === 0 ? (
        <EmptyState icon={Award} title="Aucune expérience" />
      ) : (
        <ul className="space-y-3">
          {experiences.map((experience, index) => (
            <li key={experience.id}>
              <Card className="flex flex-wrap items-center gap-4 p-4">
                <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  {experience.image_url && (
                    <img src={imageUrl(experience.image_url, 160)} alt="" className="size-full object-cover" />
                  )}
                </div>
                <div className="min-w-48 flex-1">
                  <p className="font-semibold text-neutral-900">
                    {experience.role} — {experience.establishment}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {careerPeriod(experience)}
                    {experience.city && ` · ${experience.city}`}
                  </p>
                </div>
                {experience.is_published ? <Badge tone="success">Affichée</Badge> : <Badge>Masquée</Badge>}
                <div className="flex gap-1">
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
                    disabled={index === experiences.length - 1}
                    onClick={() => swap(index, index + 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={experience.is_published ? 'Masquer' : 'Afficher'}
                    onClick={() =>
                      patch.mutate({ id: experience.id, values: { is_published: !experience.is_published } })
                    }
                  >
                    {experience.is_published ? <EyeOff /> : <Eye />}
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Modifier" onClick={() => setEditing(experience)}>
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-error-500 hover:bg-error-50"
                    aria-label="Supprimer"
                    onClick={async () => {
                      if (await confirm({ title: `Supprimer « ${experience.role} — ${experience.establishment} » ?` }))
                        remove.mutate(experience.id);
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <ExperienceDialog
          experience={editing === 'new' ? undefined : editing}
          nextPosition={experiences.length + 1}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
