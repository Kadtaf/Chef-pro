import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://localhost:4173'];

function allowedOrigins(): string[] {
  const configured = Deno.env.get('ALLOWED_ORIGINS');
  return configured
    ? configured
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : DEFAULT_ORIGINS;
}

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = allowedOrigins();
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
}

/**
 * Wraps a POST handler with CORS pre-flight, JSON body parsing and uniform
 * error responses. Internal errors are logged but never leaked to clients.
 */
export function handler(fn: (req: Request, body: unknown) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req) });
    if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);

    try {
      const body = await req.json().catch(() => {
        throw new HttpError(400, 'Invalid JSON body');
      });
      return await fn(req, body);
    } catch (error) {
      if (error instanceof HttpError) {
        return json(req, { error: error.message, details: error.details }, error.status);
      }
      if (error instanceof ZodError) {
        return json(req, { error: 'Invalid request', details: error.issues }, 400);
      }
      console.error(error);
      return json(req, { error: 'Internal server error' }, 500);
    }
  };
}

export function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    console.error(`Missing environment variable ${name}`);
    throw new HttpError(500, 'Server misconfigured');
  }
  return value;
}

/** SHA-256 hex digest, used to key rate limits without storing raw IPs. */
export async function sha256(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function clientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}
