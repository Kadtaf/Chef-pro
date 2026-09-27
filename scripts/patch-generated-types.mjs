/**
 * One-off helper: adds the tables/columns/functions of the 2026-09-27
 * migrations to database.generated.ts in the exact format produced by
 * `supabase gen types`, until the migrations are pushed and the file is
 * regenerated with `npm run db:types` (which makes this script obsolete).
 */
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'src/shared/types/database.generated.ts';
let src = readFileSync(FILE, 'utf8');

// [name, tsType, nullable, hasDefault]
const tables = {
  articles: {
    columns: [
      ['body', 'string', false, true],
      ['created_at', 'string', false, true],
      ['difficulty', 'string', true, false],
      ['excerpt', 'string', false, true],
      ['id', 'string', false, true],
      ['image_url', 'string', true, false],
      ['is_published', 'boolean', false, true],
      ['kind', 'string', false, false],
      ['position', 'number', false, true],
      ['published_at', 'string', true, false],
      ['reading_minutes', 'number', false, true],
      ['slug', 'string', false, false],
      ['tags', 'string[]', false, true],
      ['title', 'string', false, false],
      ['updated_at', 'string', false, true],
      ['video_url', 'string', true, false],
    ],
    relationships: [],
  },
  career_experiences: {
    columns: [
      ['city', 'string', true, false],
      ['created_at', 'string', false, true],
      ['cuisine_types', 'string[]', false, true],
      ['end_year', 'number', true, false],
      ['establishment', 'string', false, false],
      ['id', 'string', false, true],
      ['image_prompt', 'string', true, false],
      ['image_url', 'string', true, false],
      ['is_published', 'boolean', false, true],
      ['missions', 'string[]', false, true],
      ['position', 'number', false, true],
      ['role', 'string', false, false],
      ['skills', 'string[]', false, true],
      ['start_year', 'number', false, false],
      ['summary', 'string', false, true],
      ['techniques', 'string[]', false, true],
      ['updated_at', 'string', false, true],
    ],
    relationships: [],
  },
  recipe_daily_stats: {
    columns: [
      ['day', 'string', false, true],
      ['likes', 'number', false, true],
      ['recipe_id', 'string', false, false],
      ['views', 'number', false, true],
    ],
    relationships: [['recipe_daily_stats_recipe_id_fkey', 'recipe_id', 'recipes']],
  },
  recipe_ratings: {
    columns: [
      ['created_at', 'string', false, true],
      ['rating', 'number', false, false],
      ['recipe_id', 'string', false, false],
      ['updated_at', 'string', false, true],
      ['visitor_id', 'string', false, false],
    ],
    relationships: [['recipe_ratings_recipe_id_fkey', 'recipe_id', 'recipes']],
  },
  recipe_terms: {
    columns: [
      ['recipe_id', 'string', false, false],
      ['term_id', 'string', false, false],
    ],
    relationships: [
      ['recipe_terms_recipe_id_fkey', 'recipe_id', 'recipes'],
      ['recipe_terms_term_id_fkey', 'term_id', 'taxonomy_terms'],
    ],
  },
  seasons: {
    columns: [
      ['description', 'string', false, true],
      ['image_url', 'string', true, false],
      ['months', 'number[]', false, false],
      ['name', 'string', false, false],
      ['position', 'number', false, false],
      ['slug', 'string', false, false],
    ],
    relationships: [],
  },
  taxonomy_terms: {
    columns: [
      ['created_at', 'string', false, true],
      ['description', 'string', true, false],
      ['icon', 'string', true, false],
      ['id', 'string', false, true],
      ['kind', 'string', false, false],
      ['name', 'string', false, false],
      ['position', 'number', false, true],
      ['slug', 'string', false, false],
    ],
    relationships: [],
  },
};

const newColumns = {
  recipes: [
    ['chef_tips', 'string', true, false],
    ['equipment', 'string[]', false, true],
    ['likes_count', 'number', false, true],
    ['published_at', 'string', true, false],
    ['rating_avg', 'number', false, true],
    ['rating_count', 'number', false, true],
    ['variations', 'string', true, false],
    ['views_count', 'number', false, true],
    ['wine_pairing', 'string', true, false],
  ],
  settings: [
    ['chef_bio', 'string', false, true],
    ['chef_name', 'string', false, true],
    ['chef_portrait_url', 'string', true, false],
    ['chef_title', 'string', false, true],
    ['education', 'string[]', false, true],
    ['languages', 'string[]', false, true],
    ['years_experience', 'number', false, true],
  ],
};

const type = (t, nullable) => (nullable ? `${t} | null` : t);

function tableBlock(name, { columns, relationships }) {
  const row = columns.map(([c, t, n]) => `          ${c}: ${type(t, n)}`).join('\n');
  const insert = columns.map(([c, t, n, d]) => `          ${c}${n || d ? '?' : ''}: ${type(t, n)}`).join('\n');
  const update = columns.map(([c, t, n]) => `          ${c}?: ${type(t, n)}`).join('\n');
  const rels = relationships.length
    ? `[\n${relationships
        .map(
          ([fk, col, ref]) =>
            `          {\n            foreignKeyName: "${fk}"\n            columns: ["${col}"]\n            isOneToOne: false\n            referencedRelation: "${ref}"\n            referencedColumns: ["id"]\n          },`,
        )
        .join('\n')}\n        ]`
    : '[]';
  return `      ${name}: {\n        Row: {\n${row}\n        }\n        Insert: {\n${insert}\n        }\n        Update: {\n${update}\n        }\n        Relationships: ${rels}\n      }\n`;
}

// Insert tables alphabetically inside `Tables: {`.
const tablesStart = src.indexOf('    Tables: {\n') + '    Tables: {\n'.length;
const tablesEnd = src.indexOf('\n    Views:', tablesStart);
for (const [name, def] of Object.entries(tables)) {
  if (src.includes(`      ${name}: {\n        Row:`)) continue;
  const names = [...src.slice(tablesStart, tablesEnd).matchAll(/^ {6}([a-z_]+): \{$/gm)].map((m) => ({
    name: m[1],
    index: tablesStart + m.index,
  }));
  const next = names.find((n) => n.name > name);
  const at = next ? next.index : src.indexOf('    }\n    Views:', tablesStart);
  src = src.slice(0, at) + tableBlock(name, def) + src.slice(at);
}

// Add columns to existing tables (Row / Insert / Update), keeping alphabetical order.
for (const [table, columns] of Object.entries(newColumns)) {
  const start = src.indexOf(`      ${table}: {\n        Row: {`);
  for (const section of ['Row', 'Insert', 'Update']) {
    const sectionStart = src.indexOf(`        ${section}: {\n`, start) + `        ${section}: {\n`.length;
    const sectionEnd = src.indexOf('        }\n', sectionStart);
    let body = src.slice(sectionStart, sectionEnd);
    const lines = body.split('\n').filter(Boolean);
    for (const [c, t, n, d] of columns) {
      if (lines.some((l) => l.trim().startsWith(`${c}:`) || l.trim().startsWith(`${c}?:`))) continue;
      const optional = section === 'Update' || (section === 'Insert' && (n || d));
      lines.push(`          ${c}${optional ? '?' : ''}: ${type(t, n)}`);
    }
    lines.sort((a, b) => a.trim().localeCompare(b.trim()));
    body = `${lines.join('\n')}\n`;
    src = src.slice(0, sectionStart) + body + src.slice(sectionEnd);
  }
}

// Functions.
const searchRow = `{
          calories_per_serving: number
          category: string
          cook_time: number
          description: string
          difficulty: string
          id: string
          image_url: string
          is_featured: boolean
          likes_count: number
          nutri_score: string
          prep_time: number
          published_at: string
          rating_avg: number
          rating_count: number
          season: string
          servings: number
          slug: string
          title: string
          total_count: number
          type_slugs: string[]
          views_count: number
        }[]`;

const functions = {
  blog_stats: `{ Args: { p_days?: number }; Returns: Json }`,
  is_engagement_write: `{ Args: never; Returns: boolean }`,
  normalize_text: `{ Args: { p_value: string }; Returns: string }`,
  record_engagement: `{
        Args: {
          p_event: string
          p_rating?: number
          p_recipe_id: string
          p_visitor_id: string
        }
        Returns: Json
      }`,
  related_recipes: `{
        Args: { p_limit?: number; p_recipe_id: string }
        Returns: Database["public"]["Tables"]["recipes"]["Row"][]
        SetofOptions: {
          from: "*"
          to: "recipes"
          isOneToOne: false
          isSetofReturn: true
        }
      }`,
  search_recipes: `{
        Args: {
          p_limit?: number
          p_offset?: number
          p_query?: string
          p_season?: string
          p_sort?: string
          p_type?: string
        }
        Returns: ${searchRow}
      }`,
};

const fnStart = src.indexOf('    Functions: {\n') + '    Functions: {\n'.length;
for (const [name, def] of Object.entries(functions)) {
  if (src.includes(`      ${name}: {`) || src.includes(`      ${name}: { Args`)) continue;
  const fnEnd = src.indexOf('\n    Enums:', fnStart);
  const names = [...src.slice(fnStart, fnEnd).matchAll(/^ {6}([a-z_]+): /gm)].map((m) => ({
    name: m[1],
    index: fnStart + m.index,
  }));
  const next = names.find((n) => n.name > name);
  const at = next ? next.index : src.indexOf('    }\n    Enums:', fnStart);
  src = src.slice(0, at) + `      ${name}: ${def}\n` + src.slice(at);
}

// save_recipe gained p_term_ids.
src = src.replace(
  /save_recipe: \{\n\s+Args: \{ p_ingredients: Json; p_recipe: Json; p_steps: Json \}/,
  `save_recipe: {\n        Args: {\n          p_ingredients: Json\n          p_recipe: Json\n          p_steps: Json\n          p_term_ids?: string[]\n        }`,
);

writeFileSync(FILE, src);
console.log('database.generated.ts patched');
