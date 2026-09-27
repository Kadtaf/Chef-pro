import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useGenerateImage } from '@/features/ai-studio/api';
import { IngredientsEditor } from '@/features/culinary/ingredients-editor';
import { NutritionPanel } from '@/features/culinary/nutrition-panel';
import { StepsEditor } from '@/features/culinary/steps-editor';
import { RECIPE_CATEGORIES } from '@/shared/domain/constants';
import { useUnsavedChangesGuard } from '@/shared/hooks/use-unsaved-changes';
import { slugify } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { CardSection, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Checkbox, Field, Input, Select, Textarea } from '@/shared/ui/form';
import { ImageField } from '@/shared/ui/image-field';
import { PageHeader } from '@/shared/ui/layout';
import { useSaveSheet, useSheet } from './api';
import { CostingPanel } from './costing-panel';
import {
  emptySheet,
  sheetAggregates,
  sheetFormSchema,
  sheetToForm,
  toSheetPayload,
  type SheetFormInput,
  type SheetFormValues,
} from './schema';

export function Component() {
  const { id } = useParams();
  const sheet = useSheet(id);
  const location = useLocation();
  const draft = (location.state as { draft?: SheetFormValues } | null)?.draft;
  if (id && sheet.isPending) return <PageLoader />;
  if (id && sheet.isError) return <ErrorState error={sheet.error} onRetry={() => void sheet.refetch()} />;
  return <SheetForm key={id ?? 'new'} initial={sheet.data ? sheetToForm(sheet.data) : (draft ?? emptySheet())} />;
}

function SheetForm({ initial }: { initial: SheetFormValues }) {
  const navigate = useNavigate();
  const save = useSaveSheet();
  const generateImage = useGenerateImage();
  const isEdit = !!initial.id;

  const form = useForm<SheetFormInput, unknown, SheetFormValues>({
    resolver: zodResolver(sheetFormSchema),
    defaultValues: initial,
    mode: 'onTouched',
  });
  const { register, control, setValue, getValues, formState } = form;
  const { errors, isDirty, isSubmitSuccessful, dirtyFields } = formState;
  useUnsavedChangesGuard(isDirty && !isSubmitSuccessful);

  const watched = useWatch({ control }) as Partial<SheetFormValues>;
  useEffect(() => {
    if (!isEdit && !dirtyFields.slug) setValue('slug', slugify(watched.title ?? ''));
  }, [watched.title, isEdit, dirtyFields.slug, setValue]);

  const aggregates = sheetAggregates({
    ingredients: watched.ingredients ?? [],
    portions: Number(watched.portions) || 1,
    portion_weight_g: Number(watched.portion_weight_g) || null,
    fruits_legumes_pct: Number(watched.fruits_legumes_pct) || 0,
    selling_price: Number(watched.selling_price) || 0,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const savedId = await save.mutateAsync(toSheetPayload(values));
    await navigate(`/admin/technical-sheets/${savedId}`);
  });

  const onGenerateImage = async () => {
    const { title, description, category } = getValues();
    if (!title) {
      form.setError('title', { message: 'Saisissez un titre avant de générer une image' });
      return;
    }
    const url = await generateImage.mutateAsync({ title, description, category, folder: 'technical-sheets' });
    setValue('image_url', url, { shouldDirty: true });
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={(e) => void onSubmit(e)} className="animate-fade-in space-y-6" noValidate>
        <PageHeader
          title={isEdit ? 'Modifier la fiche technique' : 'Nouvelle fiche technique'}
          backTo={isEdit ? `/admin/technical-sheets/${initial.id}` : '/admin/technical-sheets'}
          actions={
            <Button type="submit" loading={save.isPending}>
              <Save />
              Enregistrer
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <CardSection title="Informations générales">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Titre" required error={errors.title?.message}>
                  {(c) => <Input {...c} {...register('title')} />}
                </Field>
                <Field label="Slug" error={errors.slug?.message}>
                  {(c) => <Input {...c} {...register('slug')} />}
                </Field>
                <Field label="Catégorie" required>
                  {(c) => (
                    <Select {...c} {...register('category')}>
                      {RECIPE_CATEGORIES.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Prix de vente TTC / portion (€)" error={errors.selling_price?.message}>
                  {(c) => (
                    <Input
                      {...c}
                      type="number"
                      step="0.1"
                      min={0}
                      {...register('selling_price', { valueAsNumber: true })}
                    />
                  )}
                </Field>
                <Field label="Description" className="md:col-span-2">
                  {(c) => <Textarea {...c} rows={3} {...register('description')} />}
                </Field>
              </div>
            </CardSection>

            <CardSection title="Production">
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
                <Field label="Portions produites" required error={errors.portions?.message}>
                  {(c) => <Input {...c} type="number" min={1} {...register('portions', { valueAsNumber: true })} />}
                </Field>
                <Field label="Préparation (min)">
                  {(c) => (
                    <Input {...c} type="number" min={0} {...register('preparation_time', { valueAsNumber: true })} />
                  )}
                </Field>
                <Field label="Cuisson (min)">
                  {(c) => <Input {...c} type="number" min={0} {...register('cooking_time', { valueAsNumber: true })} />}
                </Field>
                <Field
                  label="Poids d'une portion (g)"
                  error={errors.portion_weight_g?.message}
                  hint={
                    aggregates.nutrition.portionWeightG && !watched.portion_weight_g
                      ? `Estimé : ${aggregates.nutrition.portionWeightG} g`
                      : 'Laisser vide pour estimer'
                  }
                >
                  {(c) => (
                    <Input {...c} type="number" min={0} {...register('portion_weight_g', { valueAsNumber: true })} />
                  )}
                </Field>
                <Field label="Fruits, légumes, légumineuses (%)" error={errors.fruits_legumes_pct?.message}>
                  {(c) => (
                    <Input
                      {...c}
                      type="number"
                      min={0}
                      max={100}
                      {...register('fruits_legumes_pct', { valueAsNumber: true })}
                    />
                  )}
                </Field>
              </div>
            </CardSection>

            <CardSection
              title="Visuel"
              actions={
                <Button
                  variant="subtle"
                  size="sm"
                  loading={generateImage.isPending}
                  onClick={() => void onGenerateImage()}
                >
                  <Sparkles />
                  Générer par IA
                </Button>
              }
            >
              <ImageField
                folder="technical-sheets"
                value={watched.image_url}
                onChange={(url) => setValue('image_url', url, { shouldDirty: true, shouldValidate: true })}
                error={errors.image_url?.message}
              />
            </CardSection>

            <IngredientsEditor />
            <StepsEditor title="Progression technique" />

            <CardSection title="Publication">
              <Checkbox label="Fiche publiée" {...register('is_published')} />
            </CardSection>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <CostingPanel
              costing={aggregates.costing}
              costPerPortion={aggregates.costPerPortion}
              onApplySuggestion={(price) => setValue('selling_price', price, { shouldDirty: true })}
            />
            <NutritionPanel aggregates={aggregates} portionsLabel="par portion" />
          </aside>
        </div>
      </form>
    </FormProvider>
  );
}
