import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';

const root = join(import.meta.dirname, '..', '..');

/**
 * Boots an in-memory Postgres, installs the Supabase stub and applies every
 * migration in order — exactly what `supabase db reset` would do.
 */
export async function createTestDb() {
  const db = new PGlite();
  await db.exec(readFileSync(join(import.meta.dirname, 'supabase-stub.sql'), 'utf8'));

  const migrationsDir = join(root, 'migrations');
  for (const file of readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    try {
      await db.exec(readFileSync(join(migrationsDir, file), 'utf8'));
    } catch (error) {
      throw new Error(`Migration ${file} failed: ${(error as Error).message}`);
    }
  }
  return db;
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>;

/** Creates an auth user; the trigger provisions its profile. */
export async function createUser(db: TestDb, email: string, role?: 'admin' | 'editor' | 'viewer') {
  const {
    rows: [user],
  } = await db.query<{ id: string }>('insert into auth.users (email) values ($1) returning id', [email]);
  if (role) {
    await db.query('update public.profiles set role = $1 where id = $2', [role, user.id]);
  }
  return user.id;
}

type Actor = { role: 'anon' } | { role: 'authenticated'; userId: string } | { role: 'service_role' };

/**
 * Runs `fn` impersonating a PostgREST request (role + JWT subject), inside a
 * transaction that is always rolled back so tests stay isolated.
 */
export async function as<T>(db: TestDb, actor: Actor, fn: (tx: TestDb) => Promise<T>): Promise<T> {
  await db.exec('begin');
  try {
    await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [
      actor.role === 'authenticated' ? actor.userId : '',
    ]);
    await db.exec(`set local role ${actor.role}`);
    return await fn(db);
  } finally {
    await db.exec('rollback');
  }
}

/** Resolves to the Postgres error message, or null if the promise succeeded. */
export async function errorOf(promise: Promise<unknown>): Promise<string | null> {
  try {
    await promise;
    return null;
  } catch (error) {
    return (error as Error).message;
  }
}
