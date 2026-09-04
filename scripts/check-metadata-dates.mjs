import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
async function pages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const file = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await pages(file));
    else if (entry.name === 'index.html') found.push(file);
  }
  return found;
}
const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
for (const file of await pages(root)) {
  const html = await readFile(file, 'utf8');
  if (/<meta name="robots" content="[^"]*noindex/i.test(html)) continue;
  const date = html.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"/)?.[1];
  const rel = relative(root, file).replace(/index\.html$/, '');
  const url = `https://www.alasdairmaclullich.com/${rel}`;
  if (!date) throw new Error(`${rel} has no JSON-LD dateModified`);
  const humanDate = new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  if (!html.includes(humanDate)) throw new Error(`${rel} has no visible review date matching dateModified (${date})`);
  for (const reviewed of html.matchAll(/"lastReviewed"\s*:\s*"(\d{4}-\d{2}-\d{2})"/g)) {
    if (reviewed[1] !== date) throw new Error(`${rel} lastReviewed (${reviewed[1]}) does not match dateModified (${date})`);
  }
  const entry = sitemap.match(new RegExp(`<loc>${url}</loc>\\s*<lastmod>([^<]+)</lastmod>`));
  if (!entry || entry[1] !== date) throw new Error(`${rel} dateModified (${date}) does not match sitemap`);
}
console.log('Metadata dates match the sitemap.');
