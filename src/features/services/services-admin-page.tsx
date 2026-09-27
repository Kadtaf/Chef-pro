import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Star, Tags, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { cn } from '@/shared/lib/cn';
import { formatCurrency } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { useConfirm } from '@/shared/ui/confirm-context';
import { Dialog } from '@/shared/ui/dialog';
import { Badge, Card, EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Checkbox, Field, Input, Select, Textarea } from '@/shared/ui/form';
import { PageHeader } from '@/shared/ui/layout';
import { serviceFeatures, useAdminServices, useDeleteService, useSaveService, type Service } from './api';
import { SERVICE_CATEGORIES } from './categories';
import { ServiceIcon } from './service-icon';

const schema = z.object({
  title: z.string().trim().min(2, 'Titre requis').max(120),
  description: z.string().trim().max(1000),
  category: z.string().min(1),
  price: z.preprocess(
    (v) => (v === '' || v === null || (typeof v === 'number' && Number.isNaN(v)) ? null : v),
    z.coerce.number().min(0).nullable(),
  ),
  price_unit: z.string().trim().min(1).max(30),
  features: z.array(z.object({ value: z.string().trim().max(120) })),
  is_featured: z.boolean(),
  is_published: z.boolean(),
});
type Input = z.input<typeof schema>;
type Values = z.output<typeof schema>;

const toValues = (service?: Service): Values => ({
  title: service?.title ?? '',
  description: service?.description ?? '',
  category: service?.category ?? 'chef',
  price: service?.price ?? null,
  price_unit: service?.price_unit ?? 'jour',
  features: (service ? serviceFeatures(service.features) : ['']).map((value) => ({ value })),
  is_featured: service?.is_featured ?? false,
  is_published: service?.is_published ?? true,
});

function ServiceDialog({
  service,
  nextPosition,
  onClose,
}: {
  service?: Service;
  nextPosition: number;
  onClose: () => void;
}) {
  const save = useSaveService();
  const form = useForm<Input, unknown, Values>({ resolver: zodResolver(schema), defaultValues: toValues(service) });
  const features = useFieldArray({ control: form.control, name: 'features' });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async ({ features: list, ...values }) => {
    await save.mutateAsync({
      ...(service ? { id: service.id } : { position: nextPosition }),
      ...values,
      description: values.description || null,
      features: list.map((f) => f.value).filter(Boolean),
    });
    onClose();
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={service ? 'Modifier le service' : 'Nouveau service'}
      size="lg"
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="service-form" loading={save.isPending}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form
        id="service-form"
        onSubmit={(e) => void onSubmit(e)}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        noValidate
      >
        <Field label="Titre" required error={errors.title?.message}>
          {(c) => <Input {...c} {...form.register('title')} />}
        </Field>
        <Field label="Catégorie (icône)">
          {(c) => (
            <Select {...c} {...form.register('category')}>
              {SERVICE_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Prix HT (€)" hint="Laisser vide pour « Sur devis »">
          {(c) => <Input {...c} type="number" min={0} step="10" {...form.register('price', { valueAsNumber: true })} />}
        </Field>
        <Field label="Unité" error={errors.price_unit?.message}>
          {(c) => <Input {...c} placeholder="jour, forfait, heure…" {...form.register('price_unit')} />}
        </Field>
        <Field label="Description" className="sm:col-span-2">
          {(c) => <Textarea {...c} rows={3} {...form.register('description')} />}
        </Field>
        <fieldset className="space-y-2 sm:col-span-2">
          <legend className="mb-1.5 text-sm font-medium text-neutral-700">Points forts</legend>
          {features.fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Input aria-label={`Point fort ${index + 1}`} {...form.register(`features.${index}.value`)} />
              <Button variant="ghost" size="icon" aria-label="Retirer" onClick={() => features.remove(index)}>
                <X />
              </Button>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => features.append({ value: '' })}>
            <Plus />
            Ajouter un point fort
          </Button>
        </fieldset>
        <div className="flex gap-6 sm:col-span-2">
          <Checkbox label="Publié" {...form.register('is_published')} />
          <Checkbox label="Mis en avant (« Recommandé »)" {...form.register('is_featured')} />
        </div>
      </form>
    </Dialog>
  );
}

export function Component() {
  const { data: services = [], isPending, isError, error, refetch } = useAdminServices();
  const save = useSaveService();
  const remove = useDeleteService();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<Service | 'new' | null>(null);

  const update = (service: Service, values: Partial<Service>) =>
    save.mutate({ id: service.id, title: service.title, category: service.category, ...values });

  const swap = (index: number, target: number) => {
    const a = services[index];
    const b = services[target];
    if (!a || !b) return;
    update(a, { position: target + 1 });
    update(b, { position: index + 1 });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Services & tarifs"
        description="Contenu des pages publiques Services et Tarifs"
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus />
            Nouveau service
          </Button>
        }
      />

      {isPending ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : services.length === 0 ? (
        <EmptyState icon={Tags} title="Aucun service" />
      ) : (
        <ul className="space-y-3">
          {services.map((service, index) => (
            <li key={service.id}>
              <Card className={cn('flex flex-wrap items-center gap-4 p-4', !service.is_published && 'opacity-60')}>
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary-50">
                  <ServiceIcon category={service.category} className="size-6 text-primary-600" />
                </span>
                <div className="min-w-48 flex-1">
                  <p className="flex items-center gap-2 font-semibold text-neutral-900">
                    {service.title}
                    {service.is_featured && <Badge tone="primary">Recommandé</Badge>}
                    {!service.is_published && <Badge>Masqué</Badge>}
                  </p>
                  <p className="line-clamp-1 text-sm text-neutral-500">{service.description}</p>
                </div>
                <p className="font-semibold text-primary-600">
                  {service.price !== null ? `${formatCurrency(service.price)} / ${service.price_unit}` : 'Sur devis'}
                </p>
                <div className="flex gap-1">
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
                    disabled={index === services.length - 1}
                    onClick={() => swap(index, index + 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={service.is_featured ? 'Ne plus recommander' : 'Recommander'}
                    onClick={() => update(service, { is_featured: !service.is_featured })}
                  >
                    <Star className={cn(service.is_featured && 'fill-accent-400 text-accent-400')} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={service.is_published ? 'Masquer' : 'Publier'}
                    onClick={() => update(service, { is_published: !service.is_published })}
                  >
                    {service.is_published ? <EyeOff /> : <Eye />}
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Modifier" onClick={() => setEditing(service)}>
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-error-500 hover:bg-error-50"
                    aria-label="Supprimer"
                    onClick={async () => {
                      if (await confirm({ title: `Supprimer « ${service.title} » ?` })) remove.mutate(service.id);
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <ServiceDialog
          service={editing === 'new' ? undefined : editing}
          nextPosition={services.length + 1}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
