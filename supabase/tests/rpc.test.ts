import { beforeAll, describe, expect, it } from 'vitest';
import { as, createTestDb, createUser, errorOf, type TestDb } from './support/db';

let db: TestDb;
let adminId: string;
let viewerId: string;

const admin = () => ({ role: 'authenticated', userId: adminId }) as const;

beforeAll(async () => {
  db = await createTestDb();
  adminId = await createUser(db, 'chef@example.com', 'admin');
  viewerId = await createUser(db, 'viewer@example.com');
}, 60_000);

const recipe = (overrides: Record<string, unknown> = {}) => ({
  title: 'Bœuf bourguignon',
  category: 'Plat principal',
  servings: 4,
  ...overrides,
});

describe('save_recipe', () => {
  it('creates recipe, ingredients and ordered steps atomically', async () => {
    const result = await as(db, admin(), async (tx) => {
      const {
        rows: [{ id }],
      } = await tx.query<{ id: string }>('select public.save_recipe($1, $2, $3) as id', [
        recipe(),
        [{ name: 'Boeuf', quantity: 800, unit: 'g', allergens: [] }, { name: 'Vin' }],
        [{ instruction: 'Mariner' }, { instruction: 'Mijoter' }],
      ]);
      const { rows: r } = await tx.query('select slug, prep_time from public.recipes where id = $1', [id]);
      const { rows: ingredients } = await tx.query('select name, unit from public.recipe_ingredients order by name');
      const { rows: steps } = await tx.query('select step_number, instruction from public.recipe_steps order by 1');
      return { r: r[0], ingredients, steps };
    });

    expect(result.r).toEqual({ slug: 'boeuf-bourguignon', prep_time: 0 });
    expect(result.ingredients).toEqual([
      { name: 'Boeuf', unit: 'g' },
      { name: 'Vin', unit: 'g' },
    ]);
    expect(result.steps).toEqual([
      { step_number: 1, instruction: 'Mariner' },
      { step_number: 2, instruction: 'Mijoter' },
    ]);
  });

  it('updates in place, replaces children and keeps slugs unique', async () => {
    const result = await as(db, admin(), async (tx) => {
      const save = async (payload: unknown, ingredients: unknown[] = []) =>
        (await tx.query<{ id: string }>('select public.save_recipe($1, $2, $3) as id', [payload, ingredients, []]))
          .rows[0].id;

      const first = await save(recipe(), [{ name: 'A' }, { name: 'B' }]);
      const second = await save(recipe());
      await save({ id: first, title: 'Nouveau titre', slug: 'boeuf-bourguignon' }, [{ name: 'C' }]);

      const { rows } = await tx.query<{ id: string; slug: string; title: string }>(
        'select id, slug, title from public.recipes order by created_at, slug',
      );
      const { rows: children } = await tx.query('select name from public.recipe_ingredients where recipe_id = $1', [
        first,
      ]);
      return { first, second, rows, children };
    });

    expect(result.rows.find((r) => r.id === result.first)).toMatchObject({
      slug: 'boeuf-bourguignon',
      title: 'Nouveau titre',
    });
    expect(result.rows.find((r) => r.id === result.second)?.slug).toBe('boeuf-bourguignon-2');
    expect(result.children).toEqual([{ name: 'C' }]);
  });

  it('rolls everything back when a child is invalid', async () => {
    const outcome = await as(db, admin(), async (tx) => {
      const error = await errorOf(
        tx.query('select public.save_recipe($1, $2, $3)', [recipe({ slug: 'rollback' }), [{ quantity: 1 }], []]),
      );
      return error;
    });
    expect(outcome).toMatch(/null value in column "name"/);
    const { rows } = await db.query(`select 1 from public.recipes where slug = 'rollback'`);
    expect(rows).toHaveLength(0);
  });

  it('is refused for non-admins', async () => {
    const error = await as(db, { role: 'authenticated', userId: viewerId }, (tx) =>
      errorOf(tx.query('select public.save_recipe($1, $2, $3)', [recipe(), [], []])),
    );
    expect(error).toMatch(/Forbidden/);
  });
});

describe('save_menu / save_card', () => {
  it('creates inline recipes for menu items', async () => {
    const result = await as(db, admin(), async (tx) => {
      const {
        rows: [{ id }],
      } = await tx.query<{ id: string }>('select public.save_menu($1, $2) as id', [
        { title: "Menu d'automne", season: 'automne' },
        [
          {
            item_type: 'entree',
            custom_title: 'Velouté',
            recipe: { recipe: recipe({ title: 'Velouté de potiron' }), ingredients: [{ name: 'Potiron' }], steps: [] },
          },
          { item_type: 'dessert', custom_title: 'Tarte' },
        ],
      ]);
      const { rows } = await tx.query<{ position: number; custom_title: string; recipe_title: string | null }>(
        `select mi.position, mi.custom_title, r.title as recipe_title
         from public.menu_items mi left join public.recipes r on r.id = mi.recipe_id
         where mi.menu_id = $1 order by mi.position`,
        [id],
      );
      return rows;
    });
    expect(result).toEqual([
      { position: 1, custom_title: 'Velouté', recipe_title: 'Velouté de potiron' },
      { position: 2, custom_title: 'Tarte', recipe_title: null },
    ]);
  });

  it('saves card sections with their items', async () => {
    const rows = await as(db, admin(), async (tx) => {
      const {
        rows: [{ id }],
      } = await tx.query<{ id: string }>('select public.save_card($1, $2) as id', [
        { title: "Carte d'été", category: 'restaurant', season: 'ete' },
        [
          { title: 'Entrées', items: [{ custom_title: 'Gaspacho', price: 9 }] },
          {
            title: 'Plats',
            items: [
              { custom_title: 'Bar', price: 24 },
              { custom_title: 'Risotto', price: 19 },
            ],
          },
        ],
      ]);
      return (
        await tx.query(
          `select s.position as s, s.title, i.position as i, i.custom_title, i.price::float as price
           from public.card_sections s join public.card_section_items i on i.card_section_id = s.id
           where s.card_id = $1 order by 1, 3`,
          [id],
        )
      ).rows;
    });
    expect(rows).toEqual([
      { s: 1, title: 'Entrées', i: 1, custom_title: 'Gaspacho', price: 9 },
      { s: 2, title: 'Plats', i: 1, custom_title: 'Bar', price: 24 },
      { s: 2, title: 'Plats', i: 2, custom_title: 'Risotto', price: 19 },
    ]);
  });
});

describe('dashboard & audit', () => {
  it('computes stats and records activity', async () => {
    const result = await as(db, admin(), async (tx) => {
      await tx.query(
        `insert into public.revenues (amount, date_received) values (1000, current_date), (500, current_date - 400)`,
      );
      await tx.query(
        `insert into public.missions (title, client_name, type, status) values ('M', 'C', 'chef', 'en_cours')`,
      );
      const {
        rows: [{ stats }],
      } = await tx.query<{ stats: Record<string, unknown> }>('select public.dashboard_stats() as stats');
      const { rows: logs } = await tx.query<{ action: string; entity_type: string; actor_id: string }>(
        'select action, entity_type, actor_id from public.activity_logs order by created_at',
      );
      return { stats, logs };
    });

    expect(result.stats).toMatchObject({
      revenues: { total: 1500, thisMonth: 1000 },
      missions: { total: 1, inProgress: 1 },
    });
    expect(result.stats.monthly).toHaveLength(12);
    expect(result.logs).toContainEqual({ action: 'insert', entity_type: 'missions', actor_id: adminId });
  });

  it('dashboard is admin only', async () => {
    const error = await as(db, { role: 'authenticated', userId: viewerId }, (tx) =>
      errorOf(tx.query('select public.dashboard_stats()')),
    );
    expect(error).toMatch(/Forbidden/);
  });
});

describe('slugify', () => {
  it('handles French accents and ligatures', async () => {
    const { rows } = await db.query<{ s: string }>(`select public.slugify('Œufs brouillés à l''Été !') as s`);
    expect(rows[0].s).toBe('oeufs-brouilles-a-l-ete');
  });
});
