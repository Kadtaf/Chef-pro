import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/shared/lib/supabase';

const n = z.coerce.number();
const ranked = z.array(
  z.object({ id: z.string(), title: z.string(), slug: z.string(), value: n, rating_count: n.optional() }),
);

const statsSchema = z.object({
  totals: z.object({ published: n, drafts: n, views: n, likes: n, ratings: n }),
  topViewed: ranked,
  topLiked: ranked,
  topRated: ranked,
  daily: z.array(z.object({ day: z.string(), views: n, likes: n })),
  bySeason: z.array(z.object({ season: z.string(), recipes: n, views: n, likes: n })),
});
export type BlogStats = z.infer<typeof statsSchema>;

export function useBlogStats(days: number) {
  return useQuery({
    queryKey: ['blog-stats', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('blog_stats', { p_days: days });
      if (error) throw error;
      return statsSchema.parse(data);
    },
  });
}

/** Recipes with the fields needed to audit their editorial completeness. */
export function useRecipeAudit() {
  return useQuery({
    queryKey: ['recipes', 'audit'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select(
          'id, title, slug, season, is_published, image_url, description, wine_pairing, chef_tips, nutri_score, views_count, published_at, created_at, recipe_terms(count), recipe_ingredients(count), recipe_steps(count)',
        )
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((r) => ({
        ...r,
        termCount: (r.recipe_terms as unknown as { count: number }[])[0]?.count ?? 0,
        ingredientCount: (r.recipe_ingredients as unknown as { count: number }[])[0]?.count ?? 0,
        stepCount: (r.recipe_steps as unknown as { count: number }[])[0]?.count ?? 0,
      }));
    },
  });
}

export type AuditedRecipe = NonNullable<ReturnType<typeof useRecipeAudit>['data']>[number];

const CHECKS: { label: string; ok: (r: AuditedRecipe) => boolean }[] = [
  { label: 'Photo', ok: (r) => !!r.image_url },
  { label: 'Description', ok: (r) => (r.description?.length ?? 0) >= 60 },
  { label: 'Type de recette', ok: (r) => r.termCount > 0 },
  { label: 'Ingrédients', ok: (r) => r.ingredientCount >= 3 },
  { label: 'Étapes', ok: (r) => r.stepCount >= 3 },
  { label: 'Nutri-Score', ok: (r) => !!r.nutri_score },
  { label: 'Conseils du Chef', ok: (r) => !!r.chef_tips },
  { label: 'Accord mets-vins', ok: (r) => !!r.wine_pairing },
];

/** Editorial completeness (0–100) and the list of missing elements. */
export function auditRecipe(recipe: AuditedRecipe) {
  const missing = CHECKS.filter((check) => !check.ok(recipe)).map((check) => check.label);
  return { score: Math.round(((CHECKS.length - missing.length) / CHECKS.length) * 100), missing };
}

export type Suggestion = { tone: 'warning' | 'info'; text: string; to?: string };

/** Actionable improvement ideas derived from statistics and completeness. */
export function improvementSuggestions(recipes: AuditedRecipe[], stats: BlogStats | undefined): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const published = recipes.filter((r) => r.is_published);
  const month = 30 * 24 * 3600 * 1000;

  const noPhoto = published.filter((r) => !r.image_url);
  if (noPhoto.length)
    suggestions.push({
      tone: 'warning',
      text: `${noPhoto.length} recette(s) publiée(s) sans photo : générez-la dans le Studio IA.`,
      to: `/admin/recipes/${noPhoto[0]!.id}/edit`,
    });

  const noPairing = published.filter((r) => !r.wine_pairing);
  if (noPairing.length)
    suggestions.push({
      tone: 'info',
      text: `${noPairing.length} recette(s) sans accord mets-vins : un plus apprécié des lecteurs et de Google.`,
    });

  const noType = published.filter((r) => r.termCount === 0);
  if (noType.length)
    suggestions.push({
      tone: 'warning',
      text: `${noType.length} recette(s) sans type : elles n'apparaissent dans aucun filtre du blog.`,
    });

  const staleDrafts = recipes.filter(
    (r) => !r.is_published && Date.now() - new Date(r.created_at).getTime() > month / 2,
  );
  if (staleDrafts.length)
    suggestions.push({
      tone: 'info',
      text: `${staleDrafts.length} brouillon(s) de plus de 15 jours à finaliser ou supprimer.`,
    });

  const lowViews = published.filter(
    (r) => r.published_at && Date.now() - new Date(r.published_at).getTime() > month && r.views_count < 20,
  );
  if (lowViews.length)
    suggestions.push({
      tone: 'info',
      text: `${lowViews.length} recette(s) peu consultée(s) après un mois : partagez-les dans la newsletter ou sur les réseaux.`,
    });

  for (const season of ['printemps', 'ete', 'automne', 'hiver']) {
    const count = published.filter((r) => r.season === season).length;
    if (count < 3) {
      suggestions.push({
        tone: 'info',
        text: `Seulement ${count} recette(s) de ${season === 'ete' ? 'été' : season} : enrichissez la saison pour le menu automatique.`,
        to: '/admin/ai-studio',
      });
    }
  }

  const topSeason = stats?.bySeason.filter((s) => s.season !== 'all').sort((a, b) => b.views - a.views)[0];
  if (topSeason && topSeason.views > 0)
    suggestions.push({
      tone: 'info',
      text: `Les recettes « ${topSeason.season} » sont les plus consultées : c'est la saison à mettre en avant.`,
    });

  return suggestions;
}
