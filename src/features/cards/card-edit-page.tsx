import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { FormProvider, useFieldArray, useForm, useFormContext, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { useGenerateImage } from '@/features/ai-studio/api';
import { useRecipeOptions } from '@/features/recipes/api';
import { CARD_CATEGORY_LABELS, CARD_CATEGORY_VALUES, SEASON_LABELS, SEASON_VALUES } from '@/shared/domain/constants';
import { useUnsavedChangesGuard } from '@/shared/hooks/use-unsaved-changes';
import { slugify } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { CardSection, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Checkbox, Field, Input, Select, Textarea } from '@/shared/ui/form';
import { ImageField } from '@/shared/ui/image-field';
import { PageHeader } from '@/shared/ui/layout';
import { useCard, useSaveCard } from './api';
import {
  cardFormSchema,
  cardToForm,
  emptyCard,
  emptyCardItem,
  toCardPayload,
  type CardFormInput,
  type CardFormValues,
} from './schema';

type RecipeOption = NonNullable<ReturnType<typeof useRecipeOptions>['data']>[number];

export function Component() {
  const { id } = useParams();
  const card = useCard(id);
  const recipes = useRecipeOptions();
  if ((id && card.isPending) || recipes.isPending) return <PageLoader />;
  if (id && card.isError) return <ErrorState error={card.error} onRetry={() => void card.refetch()} />;
  if (recipes.isError) return <ErrorState error={recipes.error} onRetry={() => void recipes.refetch()} />;
  return (
    <CardForm key={id ?? 'new'} initial={card.data ? cardToForm(card.data) : emptyCard()} recipes={recipes.data} />
  );
}

function SectionItems({ sectionIndex, recipes }: { sectionIndex: number; recipes: RecipeOption[] }) {
  const { control, register, formState } = useFormContext<CardFormInput>();
  const { fields, append, remove } = useFieldArray({ control, name: `sections.${sectionIndex}.items` });
  const errors = formState.errors.sections?.[sectionIndex]?.items;

  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-12 items-start gap-2 rounded-lg bg-white p-2">
          <div className="col-span-12 sm:col-span-4">
            <Input
              placeholder="Intitulé du plat"
              aria-label="Intitulé"
              aria-invalid={errors?.[index]?.custom_title ? true : undefined}
              {...register(`sections.${sectionIndex}.items.${index}.custom_title`)}
            />
            {errors?.[index]?.custom_title && (
              <p className="mt-1 text-xs text-error-600">{errors[index].custom_title.message}</p>
            )}
          </div>
          <Input
            className="col-span-12 sm:col-span-4"
            placeholder="Description"
            aria-label="Description"
            {...register(`sections.${sectionIndex}.items.${index}.custom_description`)}
          />
          <Input
            className="col-span-4 sm:col-span-2"
            type="number"
            step="0.5"
            min={0}
            aria-label="Prix TTC"
            placeholder="Prix"
            {...register(`sections.${sectionIndex}.items.${index}.price`, { valueAsNumber: true })}
          />
          <div className="col-span-6 flex items-center gap-2 sm:col-span-1">
            <input
              type="checkbox"
              className="size-4 accent-primary-600"
              aria-label="Suggestion du chef"
              title="Suggestion du chef"
              {...register(`sections.${sectionIndex}.items.${index}.is_suggestion`)}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="col-span-2 text-error-500 hover:bg-error-50 sm:col-span-1"
            aria-label="Retirer le plat"
            onClick={() => remove(index)}
          >
            <Trash2 />
          </Button>
          <Select
            className="col-span-12 h-9 text-sm"
            aria-label="Recette liée"
            {...register(`sections.${sectionIndex}.items.${index}.recipe_id`, { setValueAs: (v: string) => v || null })}
          >
            <option value="">Aucune recette liée</option>
            {recipes.map((recipe) => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.title}
              </option>
            ))}
          </Select>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={() => append(emptyCardItem())}>
        <Plus />
        Ajouter un plat
      </Button>
    </div>
  );
}

function CardForm({ initial, recipes }: { initial: CardFormValues; recipes: RecipeOption[] }) {
  const navigate = useNavigate();
  const save = useSaveCard();
  const generateImage = useGenerateImage();
  const isEdit = !!initial.id;

  const form = useForm<CardFormInput, unknown, CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: initial,
    mode: 'onTouched',
  });
  const { register, control, setValue, getValues, formState } = form;
  const { errors, isDirty, isSubmitSuccessful, dirtyFields } = formState;
  const sections = useFieldArray({ control, name: 'sections' });
  useUnsavedChangesGuard(isDirty && !isSubmitSuccessful);

  const title = useWatch({ control, name: 'title' });
  const image = useWatch({ control, name: 'image_url' });
  useEffect(() => {
    if (!isEdit && !dirtyFields.slug) setValue('slug', slugify(title ?? ''));
  }, [title, isEdit, dirtyFields.slug, setValue]);

  const onSubmit = form.handleSubmit(async (values) => {
    const savedId = await save.mutateAsync(toCardPayload(values));
    await navigate(`/admin/cards/${savedId}`);
  });

  const onGenerateImage = async () => {
    const values = getValues();
    if (!values.title) {
      form.setError('title', { message: 'Saisissez un titre avant de générer une image' });
      return;
    }
    const url = await generateImage.mutateAsync({
      title: values.title,
      description: `${values.description ?? ''} Carte de saison ${SEASON_LABELS[values.season ?? 'all']}.`,
      category: values.category,
      folder: 'cards',
    });
    setValue('image_url', url, { shouldDirty: true });
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={(e) => void onSubmit(e)} className="animate-fade-in space-y-6" noValidate>
        <PageHeader
          title={isEdit ? 'Modifier la carte' : 'Nouvelle carte'}
          backTo={isEdit ? `/admin/cards/${initial.id}` : '/admin/cards'}
          actions={
            <Button type="submit" loading={save.isPending}>
              <Save />
              Enregistrer
            </Button>
          }
        />

        <CardSection title="Informations">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Titre" required error={errors.title?.message}>
              {(c) => <Input {...c} {...register('title')} />}
            </Field>
            <Field label="Slug" error={errors.slug?.message}>
              {(c) => <Input {...c} {...register('slug')} />}
            </Field>
            <Field label="Type de carte">
              {(c) => (
                <Select {...c} {...register('category')}>
                  {CARD_CATEGORY_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {CARD_CATEGORY_LABELS[value]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Saison">
              {(c) => (
                <Select {...c} {...register('season')}>
                  {SEASON_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {SEASON_LABELS[value]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Description" className="md:col-span-2">
              {(c) => <Textarea {...c} rows={2} {...register('description')} />}
            </Field>
          </div>
        </CardSection>

        <CardSection
          title="Sections & plats"
          description="Cochez la case d'un plat pour le signaler comme suggestion du chef."
          actions={
            <Button
              variant="subtle"
              size="sm"
              onClick={() => sections.append({ title: '', description: '', items: [] })}
            >
              <Plus />
              Section
            </Button>
          }
        >
          <ol className="space-y-4">
            {sections.fields.map((field, index) => (
              <li key={field.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="mb-3 flex flex-wrap items-start gap-2">
                  <div className="min-w-48 flex-1">
                    <Input
                      className="font-semibold"
                      placeholder="Titre de la section"
                      aria-label={`Titre de la section ${index + 1}`}
                      aria-invalid={errors.sections?.[index]?.title ? true : undefined}
                      {...register(`sections.${index}.title`)}
                    />
                    {errors.sections?.[index]?.title && (
                      <p className="mt-1 text-sm text-error-600">{errors.sections[index].title.message}</p>
                    )}
                  </div>
                  <Input
                    className="min-w-48 flex-1"
                    placeholder="Sous-titre (facultatif)"
                    aria-label="Sous-titre"
                    {...register(`sections.${index}.description`)}
                  />
                  <div className="flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Monter la section"
                      disabled={index === 0}
                      onClick={() => sections.move(index, index - 1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Descendre la section"
                      disabled={index === sections.fields.length - 1}
                      onClick={() => sections.move(index, index + 1)}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-error-500 hover:bg-error-50"
                      aria-label="Supprimer la section"
                      onClick={() => sections.remove(index)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <SectionItems sectionIndex={index} recipes={recipes} />
              </li>
            ))}
          </ol>
        </CardSection>

        <CardSection
          title="Visuel"
          actions={
            <Button variant="subtle" size="sm" loading={generateImage.isPending} onClick={() => void onGenerateImage()}>
              <Sparkles />
              Générer par IA
            </Button>
          }
        >
          <ImageField
            folder="cards"
            value={image}
            onChange={(url) => setValue('image_url', url, { shouldDirty: true, shouldValidate: true })}
            error={errors.image_url?.message}
          />
        </CardSection>

        <CardSection title="Publication">
          <div className="flex flex-wrap gap-6">
            <Checkbox label="Carte publiée" {...register('is_published')} />
            <Checkbox label="Carte équilibrée" {...register('is_balanced')} />
          </div>
        </CardSection>
      </form>
    </FormProvider>
  );
}
