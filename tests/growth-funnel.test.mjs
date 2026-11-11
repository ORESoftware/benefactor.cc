import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = async (path) => readFile(join(root, path), 'utf8');

test('public site exposes pricing and a B2B SaaS-specific buyer path', async () => {
  const [layout, home, saas] = await Promise.all([
    source('src/layouts/BaseLayout.astro'),
    source('src/pages/index.astro'),
    source('src/pages/b2b-saas.astro'),
  ]);
  assert.match(layout, /id="nav-pricing-link"/);
  assert.match(layout, /withBase\('quote\/'\)/);
  assert.match(home, /withBase\('b2b-saas\/'\)/);
  assert.match(home, /Diagnostic Sprint/);
  assert.match(saas, /One-week Diagnostic Sprint/);
  assert.match(saas, /This is a proposed service scope, not a promised revenue outcome/);
  assert.match(saas, /https:\/\/calendly\.com\/hello-benefactor\/30min/);
  assert.doesNotMatch(saas, /guaranteed leads|guaranteed revenue/i);
});

test('all five quote tiers use one shared website pricing authority', async () => {
  const [quotes, landing, tiers] = await Promise.all([
    source('src/pages/quote.astro'),
    source('src/pages/b2b-saas.astro'),
    source('src/data/quoteTiers.ts'),
  ]);
  assert.match(quotes, /import \{ quoteTiers \} from '..\/data\/quoteTiers'/);
  assert.match(landing, /import \{ quoteTiers \} from '..\/data\/quoteTiers'/);
  for (const id of ['diagnostic', 'launch', 'build', 'scale', 'embedded']) {
    assert.ok(tiers.includes("id: '" + id + "'"), 'missing tier ' + id);
  }
  assert.ok(tiers.includes("price: '$1,500'"));
  assert.ok(quotes.includes('href="#quote-form" data-tier-link={tier.id}'));
  assert.ok(!quotes.includes('#quote-form?tier='), 'invalid fragment query must not return');
});

test('quote form has human fallback and safe retry on uncertain API outcomes', async () => {
  const quote = await source('src/pages/quote.astro');
  assert.ok(quote.includes('data-api-origin="https://api.benefactor.cc"'));
  assert.ok(quote.includes("'idempotency-key':"));
  assert.ok(quote.includes('public-quote:'));
  assert.ok(quote.includes('same submission ID is safe to reuse'));
  assert.ok(quote.includes('https://calendly.com/hello-benefactor/30min'));
  assert.ok(quote.includes('mailto:hello@benefactor.cc'));
  assert.ok(quote.includes("if (!response.ok) throw new Error"));
  assert.ok(quote.includes("typeof receipt?.submission_id !== 'string'"));
});
