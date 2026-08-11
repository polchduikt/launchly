import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLIENT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(CLIENT_DIR, 'public');

async function loadDotEnv() {
  let contents;
  try {
    contents = await readFile(path.join(CLIENT_DIR, '.env'), 'utf8');
  } catch {
    return;
  }
  for (const line of contents.split('\n')) {
    const match = /^\s*([\w.-]+)\s*=(.*)$/.exec(line);
    if (!match) continue;
    const key = match[1];
    if (process.env[key] === undefined) {
      process.env[key] = (match[2] ?? '').trim().replace(/^["']|["']$/g, '');
    }
  }
}
await loadDotEnv();

function stripTrailingSlashes(url) {
  let result = url;
  while (result.endsWith('/')) result = result.slice(0, -1);
  return result;
}

if (!process.env.VITE_SITE_URL) {
  console.warn(
    '[seo] VITE_SITE_URL is not set — falling back to https://launchly.app. ' +
    'Set it in .env or CI environment variables for production builds.'
  );
}

const SITE_URL = stripTrailingSlashes(process.env.VITE_SITE_URL || 'https://launchly.app');
const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const STATIC_ROUTES = [
  { path: '/',               priority: '1.0', changefreq: 'weekly'  },
  { path: '/blog',           priority: '0.9', changefreq: 'daily'   },
  { path: '/faq',            priority: '0.8', changefreq: 'monthly' },
  { path: '/terms',          priority: '0.6', changefreq: 'monthly' },
  { path: '/privacy',        priority: '0.6', changefreq: 'monthly' },
  { path: '/acceptable-use', priority: '0.5', changefreq: 'monthly' },
  { path: '/ai-terms',       priority: '0.5', changefreq: 'monthly' },
  { path: '/payment-terms',  priority: '0.5', changefreq: 'monthly' },
];

const SUPPORTED_LANGS = ['uk', 'en'];
function buildSitemapUrl({ path: urlPath, priority, changefreq }) {
  const loc = `${SITE_URL}${urlPath === '/' ? '' : urlPath}`;
  const hreflangLinks = SUPPORTED_LANGS.map(
    (lang) => `      <xhtml:link rel="alternate" hreflang="${lang}" href="${loc}"/>`
  ).join('\n');
  const xDefault = `      <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>`;

  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    `    <lastmod>${TODAY}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    hreflangLinks,
    xDefault,
    '  </url>',
  ].join('\n');
}

function buildSitemap(routes) {
  const urlBlocks = routes.map(buildSitemapUrl).join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset',
    '  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '  xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    urlBlocks,
    '</urlset>',
  ].join('\n');
}

function buildRobots() {
  return [
    'User-agent: *',
    '',
    '# Allow public pages',
    'Allow: /',
    'Allow: /blog',
    'Allow: /faq',
    'Allow: /terms',
    'Allow: /privacy',
    'Allow: /acceptable-use',
    'Allow: /ai-terms',
    'Allow: /payment-terms',
    '',
    '# Disallow private / app pages',
    'Disallow: /dashboard',
    'Disallow: /home',
    'Disallow: /chat',
    'Disallow: /contacts',
    'Disallow: /automations',
    'Disallow: /builder',
    'Disallow: /settings',
    'Disallow: /integrations',
    'Disallow: /broadcasts',
    'Disallow: /orders',
    'Disallow: /ai',
    'Disallow: /billing/',
    'Disallow: /connect-bot',
    'Disallow: /admin/',
    'Disallow: /templates/',
    'Disallow: /api/',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
  ].join('\n');
}
async function run() {
  await mkdir(PUBLIC_DIR, { recursive: true });
  const sitemap = buildSitemap(STATIC_ROUTES);
  await writeFile(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemap, 'utf8');
  console.log(`[seo] sitemap.xml written — ${STATIC_ROUTES.length} URLs → ${SITE_URL}/sitemap.xml`);
  const robots = buildRobots();
  await writeFile(path.join(PUBLIC_DIR, 'robots.txt'), robots, 'utf8');
  console.log(`[seo] robots.txt written → ${SITE_URL}/robots.txt`);
}

run().catch((err) => {
  console.error('[seo] Failed to generate SEO files:', err);
  process.exit(1);
});
