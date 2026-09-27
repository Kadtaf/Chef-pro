import type * as Sentry from '@sentry/react';
import { env } from './env';

type SentryModule = typeof Sentry;

let sentry: Promise<SentryModule> | null = null;

/** Loads and initialises Sentry only when a DSN is configured (keeps it out of the main bundle). */
function loadSentry(): Promise<SentryModule> | null {
  if (!env.VITE_SENTRY_DSN) return null;
  sentry ??= import('@sentry/react').then((Sentry) => {
    Sentry.init({ dsn: env.VITE_SENTRY_DSN, environment: import.meta.env.MODE, tracesSampleRate: 0.1 });
    return Sentry;
  });
  return sentry;
}

export function initMonitoring(): void {
  void loadSentry();
}

export function reportError(error: unknown): void {
  if (import.meta.env.DEV) console.error(error);
  void loadSentry()?.then((Sentry) => Sentry.captureException(error));
}
