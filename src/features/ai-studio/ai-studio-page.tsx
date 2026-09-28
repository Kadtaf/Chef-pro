import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AI_GENERATION_TYPES,
  aiSchemas,
  type AiGenerateRequest,
  type AiGenerationType,
  type AiArticle,
  type AiSuggestions,
} from '@ai-contract';
import {
  CUISINE_STYLE_SLUGS,
  IMAGE_AMBIANCE_LABELS,
  IMAGE_AMBIANCES,
  RECIPE_TYPE_SLUGS,
} from '@ai-contract/vocabulary';
import {
  BookOpen,
  Brain,
  ChefHat,
  ClipboardCheck,
  FileDown,
  FileText,
  History,
  ImageIcon,
  LayoutTemplate,
  Lightbulb,
  ImagePlus,
  Pencil,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { Tabs } from 'radix-ui';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ARTICLE_KINDS, type ArticleKind } from '@/features/articles/api';
import type { ArticleDraft } from '@/features/articles/article-edit-page';
import { DocumentPreview } from '@/features/export/document-preview';
import { renderPdf } from '@/features/export/pdf-document';
import { recipeFromAi } from '@/features/recipes/schema';
import { sheetFromAi } from '@/features/technical-sheets/schema';
import { currentSeason, useTerms, type Term } from '@/features/taxonomy/api';
import {
  CARD_CATEGORY_LABELS,
  CARD_CATEGORY_VALUES,
  RECIPE_CATEGORIES,
  SEASON_LABELS,
  SEASON_VALUES,
  type CardCategory,
  type Season,
} from '@/shared/domain/constants';
import { cn } from '@/shared/lib/cn';
import { toUserMessage } from '@/shared/lib/errors';
import { formatDateTime, slugify } from '@/shared/lib/format';
import { supabase } from '@/shared/lib/supabase';
import { Button } from '@/shared/ui/button';
import { RecipeTypeIcon } from '@/shared/ui/culinary-icons';
import { Card, CardSection, EmptyState } from '@/shared/ui/feedback';
import { Checkbox, Field, Input, Select, Textarea } from '@/shared/ui/form';
import { PageHeader } from '@/shared/ui/layout';
import { generateContent, generateImage } from './api';
import { aiResultTitle, aiResultToDocument, saveAiResult, type AnyAiResult } from './results';
import { visibleIngredients } from '@/shared/lib/image-brief';

const TYPES: Record<AiGenerationType, { label: string; icon: LucideIcon; description: string }> = {
  suggestions: {
    label: 'Idées',
    icon: Lightbulb,
    description:
      'Idées de recettes par saison, type de plat et style de cuisine — développez celles qui vous plaisent.',
  },
  recipe: {
    label: 'Recette',
    icon: ChefHat,
    description: 'Recette complète pour le blog : nutrition, allergènes, matériel, conseils et accord mets-vins.',
  },
  article: { label: 'Article', icon: BookOpen, description: 'Technique culinaire ou conseil du Chef, prêt à relire.' },
  menu: { label: 'Menu', icon: UtensilsCrossed, description: 'Entrée, plat, dessert avec recettes' },
  card: { label: 'Carte', icon: LayoutTemplate, description: 'Carte structurée par sections' },
  technical_sheet: { label: 'Fiche', icon: FileText, description: 'Fiche technique de production chiffrée' },
  haccp: { label: 'HACCP', icon: ClipboardCheck, description: 'Checklist de contrôle sanitaire' },
};

/** Tab order: blog content first, professional tools after. */
const TAB_ORDER: AiGenerationType[] = ['suggestions', 'recipe', 'article', 'menu', 'card', 'technical_sheet', 'haccp'];

const IMAGE_FOLDERS: Partial<
  Record<AiGenerationType, 'recipes' | 'technical-sheets' | 'menus' | 'cards' | 'articles'>
> = {
  recipe: 'recipes',
  technical_sheet: 'technical-sheets',
  menu: 'menus',
  card: 'cards',
  article: 'articles',
};

type MenuStyle = 'gastronomique' | 'business' | 'evenementiel';
type RecipeType = (typeof RECIPE_TYPE_SLUGS)[number];
type CuisineStyle = (typeof CUISINE_STYLE_SLUGS)[number];

type Params = {
  prompt: string;
  category: string;
  /** Season of menus and cards (always a real season). */
  season: Season;
  /** Optional season constraint for recipes and ideas ('all' = no constraint). */
  filterSeason: Season;
  recipeType: RecipeType | '';
  cuisine: CuisineStyle | '';
  menuStyle: MenuStyle;
  cardCategory: CardCategory;
  zone: string;
  articleKind: ArticleKind;
  topic: string;
  withImage: boolean;
  ambiance: (typeof IMAGE_AMBIANCES)[number];
};

type Generated = {
  type: AiGenerationType;
  result: AnyAiResult;
  imageUrl: string | null;
  menuStyle: MenuStyle;
  articleKind: ArticleKind;
};

function buildRequest(type: AiGenerationType, p: Params): AiGenerateRequest {
  const season = p.filterSeason === 'all' ? undefined : p.filterSeason;
  switch (type) {
    case 'recipe':
      return {
        type,
        prompt: p.prompt || undefined,
        category: p.category,
        season,
        recipe_type: p.recipeType || undefined,
        cuisine: p.cuisine || undefined,
      };
    case 'technical_sheet':
      return { type, prompt: p.prompt || undefined, category: p.category };
    case 'menu':
      return { type, season: p.season, style: p.menuStyle };
    case 'card':
      return { type, season: p.season, category: p.cardCategory };
    case 'haccp':
      return { type, zone: p.zone || 'Cuisine' };
    case 'suggestions':
      return { type, season, recipe_type: p.recipeType || undefined, cuisine: p.cuisine || undefined, count: 6 };
    case 'article':
      return { type, kind: p.articleKind, topic: p.topic };
  }
}

function useGenerationHistory() {
  return useQuery({
    queryKey: ['ai_generations', 'history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_generations')
        .select('id, type, prompt, result, status, created_at')
        .neq('type', 'image')
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(12);
      if (error) throw error;
      return data;
    },
  });
}

const termName = (terms: Term[], kind: Term['kind'], slug: string | null | undefined) =>
  slug ? (terms.find((t) => t.kind === kind && t.slug === slug)?.name ?? slug) : null;

export function Component() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const history = useGenerationHistory();
  const { data: terms = [] } = useTerms();
  const [type, setType] = useState<AiGenerationType>('recipe');
  const [params, setParams] = useState<Params>({
    prompt: '',
    category: 'Plat principal',
    season: currentSeason(),
    filterSeason: currentSeason(),
    recipeType: '',
    cuisine: '',
    menuStyle: 'gastronomique',
    cardCategory: 'saisonniere',
    zone: 'Cuisine chaude',
    articleKind: 'technique',
    topic: '',
    withImage: true,
    ambiance: 'editorial',
  });
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [phase, setPhase] = useState<'text' | 'image' | null>(null);
  const set = <K extends keyof Params>(key: K, value: Params[K]) => setParams((p) => ({ ...p, [key]: value }));

  const generate = useMutation({
    meta: { toastOnError: false },
    mutationFn: async ({ type: kind, params: p }: { type: AiGenerationType; params: Params }): Promise<Generated> => {
      if (kind === 'article' && p.topic.trim().length < 3) throw new Error("Indiquez le sujet de l'article.");
      setPhase('text');
      const { result } = await generateContent(buildRequest(kind, p));
      let imageUrl: string | null = null;
      if (p.withImage && IMAGE_FOLDERS[kind]) {
        setPhase('image');
        imageUrl = await photoFor(kind, result, p).catch((error: unknown) => {
          toast.warning(`Contenu généré, mais la photo a échoué : ${toUserMessage(error)}`);
          return null;
        });
      }
      return { type: kind, result, imageUrl, menuStyle: p.menuStyle, articleKind: p.articleKind };
    },
    onSuccess: (value) => {
      setGenerated(value);
      void queryClient.invalidateQueries({ queryKey: ['ai_generations'] });
    },
    onSettled: () => setPhase(null),
  });

  const run = (kind = type, p = params) => generate.mutate({ type: kind, params: p });

  /** Builds the photo brief from the generated content and the chosen ambiance. */
  function photoFor(kind: AiGenerationType, result: AnyAiResult, p: Params) {
    const r = result as {
      title: string;
      description?: string;
      excerpt?: string;
      plating?: string;
      category?: string;
      photo_brief?: string;
      ingredients?: { name: string; quantity: number; unit: string }[];
    };
    const cuisine = (result as { cuisine?: string | null }).cuisine ?? (p.cuisine || null);
    return generateImage({
      title: r.title,
      description: (r.description ?? r.excerpt)?.slice(0, 1000),
      plating: r.plating?.slice(0, 1000),
      category: r.category,
      brief: r.photo_brief || undefined,
      ingredients: r.ingredients ? visibleIngredients(r.ingredients) : undefined,
      cuisine: termName(terms, 'cuisine', cuisine) ?? undefined,
      ambiance: p.ambiance,
      folder: IMAGE_FOLDERS[kind]!,
    });
  }

  /** New photo for the current result, keeping the text. */
  const rephoto = useMutation({
    meta: { toastOnError: false },
    mutationFn: (g: Generated) => photoFor(g.type, g.result, params),
    onSuccess: (url) => setGenerated((g) => (g ? { ...g, imageUrl: url } : g)),
    onError: (error) => toast.error(toUserMessage(error)),
  });

  const save = useMutation({
    mutationFn: ({ g, publish }: { g: Generated; publish: boolean }) =>
      saveAiResult(g.type, g.result, g.imageUrl, {
        menuStyle: g.menuStyle,
        articleKind: g.articleKind,
        terms,
        publish,
      }),
    onSuccess: async (path, { publish }) => {
      toast.success(publish ? 'Recette publiée dans le blog' : 'Contenu enregistré (brouillon)');
      await queryClient.invalidateQueries();
      await navigate(path);
    },
  });

  const openInEditor = (g: Generated) => {
    if (g.type === 'recipe')
      void navigate('/admin/recipes/new', { state: { draft: recipeFromAi(g.result as never, g.imageUrl, terms) } });
    if (g.type === 'technical_sheet')
      void navigate('/admin/technical-sheets/new', { state: { draft: sheetFromAi(g.result as never, g.imageUrl) } });
    if (g.type === 'article') {
      const a = g.result as AiArticle;
      const draft: ArticleDraft = {
        kind: g.articleKind,
        title: a.title,
        slug: slugify(a.title),
        excerpt: a.excerpt,
        body: a.body,
        difficulty: a.difficulty ?? '',
        reading_minutes: a.reading_minutes,
        tags: a.tags.join(', '),
        image_url: g.imageUrl ?? '',
        photo_brief: a.photo_brief,
      };
      void navigate('/admin/articles/new', { state: { draft } });
    }
  };

  /** Develops an idea into a full recipe, keeping its season, type and style. */
  const developIdea = (idea: AiSuggestions['ideas'][number]) => {
    const next: Params = {
      ...params,
      prompt: [idea.title, idea.key_ingredients.join(', ')].filter(Boolean).join(' — ').slice(0, 500),
      filterSeason: idea.season,
      recipeType: idea.type,
      cuisine: idea.cuisine ?? '',
    };
    setParams(next);
    setType('recipe');
    run('recipe', next);
  };

  const document = generated ? aiResultToDocument(generated.type, generated.result, generated.imageUrl) : null;

  const restore = (entry: NonNullable<typeof history.data>[number]) => {
    const entryType = entry.type as AiGenerationType;
    if (!AI_GENERATION_TYPES.includes(entryType)) return;
    const parsed = aiSchemas[entryType].safeParse(entry.result);
    if (!parsed.success) {
      toast.error('Ce résultat ne correspond plus au format actuel.');
      return;
    }
    setType(entryType);
    setGenerated({
      type: entryType,
      result: parsed.data,
      imageUrl: null,
      menuStyle: params.menuStyle,
      articleKind: params.articleKind,
    });
  };

  const seasonSelect = (key: 'season' | 'filterSeason', withAll: boolean) => (
    <Field label="Saison">
      {(c) => (
        <Select {...c} value={params[key]} onChange={(e) => set(key, e.target.value as Season)}>
          {SEASON_VALUES.filter((s) => withAll || s !== 'all').map((season) => (
            <option key={season} value={season}>
              {season === 'all' ? 'Toutes saisons' : SEASON_LABELS[season]}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );

  const blogFilters = (
    <>
      {seasonSelect('filterSeason', true)}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Type de plat">
          {(c) => (
            <Select
              {...c}
              value={params.recipeType}
              onChange={(e) => set('recipeType', e.target.value as Params['recipeType'])}
            >
              <option value="">Indifférent</option>
              {RECIPE_TYPE_SLUGS.map((slug) => (
                <option key={slug} value={slug}>
                  {termName(terms, 'type', slug)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Style de cuisine">
          {(c) => (
            <Select {...c} value={params.cuisine} onChange={(e) => set('cuisine', e.target.value as Params['cuisine'])}>
              <option value="">Indifférent</option>
              {CUISINE_STYLE_SLUGS.map((slug) => (
                <option key={slug} value={slug}>
                  {termName(terms, 'cuisine', slug)}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
    </>
  );

  const suggestions = generated?.type === 'suggestions' ? (generated.result as AiSuggestions) : null;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Brain className="size-7 text-primary-600" aria-hidden /> IA Studio
          </span>
        }
        description="Idées, recettes du blog, articles, menus, cartes, fiches techniques et HACCP. Relisez toujours avant de publier."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-2">
          <Card className="p-6">
            <Tabs.Root value={type} onValueChange={(value) => setType(value as AiGenerationType)}>
              <Tabs.List
                className="mb-6 grid grid-cols-4 gap-1 rounded-xl bg-neutral-100 p-1 sm:grid-cols-7"
                aria-label="Type de contenu"
              >
                {TAB_ORDER.map((value) => {
                  const Icon = TYPES[value].icon;
                  return (
                    <Tabs.Trigger
                      key={value}
                      value={value}
                      aria-label={TYPES[value].label}
                      className="flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-xs text-neutral-600 data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-sm"
                    >
                      <Icon className="size-5" aria-hidden />
                      <span>{TYPES[value].label}</span>
                    </Tabs.Trigger>
                  );
                })}
              </Tabs.List>

              <p className="mb-4 text-sm text-neutral-500">{TYPES[type].description}</p>

              <div className="space-y-4">
                {(type === 'recipe' || type === 'technical_sheet') && (
                  <>
                    <Field label="Votre idée (facultatif)">
                      {(c) => (
                        <Textarea
                          {...c}
                          rows={3}
                          maxLength={500}
                          placeholder="Ex. dos de cabillaud, beurre blanc au yuzu, légumes de printemps"
                          value={params.prompt}
                          onChange={(e) => set('prompt', e.target.value)}
                        />
                      )}
                    </Field>
                    <Field label="Catégorie">
                      {(c) => (
                        <Select {...c} value={params.category} onChange={(e) => set('category', e.target.value)}>
                          {RECIPE_CATEGORIES.map((category) => (
                            <option key={category}>{category}</option>
                          ))}
                        </Select>
                      )}
                    </Field>
                  </>
                )}

                {(type === 'recipe' || type === 'suggestions') && blogFilters}

                {type === 'article' && (
                  <>
                    <Field label="Rubrique">
                      {(c) => (
                        <Select
                          {...c}
                          value={params.articleKind}
                          onChange={(e) => set('articleKind', e.target.value as ArticleKind)}
                        >
                          {(Object.keys(ARTICLE_KINDS) as ArticleKind[]).map((kind) => (
                            <option key={kind} value={kind}>
                              {ARTICLE_KINDS[kind].label}
                            </option>
                          ))}
                        </Select>
                      )}
                    </Field>
                    <Field label="Sujet" required>
                      {(c) => (
                        <Input
                          {...c}
                          maxLength={200}
                          placeholder="Ex. Réussir une sauce beurre blanc"
                          value={params.topic}
                          onChange={(e) => set('topic', e.target.value)}
                        />
                      )}
                    </Field>
                  </>
                )}

                {(type === 'menu' || type === 'card') && seasonSelect('season', false)}

                {type === 'menu' && (
                  <Field label="Style de menu">
                    {(c) => (
                      <Select
                        {...c}
                        value={params.menuStyle}
                        onChange={(e) => set('menuStyle', e.target.value as MenuStyle)}
                      >
                        <option value="gastronomique">Gastronomique</option>
                        <option value="business">Business</option>
                        <option value="evenementiel">Événementiel</option>
                      </Select>
                    )}
                  </Field>
                )}

                {type === 'card' && (
                  <Field label="Type de carte">
                    {(c) => (
                      <Select
                        {...c}
                        value={params.cardCategory}
                        onChange={(e) => set('cardCategory', e.target.value as CardCategory)}
                      >
                        {CARD_CATEGORY_VALUES.map((value) => (
                          <option key={value} value={value}>
                            {CARD_CATEGORY_LABELS[value]}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                )}

                {type === 'haccp' && (
                  <Field label="Zone ou activité">
                    {(c) => (
                      <Input
                        {...c}
                        maxLength={120}
                        placeholder="Réception marchandises, légumerie…"
                        value={params.zone}
                        onChange={(e) => set('zone', e.target.value)}
                      />
                    )}
                  </Field>
                )}

                {IMAGE_FOLDERS[type] && (
                  <div className="space-y-3 rounded-xl border border-neutral-200 p-4">
                    <Checkbox
                      label={
                        <span className="flex items-center gap-1">
                          <ImageIcon className="size-4" aria-hidden /> Générer une photo réaliste
                        </span>
                      }
                      checked={params.withImage}
                      onChange={(e) => set('withImage', e.target.checked)}
                    />
                    {params.withImage && (
                      <Field label="Ambiance de la photo">
                        {(c) => (
                          <Select
                            {...c}
                            value={params.ambiance}
                            onChange={(e) => set('ambiance', e.target.value as Params['ambiance'])}
                          >
                            {IMAGE_AMBIANCES.map((value) => (
                              <option key={value} value={value}>
                                {IMAGE_AMBIANCE_LABELS[value]}
                              </option>
                            ))}
                          </Select>
                        )}
                      </Field>
                    )}
                  </div>
                )}

                <Button className="w-full" size="lg" loading={generate.isPending} onClick={() => run()}>
                  <Sparkles />
                  {phase === 'text' ? 'Rédaction en cours…' : phase === 'image' ? 'Création de la photo…' : 'Générer'}
                </Button>
                {generate.isError && (
                  <p className="rounded-lg bg-error-50 p-3 text-sm text-error-700" role="alert">
                    {toUserMessage(generate.error)}
                  </p>
                )}
              </div>
            </Tabs.Root>
          </Card>

          <CardSection
            title={
              <span className="flex items-center gap-2">
                <History className="size-5" aria-hidden /> Historique
              </span>
            }
          >
            {!history.data?.length ? (
              <p className="text-sm text-neutral-500">Aucune génération récente.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {history.data.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => restore(entry)}
                      className="w-full py-2.5 text-left hover:text-primary-700"
                    >
                      <span className="block truncate text-sm font-medium">
                        {(entry.result as { title?: string } | null)?.title ??
                          (entry.type === 'suggestions' ? 'Idées de recettes' : 'Sans titre')}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {TYPES[entry.type as AiGenerationType]?.label ?? entry.type} ·{' '}
                        {formatDateTime(entry.created_at)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardSection>
        </div>

        <div className="xl:col-span-3">
          <Card className={cn('p-6', generate.isPending && 'animate-pulse')}>
            {!generated || !document ? (
              <EmptyState
                icon={Sparkles}
                title="Aucun résultat"
                description="Choisissez un type de contenu puis cliquez sur « Générer »."
              />
            ) : suggestions ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-4">
                  <h2 className="text-lg font-semibold text-neutral-900">
                    {suggestions.ideas.length} idées de recettes
                  </h2>
                  <Button variant="ghost" disabled={generate.isPending} onClick={() => run('suggestions')}>
                    <RefreshCw />
                    Autres idées
                  </Button>
                </div>
                <ul className="grid gap-4 md:grid-cols-2">
                  {suggestions.ideas.map((idea) => (
                    <li key={idea.title} className="flex flex-col rounded-xl border border-neutral-200 p-4">
                      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-primary-800">
                          <RecipeTypeIcon icon={idea.type} className="size-3.5" />
                          {termName(terms, 'type', idea.type)}
                        </span>
                        {idea.season !== 'all' && (
                          <span className="rounded-full bg-secondary-50 px-2 py-0.5 text-secondary-800">
                            {SEASON_LABELS[idea.season]}
                          </span>
                        )}
                        {idea.cuisine && (
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-700">
                            {termName(terms, 'cuisine', idea.cuisine)}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-neutral-900">{idea.title}</h3>
                      <p className="mt-1 flex-1 text-sm text-neutral-600">{idea.pitch}</p>
                      {idea.key_ingredients.length > 0 && (
                        <p className="mt-2 text-xs text-neutral-500">{idea.key_ingredients.join(' · ')}</p>
                      )}
                      <Button
                        size="sm"
                        variant="subtle"
                        className="mt-3 self-start"
                        disabled={generate.isPending}
                        onClick={() => developIdea(idea)}
                      >
                        <ChefHat />
                        Générer la recette
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2 border-b border-neutral-100 pb-4">
                  {generated.type === 'recipe' && (
                    <Button
                      loading={save.isPending && save.variables.publish}
                      disabled={save.isPending}
                      onClick={() => save.mutate({ g: generated, publish: true })}
                    >
                      <Send />
                      Publier dans le Blog
                    </Button>
                  )}
                  <Button
                    variant={generated.type === 'recipe' ? 'subtle' : 'primary'}
                    loading={save.isPending && !save.variables.publish}
                    disabled={save.isPending}
                    onClick={() => save.mutate({ g: generated, publish: false })}
                  >
                    <Save />
                    Enregistrer en brouillon
                  </Button>
                  {(generated.type === 'recipe' ||
                    generated.type === 'technical_sheet' ||
                    generated.type === 'article') && (
                    <Button variant="subtle" onClick={() => openInEditor(generated)}>
                      <Pencil />
                      Ajuster dans l&apos;éditeur
                    </Button>
                  )}
                  <Button
                    variant="subtle"
                    onClick={() =>
                      void renderPdf(document, `${slugify(aiResultTitle(generated.result))}.pdf`).catch(
                        (error: unknown) => toast.error(toUserMessage(error)),
                      )
                    }
                  >
                    <FileDown />
                    PDF
                  </Button>
                  {IMAGE_FOLDERS[generated.type] && (
                    <Button
                      variant="subtle"
                      loading={rephoto.isPending}
                      disabled={generate.isPending}
                      onClick={() => rephoto.mutate(generated)}
                    >
                      <ImagePlus />
                      {generated.imageUrl ? 'Nouvelle photo' : 'Ajouter une photo'}
                    </Button>
                  )}
                  <Button variant="ghost" disabled={generate.isPending} onClick={() => run(generated.type)}>
                    <RefreshCw />
                    Régénérer
                  </Button>
                </div>
                <DocumentPreview document={document} />
                <p className="text-xs text-neutral-400">
                  Contenu généré par IA : vérifiez quantités, allergènes (détection automatique complétée) et valeurs
                  nutritionnelles avant publication. Les photos sont des visuels d&apos;ambiance générés.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
