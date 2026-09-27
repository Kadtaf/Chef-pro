import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';
import { toUserMessage } from '@/shared/lib/errors';
import { supabase } from '@/shared/lib/supabase';
import { Button } from '@/shared/ui/button';
import { Field, Input } from '@/shared/ui/form';
import { PageLoader } from '@/shared/ui/feedback';
import { AuthLayout } from './auth-layout';
import { useAuth } from './use-auth';

const schema = z
  .object({
    password: z.string().min(12, '12 caractères minimum'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Les mots de passe diffèrent' });
type Values = z.infer<typeof schema>;

/** Landing page of the password-recovery email (Supabase signs the user in from the link). */
export function Component() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { password: '', confirm: '' } });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ password }) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(toUserMessage(error));
      return;
    }
    toast.success('Mot de passe mis à jour');
    await navigate('/admin', { replace: true });
  });

  if (loading) return <PageLoader />;

  return (
    <AuthLayout title="Nouveau mot de passe" subtitle="Choisissez un mot de passe robuste">
      <title>Réinitialisation du mot de passe — Chef Pro</title>
      <meta name="robots" content="noindex" />
      {!user ? (
        <p className="text-center text-neutral-600">
          Ce lien est invalide ou a expiré. <Link to="/login">Demander un nouveau lien</Link>
        </p>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-5" noValidate>
          <Field label="Nouveau mot de passe" error={errors.password?.message}>
            {(control) => (
              <Input {...control} type="password" autoComplete="new-password" {...form.register('password')} />
            )}
          </Field>
          <Field label="Confirmation" error={errors.confirm?.message}>
            {(control) => (
              <Input {...control} type="password" autoComplete="new-password" {...form.register('confirm')} />
            )}
          </Field>
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Enregistrer
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
