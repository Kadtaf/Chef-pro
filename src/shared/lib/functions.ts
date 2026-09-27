import { unwrapFunctionError } from './errors';
import { supabase } from './supabase';

/**
 * Invokes a Supabase edge function (the user's JWT is attached automatically)
 * and surfaces the `{ error }` message returned by our functions.
 */
export async function invokeFunction<T>(name: string, body: unknown): Promise<T> {
  const response = await supabase.functions.invoke<T>(name, { body: body as Record<string, unknown> });
  if (response.error) throw await unwrapFunctionError(response.error as unknown);
  if (response.data === null) throw new Error('Réponse vide du serveur');
  return response.data;
}
