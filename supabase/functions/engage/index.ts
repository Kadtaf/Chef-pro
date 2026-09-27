import { engageRequestSchema } from '../_shared/ai-schemas.ts';
import { clientIp, handler, HttpError, json, sha256 } from '../_shared/http.ts';
import { serviceClient } from '../_shared/supabase.ts';

/**
 * Anonymous engagement (views, likes, ratings).
 * Visitors are identified by a random id stored in their browser; abuse is
 * limited per hashed IP, and ratings are unique per (recipe, visitor).
 */
const LIMITS: Record<string, { limit: number; windowSeconds: number }> = {
  view: { limit: 120, windowSeconds: 3600 },
  like: { limit: 30, windowSeconds: 3600 },
  unlike: { limit: 30, windowSeconds: 3600 },
  rate: { limit: 20, windowSeconds: 3600 },
};

Deno.serve(
  handler(async (req, body) => {
    const request = engageRequestSchema.parse(body);
    if (request.event === 'rate' && !request.rating) throw new HttpError(400, 'Note manquante');

    const admin = serviceClient();
    const ipHash = await sha256(clientIp(req));
    const { limit, windowSeconds } = LIMITS[request.event]!;
    const { data: allowed, error: limitError } = await admin.rpc('consume_rate_limit', {
      p_key: `engage:${request.event}:${ipHash}`,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (limitError) throw limitError;
    if (!allowed) throw new HttpError(429, 'Trop de requêtes, réessayez plus tard');

    const { data, error } = await admin.rpc('record_engagement', {
      p_recipe_id: request.recipe_id,
      p_event: request.event,
      p_visitor_id: request.visitor_id,
      p_rating: request.rating ?? null,
    });
    if (error) {
      if (error.code === 'P0002') throw new HttpError(404, 'Recette introuvable');
      throw error;
    }
    return json(req, data);
  }),
);
