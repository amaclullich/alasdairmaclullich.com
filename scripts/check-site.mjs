import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
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
const requiredNavigation = [
  ['/delirium/', 'Delirium'],
  ['/research/', 'Research'],
  ['/books/', 'Books'],
  ['/media/', 'Media'],
  ['/about/', 'About']
];
const requiredFooterLinks = [
  'https://alasdairmaclullich.substack.com/subscribe',
  '/delirium/',
  '/research/',
  '/books/',
  '/media/',
  '/about/',
  '/social/',
  '/contact/',
  '/accessibility/',
  '/privacy/',
  'https://edwebprofiles.ed.ac.uk/profile/alasdair-maclullich',
  'https://www.research.ed.ac.uk/en/persons/alasdair-maclullich/',
  'https://orcid.org/0000-0003-3159-9370'
];
const houseStylePatterns = [
  [/—/, 'em dash'],
  [/\bcannot\b/i, 'cannot'],
  [/\bmatters\b/i, 'matters'],
  [/\bsits across\b/i, 'sits across'],
  [/\bsit alongside\b/i, 'sit alongside'],
  [/\bLonger-form\b/i, 'Longer-form'],
  [/\bPlain-English\b/i, 'Plain-English'],
  [/\bpublic-information\b/i, 'public-information'],
  [/\bsocial-media\b/i, 'social-media'],
  [/\bpublic-resource\b/i, 'public-resource'],
  [/\bcare-home\b/i, 'care-home']
];
const plainText = (value) => value
  .replace(/<[^>]+>/g, ' ')
  .replaceAll('&amp;', '&')
  .replaceAll('&nbsp;', ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();
for (const file of all) {
  const html = await readFile(file, 'utf8');
  const label = relative(root, file);
  const h1 = [...html.matchAll(/<h1(?:\s[^>]*)?>/g)].length;
  if (h1 !== 1) throw new Error(`${label} must have exactly one H1`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  if (new Set(ids).size !== ids.length) throw new Error(`${label} has duplicate IDs`);
  const brands = [...html.matchAll(/<a class="brand(?: footer-brand)?"[^>]*aria-label="([^"]+)"/g)];
  if (brands.length < 1 || brands.some((match) => match[1] !== 'AM, Alasdair MacLullich, home')) throw new Error(`${label} has an inconsistent brand accessible name`);
  const primaryNavigation = html.match(/<nav class="primary-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  if (!primaryNavigation) throw new Error(`${label} is missing primary navigation`);
  for (const [href, text] of requiredNavigation) {
    if (!new RegExp(`<a href="${href.replaceAll('/', '\\/')}"(?: aria-current="(?:page|location)")?>${text}<\\/a>`).test(primaryNavigation)) throw new Error(`${label} primary navigation is missing ${text}`);
  }
  if (/href="\/#work"/.test(primaryNavigation)) throw new Error(`${label} contains the retired Work navigation link`);
  const footerNavigation = html.match(/<nav class="footer-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  const footerLinks = [...(footerNavigation || '').matchAll(/<a href="([^"]+)"/g)].map((match) => match[1]);
  if (JSON.stringify(footerLinks) !== JSON.stringify(requiredFooterLinks)) throw new Error(`${label} footer navigation is inconsistent`);
  if (/<span\b[^>]*aria-hidden="true"[^>]*>↗<\/span>(?!<span class="visually-hidden"> \(external\)<\/span>)/.test(html)) throw new Error(`${label} has an external-link arrow without accessible text`);
  for (const pair of html.matchAll(/<p class="eyebrow"[^>]*>([\s\S]*?)<\/p>\s*<h[12](?:\s[^>]*)?>([\s\S]*?)<\/h[12]>/g)) {
    if (plainText(pair[1]) === plainText(pair[2])) throw new Error(`${label} repeats the same eyebrow and heading text: ${plainText(pair[1])}`);
  }
  const allowedInlineHashes = new Set([...html.matchAll(/'sha256-([^']+)'/g)].map((match) => match[1]));
  for (const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    const hash = createHash('sha256').update(script[1]).digest('base64');
    if (!allowedInlineHashes.has(hash)) throw new Error(`${label} has an inline script without a matching Content Security Policy hash`);
  }
  for (const [pattern, wording] of houseStylePatterns) if (pattern.test(html)) throw new Error(`${label} contains retired house-style wording: ${wording}`);
  if (label !== 'buy/4at-manual/index.html' && /href="https:\/\/(?:www\.)?amazon\.[^"]+\/dp\//i.test(html)) throw new Error(`${label} bypasses the regional Amazon chooser`);
  for (const link of html.matchAll(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    if (/University(?: of Edinburgh)? profile/i.test(link[2]) && link[1] !== 'https://edwebprofiles.ed.ac.uk/profile/alasdair-maclullich') throw new Error(`${label} labels a non-staff-profile link as the University profile`);
  }
  if (file.endsWith('404.html')) continue;
  for (const pattern of [/<title>[^<]+<\/title>/, /<meta name="description" content="[^"]+">/, /<link rel="canonical" href="https:\/\/www\.alasdairmaclullich\.com\//, /<meta property="og:url" content="https:\/\/www\.alasdairmaclullich\.com\//]) if (!pattern.test(html)) throw new Error(`${label} is missing required metadata`);
  if (/<meta name="twitter:image"/.test(html) && !/<meta name="twitter:image:alt" content="[^"]+">/.test(html)) throw new Error(`${label} is missing twitter:image:alt`);
  for (const json of html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)) JSON.parse(json[1]);
  for (const image of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = image[0];
    for (const attr of ['alt', 'width', 'height']) if (!new RegExp(`\\b${attr}=`).test(tag)) throw new Error(`${label} image missing ${attr}`);
  }
  for (const link of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = link[1];
    if (!target.startsWith('/') || target.startsWith('//') || target.includes('#')) continue;
    const pathTarget = target.split('?')[0];
    const candidate = resolve(root, `.${pathTarget}`);
    const candidates = [candidate, join(candidate, 'index.html')];
    if (!(await Promise.all(candidates.map(async (item) => !!(await stat(item).catch(() => null)))).then((checks) => checks.some(Boolean)))) throw new Error(`${label} has broken internal link ${target}`);
  }
}
const siteScript = await readFile(join(root, 'assets/site.js'), 'utf8');
if (!siteScript.includes('analytics_storage: initialPreference === "granted" ? "granted" : "denied"')) throw new Error('Analytics consent must default to denied unless the visitor previously allowed it');
if (!/else \{\s*updateConsent\("denied"\);\s*showBanner\(\);\s*\}/.test(siteScript)) throw new Error('A first visit must show the analytics choice without loading Analytics');
console.log(`Static checks passed for ${all.length} HTML files.`);
