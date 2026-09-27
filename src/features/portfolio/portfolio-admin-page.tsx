import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, Eye, EyeOff, FolderOpen, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/format';
import { imageUrl } from '@/shared/lib/storage';
import { Button } from '@/shared/ui/button';
import { useConfirm } from '@/shared/ui/confirm-context';
import { Dialog } from '@/shared/ui/dialog';
import { Badge, EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Checkbox, Field, Input, Select, Textarea } from '@/shared/ui/form';
import { ImageField } from '@/shared/ui/image-field';
import { PageHeader } from '@/shared/ui/layout';
import { PORTFOLIO_CATEGORIES, portfolioCrud, type PortfolioItem } from './api';

const schema = z.object({
  title: z.string().trim().min(2, 'Titre requis').max(200),
  description: z.string().trim().max(2000),
  category: z.string().min(1),
  image_url: z.union([z.url('URL invalide'), z.literal('')]),
  client_name: z.string().trim().max(200),
  project_date: z.union([z.iso.date(), z.literal('')]),
  is_featured: z.boolean(),
  is_published: z.boolean(),
});
type Values = z.infer<typeof schema>;

const toValues = (item?: PortfolioItem): Values => ({
  title: item?.title ?? '',
  description: item?.description ?? '',
  category: item?.category ?? 'Restaurant',
  image_url: item?.image_url ?? '',
  client_name: item?.client_name ?? '',
  project_date: item?.project_date ?? '',
  is_featured: item?.is_featured ?? false,
  is_published: item?.is_published ?? true,
});

function PortfolioDialog({
  item,
  nextPosition,
  onClose,
}: {
  item?: PortfolioItem;
  nextPosition: number;
  onClose: () => void;
}) {
  const save = portfolioCrud.useSave();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(item) });
  const { errors } = form.formState;
  const image = useWatch({ control: form.control, name: 'image_url' });

  const onSubmit = form.handleSubmit(async (values) => {
    await save.mutateAsync({
      ...(item ? { id: item.id } : { position: nextPosition }),
      ...values,
      description: values.description || null,
      image_url: values.image_url || null,
      client_name: values.client_name || null,
      project_date: values.project_date || null,
    });
    onClose();
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={item ? 'Modifier le projet' : 'Nouveau projet'}
      size="lg"
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="portfolio-form" loading={save.isPending}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form
        id="portfolio-form"
        onSubmit={(e) => void onSubmit(e)}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        noValidate
      >
        <Field label="Titre" required error={errors.title?.message} className="sm:col-span-2">
          {(c) => <Input {...c} {...form.register('title')} />}
        </Field>
        <Field label="Catégorie">
          {(c) => (
            <Select {...c} {...form.register('category')}>
              {PORTFOLIO_CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Date du projet">{(c) => <Input {...c} type="date" {...form.register('project_date')} />}</Field>
        <Field label="Client (affiché publiquement)" hint="Avec l'accord du client." className="sm:col-span-2">
          {(c) => <Input {...c} {...form.register('client_name')} />}
        </Field>
        <Field label="Description" className="sm:col-span-2">
          {(c) => <Textarea {...c} rows={3} {...form.register('description')} />}
        </Field>
        <div className="sm:col-span-2">
          <ImageField
            folder="portfolio"
            value={image}
            onChange={(url) => form.setValue('image_url', url, { shouldDirty: true, shouldValidate: true })}
            error={errors.image_url?.message}
          />
        </div>
        <div className="flex gap-6 sm:col-span-2">
          <Checkbox label="Publié" {...form.register('is_published')} />
          <Checkbox label="En vedette sur l'accueil" {...form.register('is_featured')} />
        </div>
      </form>
    </Dialog>
  );
}

export function Component() {
  const { data: items = [], isPending, isError, error, refetch } = portfolioCrud.useList();
  const patch = portfolioCrud.usePatch();
  const remove = portfolioCrud.useRemove();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<PortfolioItem | 'new' | null>(null);

  const swap = (index: number, target: number) => {
    const a = items[index];
    const b = items[target];
    if (!a || !b) return;
    patch.mutate({ id: a.id, values: { position: target + 1 } });
    patch.mutate({ id: b.id, values: { position: index + 1 } });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Portfolio"
        description={`${items.length} projet${items.length > 1 ? 's' : ''}`}
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus />
            Nouveau projet
          </Button>
        }
      />

      {isPending ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Aucun projet"
          description="Ajoutez vos réalisations pour alimenter la page Portfolio."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <li key={item.id} className="overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-sm">
              <div className="relative aspect-video bg-neutral-100">
                {item.image_url ? (
                  <img
                    src={imageUrl(item.image_url, 640)}
                    alt=""
                    className={cn('size-full object-cover', !item.is_published && 'opacity-50')}
                    loading="lazy"
                  />
                ) : (
                  <FolderOpen className="absolute inset-0 m-auto size-12 text-neutral-300" aria-hidden />
                )}
                {item.is_featured && <Badge className="absolute top-3 left-3 bg-accent-500 text-white">Vedette</Badge>}
              </div>
              <div className="p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Badge tone="primary">{item.category}</Badge>
                  {!item.is_published && <Badge>Masqué</Badge>}
                </div>
                <h2 className="font-sans font-semibold text-neutral-900">{item.title}</h2>
                <p className="text-xs text-neutral-500">
                  {[item.client_name, item.project_date && formatDate(item.project_date)].filter(Boolean).join(' · ')}
                </p>
                <div className="mt-3 flex justify-end gap-1">
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
                    disabled={index === items.length - 1}
                    onClick={() => swap(index, index + 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={item.is_featured ? 'Retirer de la vedette' : 'Mettre en vedette'}
                    onClick={() => patch.mutate({ id: item.id, values: { is_featured: !item.is_featured } })}
                  >
                    <Star className={cn(item.is_featured && 'fill-accent-400 text-accent-400')} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={item.is_published ? 'Masquer' : 'Publier'}
                    onClick={() => patch.mutate({ id: item.id, values: { is_published: !item.is_published } })}
                  >
                    {item.is_published ? <EyeOff /> : <Eye />}
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Modifier" onClick={() => setEditing(item)}>
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-error-500 hover:bg-error-50"
                    aria-label="Supprimer"
                    onClick={async () => {
                      if (await confirm({ title: `Supprimer « ${item.title} » ?` })) remove.mutate(item.id);
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <PortfolioDialog
          item={editing === 'new' ? undefined : editing}
          nextPosition={items.length + 1}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
