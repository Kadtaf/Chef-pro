import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useGenerateImage } from '@/features/ai-studio/api';
import { IngredientsEditor } from '@/features/culinary/ingredients-editor';
import { NutritionPanel } from '@/features/culinary/nutrition-panel';
import { computeAggregates } from '@/features/culinary/schema';
import { StepsEditor } from '@/features/culinary/steps-editor';
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_VALUES,
  RECIPE_CATEGORIES,
  SEASON_LABELS,
  SEASON_VALUES,
} from '@/shared/domain/constants';
import { useUnsavedChangesGuard } from '@/shared/hooks/use-unsaved-changes';
import { slugify } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { CardSection, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Checkbox, Field, Input, Select, Textarea } from '@/shared/ui/form';
import { ImageField } from '@/shared/ui/image-field';
import { PageHeader } from '@/shared/ui/layout';
import { useRecipe, useSaveRecipe } from './api';
import {
  emptyRecipe,
  recipeFormSchema,
  recipeToForm,
  toRecipePayload,
  type RecipeFormInput,
  type RecipeFormValues,
} from './schema';

export function Component() {
  const { id } = useParams();
  const recipe = useRecipe(id);
  const location = useLocation();

  if (id && recipe.isPending) return <PageLoader />;
  if (id && recipe.isError) return <ErrorState error={recipe.error} onRetry={() => void recipe.refetch()} />;

  // Drafts come from the AI Studio ("Ajuster dans l'éditeur").
  const draft = (location.state as { draft?: RecipeFormValues } | null)?.draft;
  return <RecipeForm key={id ?? 'new'} initial={recipe.data ? recipeToForm(recipe.data) : (draft ?? emptyRecipe())} />;
}

function RecipeForm({ initial }: { initial: RecipeFormValues }) {
  const navigate = useNavigate();
  const save = useSaveRecipe();
  const generateImage = useGenerateImage();
  const isEdit = !!initial.id;

  const form = useForm<RecipeFormInput, unknown, RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: initial,
    mode: 'onTouched',
  });
  const { register, control, formState, setValue, getValues } = form;
  const { errors, isDirty, isSubmitSuccessful, dirtyFields } = formState;

  useUnsavedChangesGuard(isDirty && !isSubmitSuccessful);

  // Auto-slug for new recipes until the user edits the slug manually.
  const title = useWatch({ control, name: 'title' });
  useEffect(() => {
    if (!isEdit && !dirtyFields.slug) setValue('slug', slugify(title ?? ''));
  }, [title, isEdit, dirtyFields.slug, setValue]);

  const watched = useWatch({ control }) as Partial<RecipeFormValues>;
  const aggregates = computeAggregates({
    ingredients: watched.ingredients ?? [],
    portions: Number(watched.servings) || 1,
    portionWeightG: Number(watched.portion_weight_g) || null,
    fruitsLegumesPct: Number(watched.fruits_legumes_pct) || 0,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const savedId = await save.mutateAsync(toRecipePayload(values));
    await navigate(`/admin/recipes/${savedId}`);
  });

  const onGenerateImage = async () => {
    const { title: name, description, plating, category } = getValues();
    if (!name) {
      form.setError('title', { message: 'Saisissez un titre avant de générer une image' });
      return;
    }
    const url = await generateImage.mutateAsync({ title: name, description, plating, category, folder: 'recipes' });
    setValue('image_url', url, { shouldDirty: true });
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={(e) => void onSubmit(e)} className="animate-fade-in space-y-6" noValidate>
        <PageHeader
          title={isEdit ? 'Modifier la recette' : 'Nouvelle recette'}
          backTo={isEdit ? `/admin/recipes/${initial.id}` : '/admin/recipes'}
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
                <Field label="Slug (URL)" error={errors.slug?.message} hint="/recettes/…">
                  {(c) => <Input {...c} {...register('slug')} />}
                </Field>
                <Field label="Description" className="md:col-span-2" error={errors.description?.message}>
                  {(c) => <Textarea {...c} rows={3} {...register('description')} />}
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
                <Field label="Saison">
                  {(c) => (
                    <Select {...c} {...register('season')}>
                      {SEASON_VALUES.map((season) => (
                        <option key={season} value={season}>
                          {SEASON_LABELS[season]}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Difficulté">
                  {(c) => (
                    <Select {...c} {...register('difficulty')}>
                      {DIFFICULTY_VALUES.map((difficulty) => (
                        <option key={difficulty} value={difficulty}>
                          {DIFFICULTY_LABELS[difficulty]}
                        </option>
                      ))}
                    </Select>
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
                folder="recipes"
                value={watched.image_url}
                onChange={(url) => setValue('image_url', url, { shouldDirty: true, shouldValidate: true })}
                error={errors.image_url?.message}
              />
            </CardSection>

            <CardSection title="Temps & portions">
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
                <Field label="Préparation (min)" error={errors.prep_time?.message}>
                  {(c) => <Input {...c} type="number" min={0} {...register('prep_time', { valueAsNumber: true })} />}
                </Field>
                <Field label="Cuisson (min)" error={errors.cook_time?.message}>
                  {(c) => <Input {...c} type="number" min={0} {...register('cook_time', { valueAsNumber: true })} />}
                </Field>
                <Field label="Portions" required error={errors.servings?.message}>
                  {(c) => <Input {...c} type="number" min={1} {...register('servings', { valueAsNumber: true })} />}
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
                <Field
                  label="Fruits, légumes, légumineuses (%)"
                  error={errors.fruits_legumes_pct?.message}
                  hint="Utilisé par le Nutri-Score"
                >
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

            <IngredientsEditor />
            <StepsEditor />

            <CardSection title="Dressage & publication">
              <div className="space-y-5">
                <Field label="Dressage" error={errors.plating?.message}>
                  {(c) => <Textarea {...c} rows={3} {...register('plating')} />}
                </Field>
                <div className="flex flex-wrap gap-6">
                  <Checkbox label="Publier sur le site" {...register('is_published')} />
                  <Checkbox label="Mettre en vedette sur l'accueil" {...register('is_featured')} />
                </div>
              </div>
            </CardSection>
          </div>

          <aside className="xl:sticky xl:top-24 xl:self-start">
            <NutritionPanel aggregates={aggregates} portionsLabel="par portion" />
          </aside>
        </div>
      </form>
    </FormProvider>
  );
}
