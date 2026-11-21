import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync('src/pages/index.astro', 'utf8');
const motion = readFileSync('src/scripts/home-motion.ts', 'utf8');
const css = readFileSync('src/styles/global.css', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));

test('home page loads motion as an optional enhancement', () => {
  assert.match(home, /bootHomeMotion\(\)/);
  assert.match(motion, /prefers-reduced-motion: reduce/);
  assert.match(motion, /prefers-reduced-data: reduce/);
  assert.match(motion, /connection\?\.saveData/);
  assert.match(motion, /ScrollTrigger/);
  assert.match(motion, /anchors: \{ offset: -72 \}/);
  assert.match(css, /html\.motion-enhanced \.animate-fade-in-up/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('animation engines are locked to reviewed versions and integrity', () => {
  for (const [name, version] of [['gsap', '3.15.1'], ['lenis', '1.3.27']]) {
    assert.equal(pkg.dependencies[name], version);
    assert.equal(lock.packages[''].dependencies[name], version);
    assert.equal(lock.packages['node_modules/' + name].version, version);
    assert.match(lock.packages['node_modules/' + name].integrity, /^sha512-/);
  }
});

test('every scroll reveal selector exists in home page markup', () => {
  for (const selector of [
    'stats__grid', 'services__grid', 'competencies__rows',
    'process__timeline', 'portfolio__grid', 'team__grid', 'voices__grid',
    'hero__orb', 'hero__video', 'cta__content',
  ]) {
    assert.ok(home.includes(selector), selector + ' missing');
  }
});
