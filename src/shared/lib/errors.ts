import { FunctionsHttpError } from '@supabase/supabase-js';

type PostgrestLike = { code?: string; message?: string; details?: string };

const POSTGRES_MESSAGES: Record<string, string> = {
  '23505': 'Cette valeur existe déjà (doublon).',
  '23503': 'Cet élément est référencé ailleurs et ne peut pas être supprimé.',
  '23514': 'Une valeur ne respecte pas les contraintes attendues.',
  '23502': 'Un champ obligatoire est manquant.',
  '42501': "Vous n'avez pas les droits nécessaires pour cette action.",
  PGRST116: 'Élément introuvable.',
};

/** Turns any thrown value into a message that can be shown to the user. */
export function toUserMessage(error: unknown): string {
  if (!error) return 'Une erreur inconnue est survenue.';
  const pg = error as PostgrestLike;
  if (pg.code && POSTGRES_MESSAGES[pg.code]) return POSTGRES_MESSAGES[pg.code]!;
  if (error instanceof Error && error.message === 'Failed to fetch') {
    return 'Connexion impossible. Vérifiez votre réseau.';
  }
  if (error instanceof Error) return error.message;
  if (typeof pg.message === 'string') return pg.message;
  return 'Une erreur inconnue est survenue.';
}

/** Extracts the `{ error }` payload returned by our edge functions. */
export async function unwrapFunctionError(error: unknown): Promise<Error> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = (await (error.context as Response).json()) as { error?: string };
      if (body?.error) return new Error(body.error);
    } catch {
      /* body was not JSON */
    }
  }
  return error instanceof Error ? error : new Error(toUserMessage(error));
}
