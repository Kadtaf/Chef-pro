/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  /** 'true' when Supabase image transformations are available (Pro plan). */
  readonly VITE_SUPABASE_IMAGE_TRANSFORMS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
