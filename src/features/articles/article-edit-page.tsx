import { zodResolver } from '@hookform/resolvers/zod';
import { ImageOff, Save, Sparkles, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router';
import { z } from 'zod';
import { generateContent, useGenerateImage } from '@/features/ai-studio/api';
import { DIFFICULTY_LABELS, DIFFICULTY_VALUES } from '@/shared/domain/constants';
import { useUnsavedChangesGuard } from '@/shared/hooks/use-unsaved-changes';
import { toUserMessage } from '@/shared/lib/errors';
import { slugify } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Card, CardSection, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Checkbox, Field, Input, Select, Textarea } from '@/shared/ui/form';
import { ImageField } from '@/shared/ui/image-field';
import { PageHeader } from '@/shared/ui/layout';
import { RichText } from '@/shared/ui/rich-text';
import { toast } from 'sonner';
import { ARTICLE_KINDS, articleImageRequest, articlesCrud, videoEmbedUrl, type Article } from './api';

const schema = z.object({
  kind: z.enum(['technique', 'conseil']),
  title: z.string().trim().min(2, 'Titre requis').max(200),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/, 'Minuscules, chiffres et tirets'),
  excerpt: z.string().trim().max(400),
  body: z.string().trim().min(20, 'Contenu trop court'),
  image_url: z.union([z.url('URL invalide'), z.literal('')]),
  video_url: z
    .union([z.url('URL invalide'), z.literal('')])
    .refine((v) => !v || videoEmbedUrl(v), 'Seuls les liens YouTube et Vimeo sont pris en charge'),
  difficulty: z.union([z.enum(DIFFICULTY_VALUES), z.literal('')]),
  reading_minutes: z.coerce.number().int().min(1).max(60),
  tags: z.string(),
  is_published: z.boolean(),
});
type Input = z.input<typeof schema>;
type Values = z.output<typeof schema>;

/** Draft handed over by the AI Studio ("Ajuster dans l'éditeur"). */
export type ArticleDraft = Partial<Values> & { photo_brief?: string };

const toValues = (a?: Article): Values => ({
  kind: (a?.kind as Values['kind']) ?? 'technique',
  title: a?.title ?? '',
  slug: a?.slug ?? '',
  excerpt: a?.excerpt ?? '',
  body: a?.body ?? '',
  image_url: a?.image_url ?? '',
  video_url: a?.video_url ?? '',
  difficulty: (a?.difficulty as Values['difficulty']) ?? '',
  reading_minutes: a?.reading_minutes ?? 3,
  tags: a?.tags.join(', ') ?? '',
  is_published: a?.is_published ?? false,
});

export function Component() {
  const { id } = useParams();
  const location = useLocation();
  const article = articlesCrud.useOne(id);
  const draft = id ? undefined : (location.state as { draft?: ArticleDraft } | null)?.draft;
  if (id && article.isPending) return <PageLoader />;
  if (id && article.isError) return <ErrorState error={article.error} onRetry={() => void article.refetch()} />;
  return <ArticleForm key={id ?? 'new'} article={article.data} draft={draft} />;
}

function ArticleForm({ article, draft }: { article?: Article; draft?: ArticleDraft }) {
  const navigate = useNavigate();
  const save = articlesCrud.useSave();
  const generateImage = useGenerateImage();
  const [drafting, setDrafting] = useState(false);
  const [topic, setTopic] = useState('');
  const [withPhoto, setWithPhoto] = useState(true);
  // Visual brief written by the AI, reused when (re)generating the photo.
  const [photoBrief, setPhotoBrief] = useState(draft?.photo_brief ?? '');
  const form = useForm<Input, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { ...toValues(article), ...draft },
  });
  const { register, control, setValue, getValues, formState } = form;
  const { errors, isDirty, isSubmitSuccessful, dirtyFields } = formState;
  useUnsavedChangesGuard(isDirty && !isSubmitSuccessful);
  const [title, body, image, kind] = useWatch({ control, name: ['title', 'body', 'image_url', 'kind'] });

  useEffect(() => {
    if (!article && !dirtyFields.slug) setValue('slug', slugify(title ?? ''));
  }, [title, article, dirtyFields.slug, setValue]);

  const draftWithAi = async () => {
    if (topic.trim().length < 3) {
      toast.error('Indiquez le sujet à traiter');
      return;
    }
    setDrafting(true);
    try {
      const { result } = await generateContent({ type: 'article', kind: kind ?? 'technique', topic });
      setValue('title', result.title, { shouldDirty: true });
      setValue('excerpt', result.excerpt, { shouldDirty: true });
      setValue('body', result.body, { shouldDirty: true });
      setValue('difficulty', result.difficulty ?? '', { shouldDirty: true });
      setValue('reading_minutes', result.reading_minutes, { shouldDirty: true });
      setValue('tags', result.tags.join(', '), { shouldDirty: true });
      setPhotoBrief(result.photo_brief);
      toast.success('Brouillon rédigé : relisez-le avant publication');
      if (withPhoto && !getValues('image_url')) {
        const url = await generateImage
          .mutateAsync(articleImageRequest({ ...result, kind, photo_brief: result.photo_brief }))
          .catch(() => null);
        if (url) setValue('image_url', url, { shouldDirty: true });
      }
    } catch (error) {
      toast.error(toUserMessage(error));
    } finally {
      setDrafting(false);
    }
  };

  const onGenerateImage = async () => {
    const values = getValues();
    if (!values.title) {
      form.setError('title', { message: 'Saisissez un titre avant de générer une image' });
      return;
    }
    const url = await generateImage.mutateAsync(articleImageRequest({ ...values, photo_brief: photoBrief }));
    setValue('image_url', url, { shouldDirty: true });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    await save.mutateAsync({
      ...(article ? { id: article.id } : {}),
      ...values,
      slug: values.slug || slugify(values.title),
      image_url: values.image_url || null,
      video_url: values.video_url || null,
      difficulty: values.difficulty || null,
      tags: values.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
    await navigate('/admin/articles');
  });

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="animate-fade-in space-y-6" noValidate>
      <PageHeader
        title={article ? "Modifier l'article" : 'Nouvel article'}
        backTo="/admin/articles"
        actions={
          <Button type="submit" loading={save.isPending}>
            <Save />
            Enregistrer
          </Button>
        }
      />

      {!article && (
        <Card className="flex flex-col gap-3 border-secondary-200 bg-secondary-50 p-5 md:flex-row md:items-end">
          <Field label="Rédiger avec l'IA" className="flex-1" hint="Un brouillon complet que vous relisez et ajustez.">
            {(c) => (
              <Input
                {...c}
                placeholder="Ex. Réussir une sauce béarnaise, conserver ses herbes fraîches…"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            )}
          </Field>
          <div className="flex flex-col gap-2">
            <Checkbox
              label="Créer aussi la photo"
              checked={withPhoto}
              onChange={(e) => setWithPhoto(e.target.checked)}
            />
            <Button
              variant="secondary"
              loading={drafting || generateImage.isPending}
              onClick={() => void draftWithAi()}
            >
              <Wand2 />
              {generateImage.isPending && drafting ? 'Création de la photo…' : 'Rédiger'}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <CardSection title="Contenu">
            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Rubrique">
                  {(c) => (
                    <Select {...c} {...register('kind')}>
                      <option value="technique">{ARTICLE_KINDS.technique.plural}</option>
                      <option value="conseil">{ARTICLE_KINDS.conseil.plural}</option>
                    </Select>
                  )}
                </Field>
                <Field label="Difficulté">
                  {(c) => (
                    <Select {...c} {...register('difficulty')}>
                      <option value="">—</option>
                      {DIFFICULTY_VALUES.map((d) => (
                        <option key={d} value={d}>
                          {DIFFICULTY_LABELS[d]}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
              </div>
              <Field label="Titre" required error={errors.title?.message}>
                {(c) => <Input {...c} {...register('title')} />}
              </Field>
              <Field label="Slug (URL)" error={errors.slug?.message}>
                {(c) => <Input {...c} {...register('slug')} />}
              </Field>
              <Field label="Chapô (résumé)" error={errors.excerpt?.message}>
                {(c) => <Textarea {...c} rows={2} {...register('excerpt')} />}
              </Field>
              <Field
                label="Corps de l'article"
                required
                error={errors.body?.message}
                hint="« ## » intertitre · « - » liste · « 1. » étapes · **gras** · ligne vide = nouveau paragraphe"
              >
                {(c) => <Textarea {...c} rows={18} className="font-mono text-sm" {...register('body')} />}
              </Field>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Temps de lecture (min)" error={errors.reading_minutes?.message}>
                  {(c) => (
                    <Input {...c} type="number" min={1} {...register('reading_minutes', { valueAsNumber: true })} />
                  )}
                </Field>
                <Field label="Mots-clés" hint="Séparés par des virgules">
                  {(c) => <Input {...c} {...register('tags')} />}
                </Field>
              </div>
            </div>
          </CardSection>

          <CardSection
            title="Médias"
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
            <div className="space-y-5">
              <ImageField
                folder="articles"
                value={image}
                onChange={(url) => setValue('image_url', url, { shouldDirty: true, shouldValidate: true })}
                error={errors.image_url?.message}
              />
              {!image && (
                <p className="flex items-start gap-2 rounded-lg bg-warning-50 p-3 text-sm text-warning-800">
                  <ImageOff className="mt-0.5 size-4 shrink-0" aria-hidden />
                  Sans photo, l&apos;article s&apos;affiche avec un visuel générique sur le site. Importez une photo ou
                  cliquez sur « Générer par IA ».
                </p>
              )}
              <Field label="Vidéo (YouTube ou Vimeo)" error={errors.video_url?.message}>
                {(c) => (
                  <Input {...c} type="url" placeholder="https://www.youtube.com/watch?v=…" {...register('video_url')} />
                )}
              </Field>
              <Checkbox label="Publier sur le site" {...register('is_published')} />
            </div>
          </CardSection>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <Card className="max-h-[80vh] overflow-y-auto p-8">
            <p className="eyebrow">Aperçu</p>
            <h2 className="mb-6 text-4xl text-neutral-900">{title || 'Titre de l’article'}</h2>
            <RichText source={body ?? ''} />
          </Card>
        </aside>
      </div>
    </form>
  );
}
