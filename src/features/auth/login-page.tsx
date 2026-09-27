import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/shared/lib/supabase';
import { toUserMessage } from '@/shared/lib/errors';
import { Button } from '@/shared/ui/button';
import { Field, Input } from '@/shared/ui/form';
import { AuthLayout } from './auth-layout';
import { useAuth } from './use-auth';

const schema = z.object({
  email: z.email('Adresse email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
type Values = z.infer<typeof schema>;

/** Only allow internal redirects (prevents open-redirects). */
function safeRedirect(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/admin';
}

export function Component() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const redirect = safeRedirect(params.get('redirect'));

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });
  const { errors, isSubmitting } = form.formState;

  if (user && !resetMode) return <Navigate to={redirect} replace />;

  const onSubmit = form.handleSubmit(async ({ email, password }) => {
    try {
      await signIn(email, password);
      await navigate(redirect, { replace: true });
    } catch (error) {
      const message = toUserMessage(error);
      form.setError('root', {
        message: /invalid login/i.test(message) ? 'Email ou mot de passe incorrect.' : message,
      });
    }
  });

  const onReset = async () => {
    const email = form.getValues('email');
    if (!z.email().safeParse(email).success) {
      form.setError('email', { message: 'Saisissez votre email pour recevoir le lien' });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
    });
    if (error) toast.error(toUserMessage(error));
    else toast.success('Si un compte existe, un lien de réinitialisation vient d’être envoyé.');
    setResetMode(false);
  };

  return (
    <AuthLayout
      title={resetMode ? 'Mot de passe oublié' : 'Connexion'}
      subtitle={resetMode ? 'Recevez un lien de réinitialisation par email' : 'Accédez à votre espace administrateur'}
    >
      <title>Connexion — Chef Pro</title>
      <meta name="robots" content="noindex" />

      {errors.root && (
        <div className="mb-6 rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-700" role="alert">
          {errors.root.message}
        </div>
      )}

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-5" noValidate>
        <Field label="Email" error={errors.email?.message}>
          {(control) => (
            <Input
              {...control}
              type="email"
              autoComplete="email"
              placeholder="admin@exemple.fr"
              {...form.register('email')}
            />
          )}
        </Field>

        {resetMode ? (
          <Button className="w-full" onClick={() => void onReset()}>
            Envoyer le lien
          </Button>
        ) : (
          <>
            <Field label="Mot de passe" error={errors.password?.message}>
              {(control) => (
                <div className="relative">
                  <Input
                    {...control}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pr-11"
                    {...form.register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              )}
            </Field>
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Se connecter
              <LogIn />
            </Button>
          </>
        )}
      </form>

      <p className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setResetMode((v) => !v)}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          {resetMode ? 'Retour à la connexion' : 'Mot de passe oublié ?'}
        </button>
      </p>
      <p className="mt-2 text-center text-xs text-neutral-400">
        Les comptes sont créés par l&apos;administrateur. <Link to="/contact">Nous contacter</Link>
      </p>
    </AuthLayout>
  );
}
