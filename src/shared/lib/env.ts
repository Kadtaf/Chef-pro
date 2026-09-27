/**
 * Runtime configuration, validated at startup (without a schema library so it
 * stays out of the public site's initial bundle).
 */
function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name] as string | undefined;
  if (!value) throw new Error(`Configuration manquante : ${name} (voir .env.example)`);
  return value;
}

function url(name: keyof ImportMetaEnv, fallback?: string): string {
  const value = (import.meta.env[name] as string | undefined) || fallback;
  try {
    return new URL(value ?? '').toString().replace(/\/$/, '');
  } catch {
    throw new Error(`Configuration invalide : ${name} doit être une URL`);
  }
}

export const env = {
  VITE_SUPABASE_URL: url('VITE_SUPABASE_URL'),
  VITE_SUPABASE_ANON_KEY: required('VITE_SUPABASE_ANON_KEY'),
  VITE_SITE_URL: url('VITE_SITE_URL', 'https://chef-pro-bordeaux.fr'),
  VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN || undefined,
  VITE_TURNSTILE_SITE_KEY: import.meta.env.VITE_TURNSTILE_SITE_KEY || undefined,
} as const;
