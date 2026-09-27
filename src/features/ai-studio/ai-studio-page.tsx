import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AI_GENERATION_TYPES, aiSchemas, type AiGenerateRequest, type AiGenerationType } from '@ai-contract';
import {
  Brain,
  ChefHat,
  ClipboardCheck,
  FileDown,
  FileText,
  History,
  ImageIcon,
  LayoutTemplate,
  Pencil,
  RefreshCw,
  Save,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { Tabs } from 'radix-ui';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { DocumentPreview } from '@/features/export/document-preview';
import { renderPdf } from '@/features/export/pdf-document';
import { recipeFromAi } from '@/features/recipes/schema';
import { sheetFromAi } from '@/features/technical-sheets/schema';
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
import { Card, CardSection, EmptyState } from '@/shared/ui/feedback';
import { Checkbox, Field, Input, Select, Textarea } from '@/shared/ui/form';
import { PageHeader } from '@/shared/ui/layout';
import { generateContent, generateImage } from './api';
import { aiResultTitle, aiResultToDocument, saveAiResult, type AnyAiResult } from './results';

const TYPES: Record<AiGenerationType, { label: string; icon: LucideIcon; description: string }> = {
  recipe: { label: 'Recette', icon: ChefHat, description: 'Recette complète avec nutrition et coûts' },
  technical_sheet: { label: 'Fiche technique', icon: FileText, description: 'Fiche de production chiffrée' },
  menu: { label: 'Menu', icon: UtensilsCrossed, description: 'Entrée, plat, dessert avec recettes' },
  card: { label: 'Carte', icon: LayoutTemplate, description: 'Carte structurée par sections' },
  haccp: { label: 'HACCP', icon: ClipboardCheck, description: 'Checklist de contrôle sanitaire' },
};

type MenuStyle = 'gastronomique' | 'business' | 'evenementiel';

type Params = {
  prompt: string;
  category: string;
  season: Season;
  menuStyle: MenuStyle;
  cardCategory: CardCategory;
  zone: string;
  withImage: boolean;
};

type Generated = { type: AiGenerationType; result: AnyAiResult; imageUrl: string | null; menuStyle: MenuStyle };

function currentSeason(): Season {
  const month = new Date().getMonth();
  return month >= 2 && month <= 4
    ? 'printemps'
    : month >= 5 && month <= 7
      ? 'ete'
      : month >= 8 && month <= 10
        ? 'automne'
        : 'hiver';
}

function buildRequest(type: AiGenerationType, p: Params): AiGenerateRequest {
  switch (type) {
    case 'recipe':
    case 'technical_sheet':
      return { type, prompt: p.prompt || undefined, category: p.category };
    case 'menu':
      return { type, season: p.season, style: p.menuStyle };
    case 'card':
      return { type, season: p.season, category: p.cardCategory };
    case 'haccp':
      return { type, zone: p.zone || 'Cuisine' };
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

export function Component() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const history = useGenerationHistory();
  const [type, setType] = useState<AiGenerationType>('recipe');
  const [params, setParams] = useState<Params>({
    prompt: '',
    category: 'Plat principal',
    season: currentSeason(),
    menuStyle: 'gastronomique',
    cardCategory: 'saisonniere',
    zone: 'Cuisine chaude',
    withImage: true,
  });
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [phase, setPhase] = useState<'text' | 'image' | null>(null);
  const set = <K extends keyof Params>(key: K, value: Params[K]) => setParams((p) => ({ ...p, [key]: value }));

  const generate = useMutation({
    meta: { toastOnError: false },
    mutationFn: async (): Promise<Generated> => {
      setPhase('text');
      const { result } = await generateContent(buildRequest(type, params));
      let imageUrl: string | null = null;
      if (params.withImage && type !== 'haccp') {
        setPhase('image');
        const r = result as { title: string; description?: string; plating?: string; category?: string };
        const folder =
          type === 'technical_sheet'
            ? 'technical-sheets'
            : type === 'recipe'
              ? 'recipes'
              : type === 'menu'
                ? 'menus'
                : 'cards';
        imageUrl = await generateImage({
          title: r.title,
          description: r.description,
          plating: r.plating,
          category: r.category,
          folder,
        }).catch((error: unknown) => {
          toast.warning(`Contenu généré, mais l'image a échoué : ${toUserMessage(error)}`);
          return null;
        });
      }
      return { type, result, imageUrl, menuStyle: params.menuStyle };
    },
    onSuccess: (value) => {
      setGenerated(value);
      void queryClient.invalidateQueries({ queryKey: ['ai_generations'] });
    },
    onSettled: () => setPhase(null),
  });

  const save = useMutation({
    meta: { successMessage: 'Contenu enregistré (brouillon)' },
    mutationFn: (g: Generated) => saveAiResult(g.type, g.result, g.imageUrl, { menuStyle: g.menuStyle }),
    onSuccess: async (path) => {
      await queryClient.invalidateQueries();
      await navigate(path);
    },
  });

  const openInEditor = (g: Generated) => {
    if (g.type === 'recipe')
      void navigate('/admin/recipes/new', { state: { draft: recipeFromAi(g.result as never, g.imageUrl) } });
    if (g.type === 'technical_sheet')
      void navigate('/admin/technical-sheets/new', { state: { draft: sheetFromAi(g.result as never, g.imageUrl) } });
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
    setGenerated({ type: entryType, result: parsed.data, imageUrl: null, menuStyle: params.menuStyle });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Brain className="size-7 text-primary-600" aria-hidden /> IA Studio
          </span>
        }
        description="Générez recettes, fiches techniques, menus, cartes et checklists HACCP. Tout contenu est enregistré en brouillon pour relecture."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-2">
          <Card className="p-6">
            <Tabs.Root value={type} onValueChange={(value) => setType(value as AiGenerationType)}>
              <Tabs.List
                className="mb-6 grid grid-cols-5 gap-1 rounded-xl bg-neutral-100 p-1"
                aria-label="Type de contenu"
              >
                {AI_GENERATION_TYPES.map((value) => {
                  const Icon = TYPES[value].icon;
                  return (
                    <Tabs.Trigger
                      key={value}
                      value={value}
                      className="flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-xs text-neutral-600 data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-sm"
                    >
                      <Icon className="size-5" aria-hidden />
                      <span className="hidden sm:block">{TYPES[value].label}</span>
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

                {(type === 'menu' || type === 'card') && (
                  <Field label="Saison">
                    {(c) => (
                      <Select {...c} value={params.season} onChange={(e) => set('season', e.target.value as Season)}>
                        {SEASON_VALUES.filter((s) => s !== 'all').map((season) => (
                          <option key={season} value={season}>
                            {SEASON_LABELS[season]}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                )}

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

                {type !== 'haccp' && (
                  <Checkbox
                    label={
                      <span className="flex items-center gap-1">
                        <ImageIcon className="size-4" aria-hidden /> Générer une photo
                      </span>
                    }
                    checked={params.withImage}
                    onChange={(e) => set('withImage', e.target.checked)}
                  />
                )}

                <Button className="w-full" size="lg" loading={generate.isPending} onClick={() => generate.mutate()}>
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
                        {(entry.result as { title?: string } | null)?.title ?? 'Sans titre'}
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
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2 border-b border-neutral-100 pb-4">
                  <Button loading={save.isPending} onClick={() => save.mutate(generated)}>
                    <Save />
                    Enregistrer en brouillon
                  </Button>
                  {(generated.type === 'recipe' || generated.type === 'technical_sheet') && (
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
                  <Button variant="ghost" disabled={generate.isPending} onClick={() => generate.mutate()}>
                    <RefreshCw />
                    Régénérer
                  </Button>
                </div>
                <DocumentPreview document={document} />
                <p className="text-xs text-neutral-400">
                  Contenu généré par IA : vérifiez quantités, allergènes et valeurs nutritionnelles avant publication.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
