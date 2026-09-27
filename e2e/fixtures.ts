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
  equipment: ['Blender', 'Chinois'],
  chef_tips: 'Torréfiez les noisettes à sec pour révéler leurs arômes.',
  variations: null,
  wine_pairing: 'Un Graves blanc, dont le gras répond à la douceur du potimarron.',
  likes_count: 12,
  views_count: 340,
  rating_avg: 4.5,
  rating_count: 8,
  published_at: CREATED,
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
  recipe_terms: [
    {
      term_id: 't-entree',
      taxonomy_terms: { id: 't-entree', kind: 'type', name: 'Entrée', slug: 'entree', icon: null },
    },
    {
      term_id: 't-veloute',
      taxonomy_terms: { id: 't-veloute', kind: 'type', name: 'Velouté', slug: 'veloute', icon: null },
    },
  ],
};

const { recipe_ingredients: _ingredients, recipe_steps: _steps, recipe_terms: _terms, ...recipeRow } = recipe;

const terms = [
  {
    id: 't-entree',
    kind: 'type',
    name: 'Entrée',
    slug: 'entree',
    icon: null,
    description: null,
    position: 1,
    created_at: CREATED,
  },
  {
    id: 't-veloute',
    kind: 'type',
    name: 'Velouté',
    slug: 'veloute',
    icon: null,
    description: null,
    position: 2,
    created_at: CREATED,
  },
  {
    id: 't-dessert',
    kind: 'type',
    name: 'Dessert',
    slug: 'dessert',
    icon: null,
    description: null,
    position: 3,
    created_at: CREATED,
  },
];

const seasons = [
  {
    slug: 'printemps',
    name: 'Printemps',
    months: [3, 4, 5],
    description: 'Asperges, petits pois.',
    image_url: null,
    position: 1,
  },
  { slug: 'ete', name: 'Été', months: [6, 7, 8], description: 'Tomates, pêches.', image_url: null, position: 2 },
  {
    slug: 'automne',
    name: 'Automne',
    months: [9, 10, 11],
    description: 'Courges, cèpes.',
    image_url: null,
    position: 3,
  },
  { slug: 'hiver', name: 'Hiver', months: [12, 1, 2], description: 'Agrumes, choux.', image_url: null, position: 4 },
];

const article = {
  id: 'a1',
  kind: 'technique',
  title: 'Réussir un beurre blanc',
  slug: 'reussir-un-beurre-blanc',
  excerpt: "L'émulsion reine de la cuisine ligérienne.",
  body: [
    '## Le principe',
    '',
    'Une réduction d’échalote, de vin blanc et de vinaigre, montée au beurre froid.',
    '',
    '1. Réduire à sec.',
    '2. Monter au beurre.',
  ].join('\n'),
  difficulty: 'moyen',
  reading_minutes: 4,
  tags: ['sauce'],
  image_url: null,
  video_url: null,
  is_published: true,
  position: 1,
  published_at: CREATED,
  created_at: CREATED,
  updated_at: CREATED,
};

const career = [
  {
    id: 'c1',
    role: 'Chef de cuisine',
    establishment: 'Le Plana',
    city: 'Bordeaux',
    start_year: 2007,
    end_year: 2023,
    summary: 'Direction de la brigade et création des cartes de saison.',
    missions: ['Création des cartes'],
    skills: ['Management de brigade'],
    techniques: ['Cuisson basse température'],
    cuisine_types: ['Traditionnelle'],
    image_url: null,
    image_prompt: null,
    is_published: true,
    position: 1,
    created_at: CREATED,
    updated_at: CREATED,
  },
];

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

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
    if (url.pathname.startsWith('/functions/v1/newsletter')) return json({ ok: true });
    if (url.pathname.startsWith('/functions/v1/engage'))
      return json({ views: 341, likes: 13, rating_avg: 4.5, rating_count: 8 });
    if (url.pathname === '/rest/v1/rpc/search_recipes') {
      const args = (route.request().postDataJSON() ?? {}) as { p_query?: string; p_type?: string; p_season?: string };
      const typeSlugs = ['entree', 'veloute'];
      const matches =
        (!args.p_query || normalize(recipe.title).includes(normalize(args.p_query))) &&
        (!args.p_type || typeSlugs.includes(args.p_type)) &&
        (!args.p_season || args.p_season === recipe.season);
      return json(matches ? [{ ...recipeRow, type_slugs: typeSlugs, total_count: 1 }] : []);
    }
    if (url.pathname === '/rest/v1/rpc/related_recipes') return json([]);
    if (url.pathname === '/rest/v1/taxonomy_terms') return json(terms);
    if (url.pathname === '/rest/v1/seasons') return json(seasons);
    if (url.pathname === '/rest/v1/career_experiences') return json(career);
    if (url.pathname === '/rest/v1/articles') {
      const slug = url.searchParams.get('slug');
      if (slug) return json(slug === `eq.${article.slug}` ? (single ? article : [article]) : single ? null : []);
      const kind = url.searchParams.get('kind');
      return json(!kind || kind === 'eq.technique' ? [article] : []);
    }
    if (url.pathname === '/rest/v1/recipes') {
      const slug = url.searchParams.get('slug');
      if (slug === 'eq.veloute-de-potimarron') return json(single ? recipe : [recipe]);
      if (slug) return json(single ? null : []);
      const ids = url.searchParams.get('id');
      if (ids && !ids.includes(RECIPE_ID)) return json([]);
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
