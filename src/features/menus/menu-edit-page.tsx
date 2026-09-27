import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { FormProvider, useFieldArray, useForm, useWatch, type FieldErrors } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { useGenerateImage } from '@/features/ai-studio/api';
import { computeCosting, foodCostTone } from '@/features/culinary/costing';
import { useRecipeOptions } from '@/features/recipes/api';
import {
  MENU_CATEGORY_LABELS,
  MENU_CATEGORY_VALUES,
  MENU_ITEM_TYPE_LABELS,
  MENU_ITEM_TYPE_VALUES,
  SEASON_LABELS,
  SEASON_VALUES,
} from '@/shared/domain/constants';
import { useUnsavedChangesGuard } from '@/shared/hooks/use-unsaved-changes';
import { formatCurrency, slugify } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Badge, CardSection, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Checkbox, Field, Input, Select, Textarea } from '@/shared/ui/form';
import { ImageField } from '@/shared/ui/image-field';
import { PageHeader } from '@/shared/ui/layout';
import { NutriScoreBadge } from '@/shared/ui/nutri-score';
import { useMenu, useSaveMenu } from './api';
import {
  emptyMenu,
  menuAggregates,
  menuFormSchema,
  menuToForm,
  toMenuPayload,
  type MenuFormInput,
  type MenuFormValues,
  type MenuItemValues,
} from './schema';

export function Component() {
  const { id } = useParams();
  const menu = useMenu(id);
  const recipes = useRecipeOptions();
  if ((id && menu.isPending) || recipes.isPending) return <PageLoader />;
  if (id && menu.isError) return <ErrorState error={menu.error} onRetry={() => void menu.refetch()} />;
  if (recipes.isError) return <ErrorState error={recipes.error} onRetry={() => void recipes.refetch()} />;
  return (
    <MenuForm key={id ?? 'new'} initial={menu.data ? menuToForm(menu.data) : emptyMenu()} recipes={recipes.data} />
  );
}

type RecipeOption = NonNullable<ReturnType<typeof useRecipeOptions>['data']>[number];

function MenuForm({ initial, recipes }: { initial: MenuFormValues; recipes: RecipeOption[] }) {
  const navigate = useNavigate();
  const save = useSaveMenu();
  const generateImage = useGenerateImage();
  const isEdit = !!initial.id;

  const form = useForm<MenuFormInput, unknown, MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: initial,
    mode: 'onTouched',
  });
  const { register, control, setValue, getValues, formState } = form;
  const { errors, isDirty, isSubmitSuccessful, dirtyFields } = formState;
  const { fields, append, remove, move } = useFieldArray({ control, name: 'items' });
  useUnsavedChangesGuard(isDirty && !isSubmitSuccessful);

  const watched = useWatch({ control }) as Partial<MenuFormValues>;
  useEffect(() => {
    if (!isEdit && !dirtyFields.slug) setValue('slug', slugify(watched.title ?? ''));
  }, [watched.title, isEdit, dirtyFields.slug, setValue]);

  const recipesByCategory = useMemo(() => {
    const groups = new Map<string, RecipeOption[]>();
    for (const recipe of recipes) groups.set(recipe.category, [...(groups.get(recipe.category) ?? []), recipe]);
    return [...groups.entries()];
  }, [recipes]);

  const items = watched.items ?? [];
  const aggregates = menuAggregates(items, recipes);
  const cost = items.reduce(
    (sum, item) => sum + Number(recipes.find((r) => r.id === item.recipe_id)?.cost_per_serving ?? 0),
    0,
  );
  const costing = computeCosting(cost, Number(watched.price) || 0);
  const itemErrors = errors.items as FieldErrors<MenuItemValues>[] | undefined;

  const onSubmit = form.handleSubmit(async (values) => {
    const savedId = await save.mutateAsync(toMenuPayload(values, recipes));
    await navigate(`/admin/menus/${savedId}`);
  });

  const onGenerateImage = async () => {
    const { title, description, season } = getValues();
    if (!title) {
      form.setError('title', { message: 'Saisissez un titre avant de générer une image' });
      return;
    }
    const url = await generateImage.mutateAsync({
      title,
      description: `${description ?? ''} Menu de saison ${SEASON_LABELS[season ?? 'all']}.`,
      category: 'menu',
      folder: 'menus',
    });
    setValue('image_url', url, { shouldDirty: true });
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={(e) => void onSubmit(e)} className="animate-fade-in space-y-6" noValidate>
        <PageHeader
          title={isEdit ? 'Modifier le menu' : 'Nouveau menu'}
          backTo={isEdit ? `/admin/menus/${initial.id}` : '/admin/menus'}
          actions={
            <Button type="submit" loading={save.isPending}>
              <Save />
              Enregistrer
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <CardSection title="Informations">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Titre" required error={errors.title?.message}>
                  {(c) => <Input {...c} {...register('title')} />}
                </Field>
                <Field label="Slug" error={errors.slug?.message}>
                  {(c) => <Input {...c} {...register('slug')} />}
                </Field>
                <Field label="Type de menu">
                  {(c) => (
                    <Select {...c} {...register('category')}>
                      {MENU_CATEGORY_VALUES.map((value) => (
                        <option key={value} value={value}>
                          {MENU_CATEGORY_LABELS[value]}
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
                <Field label="Prix TTC par personne (€)" error={errors.price?.message}>
                  {(c) => (
                    <Input {...c} type="number" step="0.5" min={0} {...register('price', { valueAsNumber: true })} />
                  )}
                </Field>
                <Field label="Description" className="md:col-span-2">
                  {(c) => <Textarea {...c} rows={3} {...register('description')} />}
                </Field>
              </div>
            </CardSection>

            <CardSection
              title="Services"
              description="Associez une recette pour calculer calories, Nutri-Score et coût ; sinon saisissez un intitulé libre."
              actions={
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() =>
                    append({ item_type: 'plat', recipe_id: null, custom_title: '', custom_description: '' })
                  }
                >
                  <Plus />
                  Ajouter
                </Button>
              }
            >
              <ol className="space-y-3">
                {fields.map((field, index) => {
                  const recipe = recipes.find((r) => r.id === items[index]?.recipe_id);
                  return (
                    <li key={field.id} className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-4">
                      <div className="grid grid-cols-12 gap-3">
                        <Select
                          className="col-span-12 sm:col-span-3"
                          aria-label="Type de service"
                          {...register(`items.${index}.item_type`)}
                        >
                          {MENU_ITEM_TYPE_VALUES.map((value) => (
                            <option key={value} value={value}>
                              {MENU_ITEM_TYPE_LABELS[value]}
                            </option>
                          ))}
                        </Select>
                        <Select
                          className="col-span-12 sm:col-span-9"
                          aria-label="Recette associée"
                          {...register(`items.${index}.recipe_id`, { setValueAs: (v: string) => v || null })}
                        >
                          <option value="">— Plat libre (sans recette) —</option>
                          {recipesByCategory.map(([category, options]) => (
                            <optgroup key={category} label={category}>
                              {options.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.title}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </Select>
                        <Input
                          className="col-span-12 sm:col-span-5"
                          placeholder={recipe?.title ?? 'Intitulé sur le menu'}
                          aria-label="Intitulé"
                          aria-invalid={itemErrors?.[index]?.custom_title ? true : undefined}
                          {...register(`items.${index}.custom_title`)}
                        />
                        <Input
                          className="col-span-12 sm:col-span-7"
                          placeholder="Description (facultatif)"
                          aria-label="Description"
                          {...register(`items.${index}.custom_description`)}
                        />
                      </div>
                      {itemErrors?.[index]?.custom_title && (
                        <p className="mt-1 text-sm text-error-600">{itemErrors[index].custom_title.message}</p>
                      )}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          {recipe && (
                            <>
                              <NutriScoreBadge grade={recipe.nutri_score} className="size-5 text-[10px]" />
                              {Math.round(recipe.calories_per_serving)} kcal · {formatCurrency(recipe.cost_per_serving)}
                            </>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Monter"
                            disabled={index === 0}
                            onClick={() => move(index, index - 1)}
                          >
                            <ArrowUp />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Descendre"
                            disabled={index === fields.length - 1}
                            onClick={() => move(index, index + 1)}
                          >
                            <ArrowDown />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-error-500 hover:bg-error-50"
                            aria-label="Retirer"
                            onClick={() => remove(index)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
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
                folder="menus"
                value={watched.image_url}
                onChange={(url) => setValue('image_url', url, { shouldDirty: true, shouldValidate: true })}
                error={errors.image_url?.message}
              />
            </CardSection>

            <CardSection title="Publication">
              <div className="flex flex-wrap gap-6">
                <Checkbox label="Menu publié" {...register('is_published')} />
                <Checkbox label="Menu équilibré" {...register('is_balanced')} />
              </div>
            </CardSection>
          </div>

          <aside className="xl:sticky xl:top-24 xl:self-start">
            <CardSection title="Synthèse">
              <dl className="space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="text-neutral-500">Calories (1 personne)</dt>
                  <dd className="font-semibold">{aggregates.totalCalories} kcal</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-neutral-500">Nutri-Score moyen</dt>
                  <dd>{aggregates.avgNutriScore ? <NutriScoreBadge grade={aggregates.avgNutriScore} /> : '—'}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-neutral-500">Coût matière</dt>
                  <dd className="font-semibold">{formatCurrency(cost)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-neutral-500">Ratio matière</dt>
                  <dd>
                    <Badge tone={foodCostTone(costing.foodCostPct)}>
                      {costing.foodCostPct.toLocaleString('fr-FR')} %
                    </Badge>
                  </dd>
                </div>
                <p className="text-xs text-neutral-400">
                  Calculé sur {aggregates.linkedCount} plat{aggregates.linkedCount > 1 ? 's' : ''} lié
                  {aggregates.linkedCount > 1 ? 's' : ''} à une recette.
                </p>
              </dl>
            </CardSection>
          </aside>
        </div>
      </form>
    </FormProvider>
  );
}
