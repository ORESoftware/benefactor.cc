import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const layout = await readFile(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');

test('footer exposes build CalVer, release date, and exact source commit', () => {
  assert.match(layout, /PUBLIC_BENEFACTOR_CALVER/);
  assert.match(layout, /PUBLIC_BENEFACTOR_RELEASE_DATE/);
  assert.match(layout, /PUBLIC_BENEFACTOR_GIT_SHA/);
  assert.match(layout, /version \{releaseCalver\}/);
  assert.match(layout, /commit \{releaseCommitShort\}/);
  assert.match(layout, /released \{releaseDate\}/);
  assert.match(layout, /github\.com\/ORESoftware\/benefactor\.cc\/commit/);
});

test('production build stamps release metadata from the GitHub build', () => {
  assert.match(workflow, /PUBLIC_BENEFACTOR_GIT_SHA="\$GITHUB_SHA"/);
  assert.match(workflow, /PUBLIC_BENEFACTOR_RELEASE_DATE="\$\(date -u \+%Y-%m-%d\)"/);
  assert.match(workflow, /PUBLIC_BENEFACTOR_CALVER="\$\(date -u \+%Y\.%m\.%d\)"/);
  assert.match(workflow, /grep -q 'version '/);
  assert.match(workflow, /grep -q 'commit '/);
});
