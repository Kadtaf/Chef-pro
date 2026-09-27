import { test as base, type Page } from '@playwright/test';

const RECIPE_ID = '00000000-0000-0000-0000-000000000001';
const CREATED = '2026-09-01T10:00:00Z';

const recipe = {
  id: RECIPE_ID,
  title: 'Velouté de potimarron',
  slug: 'veloute-de-potimarron',
  description: 'Un velouté soyeux aux noisettes torréfiées.',
  category: 'Entrée',
  season: 'automne',
  difficulty: 'facile',
  prep_time: 15,
  cook_time: 30,
  servings: 4,
  image_url: null,
  calories_per_serving: 180,
  cost_per_serving: 1.2,
  nutri_score: 'A',
  is_published: true,
  is_featured: true,
  created_at: CREATED,
  updated_at: CREATED,
  portion_weight_g: 300,
  fruits_legumes_pct: 80,
  plating: null,
  lipides: 8,
  acides_gras_satures: 2,
  glucides: 20,
  sucres: 6,
  proteines: 4,
  fibres: 4,
  sel: 0.6,
  recipe_ingredients: [
    {
      id: 'i1',
      recipe_id: RECIPE_ID,
      name: 'Potimarron',
      quantity: 1000,
      unit: 'g',
      cost: 3,
      allergens: [],
      calories: 400,
      lipides: 1,
      acides_gras_satures: 0,
      glucides: 80,
      sucres: 24,
      proteines: 10,
      fibres: 16,
      sel: 0,
      created_at: CREATED,
    },
  ],
  recipe_steps: [
    {
      id: 's1',
      recipe_id: RECIPE_ID,
      step_number: 1,
      instruction: 'Cuire le potimarron.',
      image_url: null,
      created_at: CREATED,
    },
  ],
};

/** Answers every Supabase REST / auth / functions call with deterministic data. */
export async function mockSupabase(page: Page) {
  // External stock photos: never depend on third-party hosts in tests.
  await page.route('https://images.pexels.com/**', (route) => route.fulfill({ status: 204 }));

  await page.route('http://supabase.test/**', async (route) => {
    const url = new URL(route.request().url());
    const single = route.request().headers()['accept']?.includes('vnd.pgrst.object') ?? false;
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (url.pathname.startsWith('/auth/v1/token')) {
      return json({ error: 'invalid_grant', error_description: 'Invalid login credentials' }, 400);
    }
    if (url.pathname.startsWith('/functions/v1/public-submit')) return json({ ok: true }, 201);
    if (url.pathname === '/rest/v1/recipes') {
      const slug = url.searchParams.get('slug');
      if (slug === 'eq.veloute-de-potimarron') return json(single ? recipe : [recipe]);
      if (slug) return json(single ? null : []);
      return json([recipe]);
    }
    if (url.pathname.startsWith('/rest/v1/')) return json(single ? null : []);
    return json({});
  });
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await mockSupabase(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
