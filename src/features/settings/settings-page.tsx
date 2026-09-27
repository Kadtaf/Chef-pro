import { zodResolver } from '@hookform/resolvers/zod';
import { ChefHat, Globe, Image, Mail, Save, Search, Share2 } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useUnsavedChangesGuard } from '@/shared/hooks/use-unsaved-changes';
import { Button } from '@/shared/ui/button';
import { CardSection, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Field, Input, Textarea } from '@/shared/ui/form';
import { ImageField } from '@/shared/ui/image-field';
import { PageHeader } from '@/shared/ui/layout';
import { useSiteSettings, useUpdateSettings, type SiteSettings } from './api';

const optionalUrl = z.union([z.url('URL invalide (https://…)'), z.literal('')]);

const schema = z.object({
  site_name: z.string().trim().min(2).max(80),
  site_description: z.string().trim().max(300),
  email: z.email('Email invalide'),
  phone: z.string().trim().max(40),
  address: z.string().trim().max(200),
  facebook_url: optionalUrl,
  instagram_url: optionalUrl,
  linkedin_url: optionalUrl,
  logo_url: optionalUrl,
  banner_url: optionalUrl,
  seo_title: z.string().trim().max(70, '70 caractères max. (affichage Google)'),
  seo_description: z.string().trim().max(160, '160 caractères max. (affichage Google)'),
  seo_keywords: z.string().trim().max(300),
  chef_name: z.string().trim().max(80),
  chef_title: z.string().trim().max(80),
  chef_bio: z.string().trim().max(1500),
  chef_portrait_url: optionalUrl,
  years_experience: z.number({ error: 'Nombre requis' }).int().min(0).max(70),
  languages: z.string(),
  education: z.string(),
});
type Values = z.infer<typeof schema>;

const splitLines = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const toValues = (s: SiteSettings): Values => ({
  site_name: s.site_name,
  site_description: s.site_description,
  email: s.email,
  phone: s.phone,
  address: s.address,
  facebook_url: s.facebook_url ?? '',
  instagram_url: s.instagram_url ?? '',
  linkedin_url: s.linkedin_url ?? '',
  logo_url: s.logo_url ?? '',
  banner_url: s.banner_url ?? '',
  seo_title: s.seo_title,
  seo_description: s.seo_description,
  seo_keywords: s.seo_keywords,
  // Fallbacks keep the form usable if the database lags behind the app (migration not applied yet).
  chef_name: s.chef_name ?? '',
  chef_title: s.chef_title ?? '',
  chef_bio: s.chef_bio ?? '',
  chef_portrait_url: s.chef_portrait_url ?? '',
  years_experience: s.years_experience ?? 0,
  languages: (s.languages ?? []).join('\n'),
  education: (s.education ?? []).join('\n'),
});

export function Component() {
  const { data: settings, isPending, isError, error, refetch } = useSiteSettings();
  if (isPending) return <PageLoader />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!settings)
    return <ErrorState error={new Error('Paramètres introuvables : appliquez les migrations Supabase.')} />;
  return <SettingsForm settings={settings} />;
}

function SettingsForm({ settings }: { settings: SiteSettings }) {
  const update = useUpdateSettings();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(settings) });
  const { register, formState, control, setValue } = form;
  const { errors, isDirty } = formState;
  useUnsavedChangesGuard(isDirty);
  const [seoTitle, seoDescription, logo, banner, portrait] = useWatch({
    control,
    name: ['seo_title', 'seo_description', 'logo_url', 'banner_url', 'chef_portrait_url'],
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const saved = await update.mutateAsync({
      id: settings.id,
      ...values,
      facebook_url: values.facebook_url || null,
      instagram_url: values.instagram_url || null,
      linkedin_url: values.linkedin_url || null,
      logo_url: values.logo_url || null,
      banner_url: values.banner_url || null,
      chef_portrait_url: values.chef_portrait_url || null,
      languages: splitLines(values.languages),
      education: splitLines(values.education),
    });
    form.reset(toValues(saved));
  });

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mx-auto max-w-4xl animate-fade-in space-y-6" noValidate>
      <PageHeader
        title="Paramètres"
        description="Informations affichées sur le site public"
        actions={
          <Button type="submit" loading={update.isPending} disabled={!isDirty}>
            <Save />
            Enregistrer
          </Button>
        }
      />

      <CardSection
        title={
          <span className="flex items-center gap-2">
            <ChefHat className="size-5" aria-hidden /> Le Chef
          </span>
        }
        description="Identité affichée sur la page À propos et l'accueil."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Nom du chef" error={errors.chef_name?.message}>
            {(c) => <Input {...c} {...register('chef_name')} />}
          </Field>
          <Field label="Titre" error={errors.chef_title?.message}>
            {(c) => <Input {...c} {...register('chef_title')} />}
          </Field>
          <Field label="Années d'expérience" error={errors.years_experience?.message}>
            {(c) => <Input {...c} type="number" min={0} {...register('years_experience', { valueAsNumber: true })} />}
          </Field>
          <div className="md:row-span-2">
            <ImageField
              label="Portrait"
              folder="branding"
              value={portrait}
              onChange={(url) => setValue('chef_portrait_url', url, { shouldDirty: true, shouldValidate: true })}
              error={errors.chef_portrait_url?.message}
            />
          </div>
          <Field label="Biographie" error={errors.chef_bio?.message}>
            {(c) => <Textarea {...c} rows={6} {...register('chef_bio')} />}
          </Field>
          <Field label="Langues" hint="Une par ligne">
            {(c) => <Textarea {...c} rows={3} {...register('languages')} />}
          </Field>
          <Field label="Formations & diplômes" hint="Une par ligne, format « Année — Intitulé »">
            {(c) => <Textarea {...c} rows={5} {...register('education')} />}
          </Field>
        </div>
      </CardSection>

      <CardSection
        title={
          <span className="flex items-center gap-2">
            <Globe className="size-5" aria-hidden /> Général
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Nom du site" required error={errors.site_name?.message}>
            {(c) => <Input {...c} {...register('site_name')} />}
          </Field>
          <Field label="Accroche (pied de page)" error={errors.site_description?.message}>
            {(c) => <Input {...c} {...register('site_description')} />}
          </Field>
        </div>
      </CardSection>

      <CardSection
        title={
          <span className="flex items-center gap-2">
            <Mail className="size-5" aria-hidden /> Contact
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Email public" required error={errors.email?.message}>
            {(c) => <Input {...c} type="email" {...register('email')} />}
          </Field>
          <Field label="Téléphone" error={errors.phone?.message}>
            {(c) => <Input {...c} type="tel" {...register('phone')} />}
          </Field>
          <Field label="Adresse" className="md:col-span-2" error={errors.address?.message}>
            {(c) => <Input {...c} {...register('address')} />}
          </Field>
        </div>
      </CardSection>

      <CardSection
        title={
          <span className="flex items-center gap-2">
            <Share2 className="size-5" aria-hidden /> Réseaux sociaux
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Field label="Facebook" error={errors.facebook_url?.message}>
            {(c) => <Input {...c} type="url" placeholder="https://facebook.com/…" {...register('facebook_url')} />}
          </Field>
          <Field label="Instagram" error={errors.instagram_url?.message}>
            {(c) => <Input {...c} type="url" placeholder="https://instagram.com/…" {...register('instagram_url')} />}
          </Field>
          <Field label="LinkedIn" error={errors.linkedin_url?.message}>
            {(c) => <Input {...c} type="url" placeholder="https://linkedin.com/in/…" {...register('linkedin_url')} />}
          </Field>
        </div>
      </CardSection>

      <CardSection
        title={
          <span className="flex items-center gap-2">
            <Image className="size-5" aria-hidden /> Identité visuelle
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <ImageField
            label="Logo"
            folder="branding"
            value={logo}
            onChange={(url) => setValue('logo_url', url, { shouldDirty: true })}
            error={errors.logo_url?.message}
          />
          <ImageField
            label="Bannière / image de partage"
            folder="branding"
            value={banner}
            onChange={(url) => setValue('banner_url', url, { shouldDirty: true })}
            error={errors.banner_url?.message}
          />
        </div>
      </CardSection>

      <CardSection
        title={
          <span className="flex items-center gap-2">
            <Search className="size-5" aria-hidden /> Référencement (accueil)
          </span>
        }
        description="Titre et description affichés dans les résultats Google."
      >
        <div className="space-y-5">
          <Field label="Titre SEO" error={errors.seo_title?.message} hint={`${seoTitle?.length ?? 0}/70`}>
            {(c) => <Input {...c} {...register('seo_title')} />}
          </Field>
          <Field
            label="Description SEO"
            error={errors.seo_description?.message}
            hint={`${seoDescription?.length ?? 0}/160`}
          >
            {(c) => <Textarea {...c} rows={3} {...register('seo_description')} />}
          </Field>
          <Field
            label="Mots-clés (usage interne)"
            hint="Google n'utilise plus la balise keywords ; conservé pour vos notes."
          >
            {(c) => <Input {...c} {...register('seo_keywords')} />}
          </Field>
          <div className="rounded-lg border border-neutral-200 p-4" aria-label="Aperçu Google">
            <p className="text-xs text-neutral-500">Aperçu</p>
            <p className="truncate text-lg text-[#1a0dab]">{seoTitle || settings.site_name}</p>
            <p className="line-clamp-2 text-sm text-neutral-600">{seoDescription}</p>
          </div>
        </div>
      </CardSection>
    </form>
  );
}
