import { BookOpen, Eye, EyeOff, ImageOff, ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { generateImage } from '@/features/ai-studio/api';
import { cn } from '@/shared/lib/cn';
import { toUserMessage } from '@/shared/lib/errors';
import { formatShortDate } from '@/shared/lib/format';
import { imageUrl } from '@/shared/lib/storage';
import { Button } from '@/shared/ui/button';
import { useConfirm } from '@/shared/ui/confirm-context';
import { Badge, EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { PageHeader } from '@/shared/ui/layout';
import { Table, Td, Th, Tr } from '@/shared/ui/table';
import { ARTICLE_KINDS, articleImageRequest, articlesCrud, type ArticleKind } from './api';

export function Component() {
  const { data: articles = [], isPending, isError, error, refetch } = articlesCrud.useList();
  const patch = articlesCrud.usePatch();
  const remove = articlesCrud.useRemove();
  const confirm = useConfirm();
  const [kind, setKind] = useState<ArticleKind | 'all'>('all');
  const visible = articles.filter((a) => kind === 'all' || a.kind === kind);
  const withoutPhoto = visible.filter((a) => !a.image_url);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  /** Generates the missing photos one by one (each counts in the daily AI quota). */
  const generateMissingPhotos = async () => {
    const targets = withoutPhoto;
    const ok = await confirm({
      title: `Générer ${targets.length} photo${targets.length > 1 ? 's' : ''} ?`,
      description:
        'Une photo réaliste est créée par IA pour chaque article sans photo. Chaque photo compte dans le quota IA quotidien ; vous pourrez la remplacer dans l’article.',
      confirmLabel: 'Générer',
      tone: 'primary',
    });
    if (!ok) return;
    let done = 0;
    setProgress({ done, total: targets.length });
    try {
      for (const article of targets) {
        const url = await generateImage(articleImageRequest(article));
        await patch.mutateAsync({ id: article.id, values: { image_url: url } });
        setProgress({ done: ++done, total: targets.length });
      }
      toast.success(`${done} photo${done > 1 ? 's' : ''} ajoutée${done > 1 ? 's' : ''}`);
    } catch (error) {
      toast.error(`${done} photo(s) ajoutée(s), puis arrêt : ${toUserMessage(error)}`);
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Techniques & conseils"
        description="Articles des pages « Techniques culinaires » et « Conseils du Chef »"
        actions={
          <>
            {withoutPhoto.length > 0 && (
              <Button variant="subtle" loading={!!progress} onClick={() => void generateMissingPhotos()}>
                <ImagePlus />
                {progress
                  ? `Photos ${progress.done}/${progress.total}…`
                  : `Générer les photos manquantes (${withoutPhoto.length})`}
              </Button>
            )}
            <Button asChild>
              <Link to="/admin/articles/new">
                <Plus />
                Nouvel article
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex gap-2" role="tablist">
        {(['all', 'technique', 'conseil'] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={kind === value}
            onClick={() => setKind(value)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm',
              kind === value
                ? 'border-primary-700 bg-primary-700 text-white'
                : 'border-neutral-200 bg-white text-neutral-600',
            )}
          >
            {value === 'all' ? 'Tous' : ARTICLE_KINDS[value].plural}
          </button>
        ))}
      </div>

      {isPending ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState icon={BookOpen} title="Aucun article" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th className="w-20">
                <span className="sr-only">Photo</span>
              </Th>
              <Th>Titre</Th>
              <Th className="hidden md:table-cell">Rubrique</Th>
              <Th className="hidden md:table-cell">Mis à jour</Th>
              <Th>Statut</Th>
              <Th className="text-right">
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((article) => (
              <Tr key={article.id}>
                <Td>
                  {article.image_url ? (
                    <img
                      src={imageUrl(article.image_url, 160)}
                      alt=""
                      loading="lazy"
                      className="size-12 rounded-lg object-cover"
                    />
                  ) : (
                    <span
                      className="flex size-12 items-center justify-center rounded-lg bg-neutral-100 text-neutral-400"
                      title="Sans photo"
                    >
                      <ImageOff className="size-5" aria-label="Sans photo" />
                    </span>
                  )}
                </Td>
                <Td>
                  <Link to={`/admin/articles/${article.id}/edit`} className="font-medium hover:text-primary-700">
                    {article.title}
                  </Link>
                  <p className="line-clamp-1 text-xs text-neutral-500">{article.excerpt}</p>
                </Td>
                <Td className="hidden md:table-cell">
                  {ARTICLE_KINDS[article.kind as ArticleKind]?.label ?? article.kind}
                </Td>
                <Td className="hidden text-neutral-500 md:table-cell">{formatShortDate(article.updated_at)}</Td>
                <Td>{article.is_published ? <Badge tone="success">Publié</Badge> : <Badge>Brouillon</Badge>}</Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={article.is_published ? 'Dépublier' : 'Publier'}
                      onClick={() => patch.mutate({ id: article.id, values: { is_published: !article.is_published } })}
                    >
                      {article.is_published ? <EyeOff /> : <Eye />}
                    </Button>
                    <Button asChild variant="ghost" size="icon-sm" aria-label="Modifier">
                      <Link to={`/admin/articles/${article.id}/edit`}>
                        <Pencil />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-error-500 hover:bg-error-50"
                      aria-label="Supprimer"
                      onClick={async () => {
                        if (await confirm({ title: `Supprimer « ${article.title} » ?` })) remove.mutate(article.id);
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
