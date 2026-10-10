import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const directory = await readFile(new URL('../src/data/team.ts', import.meta.url), 'utf8');
const pages = await Promise.all([
  readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/team.astro', import.meta.url), 'utf8'),
]);

test('Utkarsh Shukla is the sole Social Media Wizard with the local portrait', () => {
  assert.equal((directory.match(/id: 'utkarsh'/g) ?? []).length, 1);
  assert.match(directory, /name: 'Utkarsh Shukla',[\s\S]*?role: 'Social Media Wizard'/);
  assert.match(directory, /image: '\/team\/utkarsh-shukla\.webp'/);
});

test('unknown team member locations may be omitted without placeholders', () => {
  assert.match(directory, /readonly location\?: string;/);
  for (const page of pages) assert.match(page, /member\.location && \(/);
});

test('Utkarsh portrait is a local WebP file', async () => {
  const image = await readFile(new URL('../public/team/utkarsh-shukla.webp', import.meta.url));
  assert.ok(image.byteLength > 1000);
  assert.equal(image.toString('ascii', 0, 4), 'RIFF');
  assert.equal(image.toString('ascii', 8, 12), 'WEBP');
});
