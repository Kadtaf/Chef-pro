import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { HttpError, requireEnv } from './http.ts';

/** Service-role client: bypasses RLS, use only after authorising the caller. */
export function serviceClient(): SupabaseClient {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Resolves the caller from its JWT and ensures it has the admin role. */
export async function requireAdmin(req: Request): Promise<{ user: User; admin: SupabaseClient }> {
  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) throw new HttpError(401, 'Unauthorized');

  const admin = serviceClient();
  const {
    data: { user },
    error,
  } = await admin.auth.getUser(authorization.slice('Bearer '.length));
  if (error || !user) throw new HttpError(401, 'Unauthorized');

  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') throw new HttpError(403, 'Forbidden');

  return { user, admin };
}

/** Rejects the call when the user exceeded their daily AI quota. */
export async function enforceAiQuota(admin: SupabaseClient, userId: string): Promise<void> {
  const limit = Number(Deno.env.get('AI_DAILY_LIMIT') ?? '50');
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from('ai_generations')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', userId)
    .gte('created_at', since);
  if (error) throw error;
  if ((count ?? 0) >= limit) {
    throw new HttpError(429, `Quota IA quotidien atteint (${limit} générations / 24 h)`);
  }
}

export async function logGeneration(
  admin: SupabaseClient,
  entry: {
    userId: string;
    type: string;
    prompt: string;
    result?: unknown;
    model: string;
    usage?: unknown;
    status: 'success' | 'error';
  },
): Promise<string | null> {
  const { data, error } = await admin
    .from('ai_generations')
    .insert({
      created_by: entry.userId,
      type: entry.type,
      prompt: entry.prompt,
      result: entry.result ?? null,
      model: entry.model,
      usage: entry.usage ?? null,
      status: entry.status,
    })
    .select('id')
    .single();
  if (error) console.error('Failed to log AI generation', error);
  return data?.id ?? null;
}
