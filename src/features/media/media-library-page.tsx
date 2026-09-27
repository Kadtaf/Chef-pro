import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, ExternalLink, ImageIcon, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/cn';
import { toUserMessage } from '@/shared/lib/errors';
import { formatDateTime } from '@/shared/lib/format';
import { imageUrl, MEDIA_BUCKET, uploadImage } from '@/shared/lib/storage';
import { supabase } from '@/shared/lib/supabase';
import { Button } from '@/shared/ui/button';
import { useConfirm } from '@/shared/ui/confirm-context';
import { EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { PageHeader } from '@/shared/ui/layout';

const FOLDERS = [
  { value: 'recipes', label: 'Recettes' },
  { value: 'articles', label: 'Techniques & conseils' },
  { value: 'career', label: 'Parcours' },
  { value: 'seasons', label: 'Saisons' },
  { value: 'menus', label: 'Menus' },
  { value: 'cards', label: 'Cartes' },
  { value: 'technical-sheets', label: 'Fiches techniques' },
  { value: 'branding', label: 'Identité' },
  { value: 'uploads', label: 'Divers' },
];

function useFolderFiles(folder: string) {
  return useQuery({
    queryKey: ['media', folder],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .list(folder, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
      if (error) throw error;
      return data
        .filter((file) => file.id && !file.name.startsWith('.'))
        .map((file) => {
          const path = `${folder}/${file.name}`;
          return {
            path,
            name: file.name,
            size: Number((file.metadata as { size?: number } | null)?.size ?? 0),
            createdAt: file.created_at,
            url: supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl,
          };
        });
    },
  });
}

/** Browse, upload and delete the images stored in Supabase Storage. */
export function Component() {
  const [folder, setFolder] = useState('recipes');
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const input = useRef<HTMLInputElement>(null);
  const { data: files = [], isPending, isError, error, refetch } = useFolderFiles(folder);

  const upload = useMutation({
    meta: { successMessage: 'Images téléversées' },
    mutationFn: async (list: FileList) => {
      for (const file of Array.from(list)) await uploadImage(file, folder);
    },
    onSettled: () => {
      if (input.current) input.current.value = '';
      return queryClient.invalidateQueries({ queryKey: ['media', folder] });
    },
  });

  const remove = useMutation({
    meta: { successMessage: 'Image supprimée' },
    mutationFn: async (path: string) => {
      const { error: removeError } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
      if (removeError) throw removeError;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media', folder] }),
  });

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL copiée');
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Médiathèque"
        description="Photos générées par l'IA et images téléversées"
        actions={
          <>
            <input
              ref={input}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              aria-label="Téléverser des images"
              onChange={(e) => e.target.files?.length && upload.mutate(e.target.files)}
            />
            <Button loading={upload.isPending} onClick={() => input.current?.click()}>
              <Upload />
              Téléverser
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Dossiers">
        {FOLDERS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={folder === f.value}
            onClick={() => setFolder(f.value)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm transition-colors',
              folder === f.value
                ? 'border-primary-700 bg-primary-700 text-white'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary-300',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : files.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Dossier vide"
          description="Téléversez des images ou générez-les depuis le Studio IA."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {files.map((file) => (
            <li key={file.path} className="group overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <div className="relative aspect-square bg-neutral-100">
                <img src={imageUrl(file.url, 400)} alt={file.name} className="size-full object-cover" loading="lazy" />
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-neutral-950/60 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                  <Button size="icon-sm" variant="subtle" aria-label="Copier l'URL" onClick={() => void copy(file.url)}>
                    <Copy />
                  </Button>
                  <Button asChild size="icon-sm" variant="subtle" aria-label="Ouvrir">
                    <a href={file.url} target="_blank" rel="noreferrer">
                      <ExternalLink />
                    </a>
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="danger"
                    aria-label="Supprimer"
                    onClick={async () => {
                      if (
                        await confirm({
                          title: 'Supprimer cette image ?',
                          description: 'Elle disparaîtra des pages qui l’utilisent encore.',
                        })
                      )
                        remove.mutate(file.path);
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <div className="p-2 text-xs">
                <p className="truncate font-medium text-neutral-700" title={file.name}>
                  {file.name}
                </p>
                <p className="text-neutral-400">
                  {file.size ? `${Math.round(file.size / 1024)} Ko · ` : ''}
                  {file.createdAt ? formatDateTime(file.createdAt) : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
