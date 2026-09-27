import { useEffect, useRef } from 'react';
import { env } from '@/shared/lib/env';

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile unavailable'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export const captchaEnabled = !!env.VITE_TURNSTILE_SITE_KEY;

/** Cloudflare Turnstile widget (privacy-friendly captcha). Renders nothing when not configured. */
export function Turnstile({ onToken }: { onToken: (token: string | undefined) => void }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!captchaEnabled || !container.current) return;
    let widgetId: string | undefined;
    let cancelled = false;
    void loadScript().then(() => {
      if (cancelled || !container.current || !window.turnstile) return;
      widgetId = window.turnstile.render(container.current, {
        sitekey: env.VITE_TURNSTILE_SITE_KEY,
        language: 'fr',
        callback: (token: string) => onToken(token),
        'expired-callback': () => onToken(undefined),
      });
    });
    return () => {
      cancelled = true;
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [onToken]);

  return captchaEnabled ? <div ref={container} className="min-h-16" /> : null;
}

/** Visually hidden field bots tend to fill in. */
export function Honeypot({ register }: { register: object }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Ne pas remplir
        <input type="text" tabIndex={-1} autoComplete="off" {...register} />
      </label>
    </div>
  );
}
