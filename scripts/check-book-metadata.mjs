import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const metadata = await readFile(join(root, 'data/book-metadata.yml'), 'utf8');
const get = (key) => metadata.match(new RegExp(`^${key}: "(.+)"$`, 'm'))?.[1];
const authors = [...metadata.matchAll(/^  - "(.+)"$/gm)].map((entry) => entry[1]);
const general = [...authors, get('publication_date')];
const pages = [join(root, 'index.html'), join(root, 'llms.txt')];
for (const page of pages) {
  const content = await readFile(page, 'utf8');
  for (const value of general) if (!content.includes(value)) throw new Error(`${page} does not match book metadata: ${value}`);
}
const bookPage = await readFile(join(root, 'books/delirium-family-guide/index.html'), 'utf8');
for (const value of [get('title'), get('subtitle'), ...general]) if (!bookPage.includes(value)) throw new Error(`Family-guide page does not match book metadata: ${value}`);
console.log('Book metadata is consistent.');
