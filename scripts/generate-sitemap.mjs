/**
 * Generates public/sitemap.xml before each build: static pages + published
 * recipes and articles (read through the public REST API, so only published
 * rows are visible). Never fails the build: falls back to static pages.
 */
import { writeFileSync } from 'node:fs';
import { loadEnv } from 'vite';

const env = { ...loadEnv(process.env.MODE ?? 'production', process.cwd(), 'VITE_'), ...process.env };
const site = (env.VITE_SITE_URL || 'https://chef-pro-bordeaux.fr').replace(/\/$/, '');
const today = new Date().toISOString().slice(0, 10);

const pages = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/services', priority: '0.9', changefreq: 'monthly' },
  { path: '/tarifs', priority: '0.9', changefreq: 'monthly' },
  { path: '/recettes', priority: '0.9', changefreq: 'daily' },
  { path: '/menus-de-saison', priority: '0.7', changefreq: 'weekly' },
  { path: '/accords-mets-vins', priority: '0.6', changefreq: 'weekly' },
  { path: '/techniques', priority: '0.7', changefreq: 'weekly' },
  { path: '/conseils', priority: '0.7', changefreq: 'weekly' },
  { path: '/a-propos', priority: '0.7', changefreq: 'yearly' },
  { path: '/avis', priority: '0.6', changefreq: 'weekly' },
  { path: '/contact', priority: '0.8', changefreq: 'yearly' },
  { path: '/mentions-legales', priority: '0.2', changefreq: 'yearly' },
].map((p) => ({ ...p, lastmod: today }));

async function fetchPublished(table, select) {
  const response = await fetch(
    `${env.VITE_SUPABASE_URL}/rest/v1/${table}?select=${select}&is_published=eq.true&order=updated_at.desc`,
    {
      headers: { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` },
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

const ARTICLE_PATHS = { technique: '/techniques', conseil: '/conseils' };

async function dynamicPages() {
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) return [];
  const [recipes, articles] = await Promise.allSettled([
    fetchPublished('recipes', 'slug,updated_at'),
    fetchPublished('articles', 'slug,kind,updated_at'),
  ]);
  const urls = [];
  if (recipes.status === 'fulfilled')
    urls.push(
      ...recipes.value.map((r) => ({
        path: `/recettes/${encodeURIComponent(r.slug)}`,
        lastmod: String(r.updated_at).slice(0, 10),
        changefreq: 'monthly',
        priority: '0.7',
      })),
    );
  else console.warn(`[sitemap] recipes skipped: ${recipes.reason.message}`);
  if (articles.status === 'fulfilled')
    urls.push(
      ...articles.value
        .filter((a) => ARTICLE_PATHS[a.kind])
        .map((a) => ({
          path: `${ARTICLE_PATHS[a.kind]}/${encodeURIComponent(a.slug)}`,
          lastmod: String(a.updated_at).slice(0, 10),
          changefreq: 'monthly',
          priority: '0.6',
        })),
    );
  else console.warn(`[sitemap] articles skipped: ${articles.reason.message}`);
  return urls;
}

const urls = [...pages, ...(await dynamicPages())];
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${site}${u.path}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
  )
  .join('\n')}
</urlset>
`;
writeFileSync('public/sitemap.xml', xml);
console.log(`[sitemap] ${urls.length} URLs written`);
