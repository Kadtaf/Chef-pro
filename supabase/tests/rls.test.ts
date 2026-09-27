import { beforeAll, describe, expect, it } from 'vitest';
import { as, createTestDb, createUser, errorOf, type TestDb } from './support/db';

let db: TestDb;
let adminId: string;
let viewerId: string;

beforeAll(async () => {
  db = await createTestDb();
  adminId = await createUser(db, 'chef@example.com', 'admin');
  viewerId = await createUser(db, 'random@example.com');

  await db.exec(`
    insert into public.recipes (id, title, slug, category, is_published) values
      ('00000000-0000-0000-0000-000000000001', 'Publiée', 'publiee', 'Plat principal', true),
      ('00000000-0000-0000-0000-000000000002', 'Brouillon', 'brouillon', 'Plat principal', false);
    insert into public.recipe_ingredients (recipe_id, name) values
      ('00000000-0000-0000-0000-000000000001', 'Sel'),
      ('00000000-0000-0000-0000-000000000002', 'Secret');
    insert into public.missions (title, client_name, type, status) values ('Mission', 'Client', 'chef', 'en_cours');
    insert into public.comments (author_name, content, is_approved) values
      ('Alice', 'Super', true), ('Bob', 'En attente', false);
  `);
}, 60_000);

describe('profiles', () => {
  it('are provisioned by trigger with least privilege', async () => {
    const { rows } = await db.query<{ role: string }>('select role from public.profiles where id = $1', [viewerId]);
    expect(rows[0].role).toBe('viewer');
  });

  it('cannot self-promote to admin', async () => {
    const error = await as(db, { role: 'authenticated', userId: viewerId }, (tx) =>
      errorOf(tx.query(`update public.profiles set role = 'admin' where id = $1`, [viewerId])),
    );
    expect(error).toMatch(/permission denied/);
  });

  it('can update their own display name only', async () => {
    const updated = await as(db, { role: 'authenticated', userId: viewerId }, async (tx) => {
      await tx.query(`update public.profiles set full_name = 'Moi'`);
      return tx.query<{ id: string; full_name: string | null }>('select id, full_name from public.profiles');
    });
    expect(updated.rows).toEqual([{ id: viewerId, full_name: 'Moi' }]);
  });
});

describe('published content', () => {
  it('anon only sees published recipes and their children', async () => {
    const [recipes, ingredients] = await as(db, { role: 'anon' }, async (tx) => [
      (await tx.query<{ slug: string }>('select slug from public.recipes')).rows.map((r) => r.slug),
      (await tx.query<{ name: string }>('select name from public.recipe_ingredients')).rows.map((r) => r.name),
    ]);
    expect(recipes).toEqual(['publiee']);
    expect(ingredients).toEqual(['Sel']);
  });

  it('a signed-in non-admin gets no extra visibility', async () => {
    const slugs = await as(db, { role: 'authenticated', userId: viewerId }, async (tx) =>
      (await tx.query<{ slug: string }>('select slug from public.recipes')).rows.map((r) => r.slug),
    );
    expect(slugs).toEqual(['publiee']);
  });

  it('admin sees drafts', async () => {
    const { rows } = await as(db, { role: 'authenticated', userId: adminId }, (tx) =>
      tx.query('select id from public.recipes'),
    );
    expect(rows).toHaveLength(2);
  });
});

describe('writes', () => {
  it('a signed-in non-admin cannot modify content', async () => {
    const viewer = { role: 'authenticated', userId: viewerId } as const;
    const insertError = await as(db, viewer, (tx) =>
      errorOf(tx.query(`insert into public.recipes (title, slug, category) values ('x', 'x', 'Plat principal')`)),
    );
    const deleted = await as(db, viewer, (tx) => tx.query('delete from public.recipes'));
    expect(insertError).toMatch(/row-level security/);
    expect(deleted.affectedRows).toBe(0);
  });

  it('admin can write content', async () => {
    const { affectedRows } = await as(db, { role: 'authenticated', userId: adminId }, (tx) =>
      tx.query(`insert into public.recipes (title, slug, category) values ('x', 'x', 'Plat principal')`),
    );
    expect(affectedRows).toBe(1);
  });

  it('anon cannot insert comments or contact messages directly', async () => {
    const comment = await as(db, { role: 'anon' }, (tx) =>
      errorOf(tx.query(`insert into public.comments (author_name, content, is_approved) values ('x', 'y', true)`)),
    );
    const contact = await as(db, { role: 'anon' }, (tx) =>
      errorOf(tx.query(`insert into public.contact_submissions (name, email, message) values ('x', 'x@y.fr', 'z')`)),
    );
    expect(comment).toMatch(/permission denied/);
    expect(contact).toMatch(/permission denied/);
  });
});

describe('private data', () => {
  it('missions are invisible to non-admins', async () => {
    const count = (actor: Parameters<typeof as>[1]) =>
      as(db, actor, async (tx) => (await tx.query('select * from public.missions')).rows.length);
    expect(await count({ role: 'anon' })).toBe(0);
    expect(await count({ role: 'authenticated', userId: viewerId })).toBe(0);
    expect(await count({ role: 'authenticated', userId: adminId })).toBe(1);
  });

  it('only approved comments are public', async () => {
    const { rows } = await as(db, { role: 'anon' }, (tx) =>
      tx.query<{ author_name: string }>('select author_name from public.comments'),
    );
    expect(rows.map((r) => r.author_name)).toEqual(['Alice']);
  });
});

describe('rate limiting', () => {
  it('blocks after the limit and is not callable by clients', async () => {
    const results: boolean[] = [];
    for (let i = 0; i < 4; i++) {
      const { rows } = await as(db, { role: 'service_role' }, (tx) =>
        tx.query<{ ok: boolean }>(`select public.consume_rate_limit('ip:1', 3, 3600) as ok`),
      );
      results.push(rows[0].ok);
      // persist hits across iterations (as() rolls back)
      await db.query(`select public.consume_rate_limit('ip:persist', 3, 3600)`);
    }
    const { rows } = await db.query<{ ok: boolean }>(`select public.consume_rate_limit('ip:persist', 3, 3600) as ok`);
    expect(rows[0].ok).toBe(false);
    expect(results.every(Boolean)).toBe(true);

    const error = await as(db, { role: 'anon' }, (tx) =>
      errorOf(tx.query(`select public.consume_rate_limit('x', 1, 60)`)),
    );
    expect(error).toMatch(/permission denied/);
  });
});
