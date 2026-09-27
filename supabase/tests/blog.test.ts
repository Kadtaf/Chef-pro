import { beforeAll, describe, expect, it } from 'vitest';
import { as, createTestDb, createUser, errorOf, type TestDb } from './support/db';

let db: TestDb;
let adminId: string;
let veloute: string;
let bar: string;
const visitor = '11111111-1111-1111-1111-111111111111';

beforeAll(async () => {
  db = await createTestDb();
  adminId = await createUser(db, 'chef@example.com', 'admin');

  await as(db, { role: 'authenticated', userId: adminId }, async () => undefined);
  const insert = async (title: string, season: string, published: boolean, ingredients: string[], types: string[]) => {
    const {
      rows: [{ id }],
    } = await db.query<{ id: string }>(
      `insert into public.recipes (title, slug, category, season, is_published) values ($1, public.slugify($1), 'Plat', $2, $3) returning id`,
      [title, season, published],
    );
    for (const name of ingredients) {
      await db.query('insert into public.recipe_ingredients (recipe_id, name) values ($1, $2)', [id, name]);
    }
    for (const slug of types) {
      await db.query(
        `insert into public.recipe_terms (recipe_id, term_id) select $1, id from public.taxonomy_terms where kind = 'type' and slug = $2`,
        [id, slug],
      );
    }
    return id;
  };

  veloute = await insert(
    'Velouté de potimarron',
    'automne',
    true,
    ['Potimarron', 'Crème'],
    ['veloute', 'entree', 'vegetarien'],
  );
  bar = await insert('Bar snacké, beurre blanc', 'ete', true, ['Filet de bar', 'Échalote'], ['poisson', 'plat']);
  await insert('Brouillon secret', 'automne', false, ['Truffe'], ['plat']);
}, 60_000);

type SearchRow = { title: string; total_count: string; type_slugs: string[] };
const search = (params: { q?: string; season?: string; type?: string; sort?: string }) =>
  as(
    db,
    { role: 'anon' },
    async (tx) =>
      (
        await tx.query<SearchRow>('select * from public.search_recipes($1, $2, $3, $4)', [
          params.q ?? null,
          params.season ?? null,
          params.type ?? null,
          params.sort ?? 'recent',
        ])
      ).rows,
  );

describe('search_recipes', () => {
  it('is accent-insensitive and searches ingredients', async () => {
    expect((await search({ q: 'veloute' })).map((r) => r.title)).toEqual(['Velouté de potimarron']);
    expect((await search({ q: 'ECHALOTE' })).map((r) => r.title)).toEqual(['Bar snacké, beurre blanc']);
  });

  it('filters by season (including all-season recipes) and by type', async () => {
    expect((await search({ season: 'automne' })).map((r) => r.title)).toEqual(['Velouté de potimarron']);
    expect((await search({ type: 'poisson' })).map((r) => r.title)).toEqual(['Bar snacké, beurre blanc']);
  });

  it('never returns drafts to visitors and reports the total', async () => {
    const rows = await search({});
    expect(rows).toHaveLength(2);
    expect(Number(rows[0]?.total_count)).toBe(2);
    expect(rows.find((r) => r.title === 'Velouté de potimarron')?.type_slugs).toEqual([
      'entree',
      'veloute',
      'vegetarien',
    ]);
  });
});

describe('engagement', () => {
  const engage = (event: string, recipeId: string, rating: number | null = null, visitorId = visitor) =>
    db.query<{ result: { views: number; likes: number; rating_avg: string; rating_count: number } }>(
      'select public.record_engagement($1, $2, $3, $4) as result',
      [recipeId, event, visitorId, rating],
    );

  it('is not callable by visitors directly', async () => {
    const error = await as(db, { role: 'anon' }, (tx) =>
      errorOf(tx.query('select public.record_engagement($1, $2, $3)', [veloute, 'view', visitor])),
    );
    expect(error).toMatch(/permission denied/);
  });

  it('counts views and likes, one rating per visitor, without touching updated_at or the audit log', async () => {
    const before = await db.query<{ updated_at: string }>('select updated_at from public.recipes where id = $1', [
      veloute,
    ]);
    const logs = await db.query('select count(*)::int as n from public.activity_logs');

    await engage('view', veloute);
    await engage('view', veloute);
    await engage('like', veloute);
    await engage('rate', veloute, 5);
    await engage('rate', veloute, 3); // same visitor changes their mind
    const {
      rows: [{ result }],
    } = await engage('rate', veloute, 4, '22222222-2222-2222-2222-222222222222');

    expect(result).toMatchObject({ views: 2, likes: 1, rating_count: 2 });
    expect(Number(result.rating_avg)).toBe(3.5);

    const after = await db.query<{ updated_at: string }>('select updated_at from public.recipes where id = $1', [
      veloute,
    ]);
    expect(after.rows[0]?.updated_at).toEqual(before.rows[0]?.updated_at);
    expect((await db.query('select count(*)::int as n from public.activity_logs')).rows).toEqual(logs.rows);
  });

  it('rejects invalid ratings and unpublished recipes', async () => {
    expect(await errorOf(engage('rate', bar, 9))).toMatch(/Invalid rating/);
    const { rows } = await db.query<{ id: string }>(`select id from public.recipes where not is_published`);
    expect(await errorOf(engage('view', rows[0]!.id))).toMatch(/Recipe not found/);
  });

  it('keeps counters read-only for admins', async () => {
    const views = await as(db, { role: 'authenticated', userId: adminId }, async (tx) => {
      await tx.query('update public.recipes set views_count = 9999, title = title where id = $1', [veloute]);
      return (
        await tx.query<{ views_count: number }>('select views_count from public.recipes where id = $1', [veloute])
      ).rows[0]?.views_count;
    });
    expect(views).toBe(2);
  });
});

describe('related recipes & stats', () => {
  it('suggests other published recipes', async () => {
    const { rows } = await as(db, { role: 'anon' }, (tx) =>
      tx.query<{ title: string }>('select title from public.related_recipes($1, 3)', [veloute]),
    );
    expect(rows.map((r) => r.title)).toEqual(['Bar snacké, beurre blanc']);
  });

  it('exposes blog statistics to admins only', async () => {
    const stats = await as(
      db,
      { role: 'authenticated', userId: adminId },
      async (tx) => (await tx.query<{ s: Record<string, unknown> }>('select public.blog_stats(30) as s')).rows[0]?.s,
    );
    expect(stats).toMatchObject({ totals: { published: 2, drafts: 1 } });
    expect(stats?.topViewed).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'Velouté de potimarron' })]),
    );
    const error = await as(db, { role: 'anon' }, (tx) => errorOf(tx.query('select public.blog_stats()')));
    expect(error).toMatch(/Forbidden|permission denied/);
  });
});

describe('editorial seed', () => {
  it('ships published techniques, advice and the chef career', async () => {
    const { rows } = await as(db, { role: 'anon' }, (tx) =>
      tx.query<{ kind: string; n: number }>(
        'select kind, count(*)::int as n from public.articles group by kind order by kind',
      ),
    );
    expect(rows).toEqual([
      { kind: 'conseil', n: 6 },
      { kind: 'technique', n: 6 },
    ]);
    const career = await as(db, { role: 'anon' }, (tx) =>
      tx.query<{ role: string; establishment: string }>(
        'select role, establishment from public.career_experiences order by position',
      ),
    );
    // Junior positions are drafts: visitors only see chef & sous-chef roles.
    expect(career.rows.map((r) => r.role)).toEqual([
      'Chef de cuisine freelance',
      'Chef de cuisine',
      'Chef de cuisine',
      'Chef de cuisine',
      'Second de cuisine',
    ]);
  });
});
