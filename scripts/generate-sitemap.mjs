/**
 * Generates public/sitemap.xml before each build: static pages + published
 * recipes (read through the public REST API, so only published rows are
 * visible). Never fails the build: falls back to static pages.
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
  { path: '/recettes', priority: '0.8', changefreq: 'weekly' },
  { path: '/portfolio', priority: '0.7', changefreq: 'monthly' },
  { path: '/a-propos', priority: '0.7', changefreq: 'yearly' },
  { path: '/avis', priority: '0.6', changefreq: 'weekly' },
  { path: '/contact', priority: '0.8', changefreq: 'yearly' },
  { path: '/mentions-legales', priority: '0.2', changefreq: 'yearly' },
].map((p) => ({ ...p, lastmod: today }));

async function publishedRecipes() {
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) return [];
  try {
    const response = await fetch(
      `${env.VITE_SUPABASE_URL}/rest/v1/recipes?select=slug,updated_at&is_published=eq.true&order=updated_at.desc`,
      {
        headers: { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = await response.json();
    return rows.map((r) => ({
      path: `/recettes/${encodeURIComponent(r.slug)}`,
      lastmod: String(r.updated_at).slice(0, 10),
      changefreq: 'monthly',
      priority: '0.6',
    }));
  } catch (error) {
    console.warn(`[sitemap] recipes skipped: ${error.message}`);
    return [];
  }
}

const urls = [...pages, ...(await publishedRecipes())];
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
