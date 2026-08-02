import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await files(path));
    else if (entry.name.endsWith('.html')) found.push(path);
  }
  return found;
}
const all = await files(root);
for (const file of all) {
  const html = await readFile(file, 'utf8');
  const label = relative(root, file);
  const h1 = [...html.matchAll(/<h1(?:\s[^>]*)?>/g)].length;
  if (h1 !== 1) throw new Error(`${label} must have exactly one H1`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  if (new Set(ids).size !== ids.length) throw new Error(`${label} has duplicate IDs`);
  if (file.endsWith('404.html')) continue;
  for (const pattern of [/<title>[^<]+<\/title>/, /<meta name="description" content="[^"]+">/, /<link rel="canonical" href="https:\/\/www\.alasdairmaclullich\.com\//, /<meta property="og:url" content="https:\/\/www\.alasdairmaclullich\.com\//]) if (!pattern.test(html)) throw new Error(`${label} is missing required metadata`);
  for (const json of html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)) JSON.parse(json[1]);
  for (const image of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = image[0];
    for (const attr of ['alt', 'width', 'height']) if (!new RegExp(`\\b${attr}=`).test(tag)) throw new Error(`${label} image missing ${attr}`);
  }
  for (const link of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = link[1];
    if (!target.startsWith('/') || target.startsWith('//') || target.includes('#')) continue;
    const candidate = resolve(root, `.${target}`);
    const candidates = [candidate, join(candidate, 'index.html')];
    if (!(await Promise.all(candidates.map(async (item) => !!(await stat(item).catch(() => null)))).then((checks) => checks.some(Boolean)))) throw new Error(`${label} has broken internal link ${target}`);
  }
}
console.log(`Static checks passed for ${all.length} HTML files.`);
