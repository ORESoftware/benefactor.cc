import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const astroConfig = await readFile(new URL('../astro.config.mjs', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');

test('Astro injects build CalVer, release date, and exact source commit into the footer', () => {
  assert.match(astroConfig, /PUBLIC_BENEFACTOR_CALVER/);
  assert.match(astroConfig, /PUBLIC_BENEFACTOR_RELEASE_DATE/);
  assert.match(astroConfig, /PUBLIC_BENEFACTOR_GIT_SHA/);
  assert.match(astroConfig, /injectScript\('head-inline', releaseFooterScript\)/);
  assert.match(astroConfig, /'version ' \+ release\.calver/);
  assert.match(astroConfig, /'commit ' \+ release\.gitSha\.slice\(0, 12\)/);
  assert.match(astroConfig, /'released ' \+ release\.releaseDate/);
  assert.match(astroConfig, /github\.com\/ORESoftware\/benefactor\.cc\/commit/);
  assert.match(astroConfig, /data-benefactor-release/);
});

test('production build stamps release metadata from the GitHub build', () => {
  assert.match(workflow, /release_date="\$\(TZ=America\/New_York date \+%Y-%m-%d\)"/);
  assert.match(workflow, /PUBLIC_BENEFACTOR_GIT_SHA="\$GITHUB_SHA"/);
  assert.match(workflow, /PUBLIC_BENEFACTOR_RELEASE_DATE="\$release_date"/);
  assert.match(workflow, /PUBLIC_BENEFACTOR_CALVER="\$\{release_date\/\/-\/\.\}"/);
  assert.match(workflow, /grep -q '\$GITHUB_SHA'|grep -q "\$GITHUB_SHA"/);
});
