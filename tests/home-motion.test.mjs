import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { resolveMotionPolicy } from '../src/scripts/motion-policy.ts';

const home = readFileSync('src/pages/index.astro', 'utf8');
const motion = readFileSync('src/scripts/home-motion.ts', 'utf8');
const css = readFileSync('src/styles/global.css', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));

const desktop = {
  reducedMotion: false, reducedData: false, saveData: false,
  compactViewport: false, wideViewport: true, finePointer: true,
};

test('desktop gets animation, parallax, and Lenis', () => {
  assert.deepEqual(resolveMotionPolicy(desktop), {
    animate: true, parallax: true, smoothScroll: true,
  });
});

test('all accessibility and data-saving preferences hard-disable motion', () => {
  for (const field of ['reducedMotion', 'reducedData', 'saveData']) {
    const policy = resolveMotionPolicy({ ...desktop, [field]: true });
    assert.deepEqual(policy, { animate: false, parallax: false, smoothScroll: false });
  }
});

test('tablet, touch, and compact viewport keep native scroll', () => {
  assert.equal(resolveMotionPolicy({ ...desktop, finePointer: false }).smoothScroll, false);
  assert.equal(resolveMotionPolicy({ ...desktop, wideViewport: false }).smoothScroll, false);
  assert.deepEqual(resolveMotionPolicy({
    ...desktop, compactViewport: true, wideViewport: false, finePointer: false,
  }), { animate: true, parallax: false, smoothScroll: false });
});

test('motion enhancement is optional and responds to viewport and preference changes', () => {
  assert.match(home, /bootHomeMotion\(\)/);
  assert.match(motion, /import\('gsap'\)/);
  assert.match(motion, /import\('gsap\/ScrollTrigger'\)/);
  assert.match(motion, /import\('lenis'\)/);
  assert.match(motion, /if \(!resolveMotionPolicy\(capabilities\(\)\)\.animate\) return;/);
  assert.match(motion, /prefers-reduced-motion: no-preference\) and \(max-width: 768px/);
  assert.match(motion, /prefers-reduced-motion: no-preference\) and \(min-width: 769px/);
  assert.match(motion, /lenis\?\.destroy\(\)/);
  assert.match(motion, /media\.revert\(\)/);
  assert.match(motion, /anchors: \{ offset: -72 \}/);
  assert.match(css, /html\.lenis/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /:focus-visible/);
});

test('runtime has an accessible fallback if JS fails and no duplicate CSS intro', () => {
  assert.doesNotMatch(css, /opacity:\s*0\s*;\s*\/\*\s*hidden-before-JS/);
  assert.match(css, /body:has\(#hero\) \.animate-fade-in-up/);
  assert.match(motion, /window\.scrollY < window\.innerHeight \* 0\.5/);
  assert.match(motion, /gsap\.killTweensOf\(button\)/);
  assert.doesNotMatch(motion, /autoAlpha/, 'Visual entrances must not hide content from assistive technology');
  assert.match(motion, /scrollTrigger: \{ trigger: item, start: 'top 91%', once: true \}/);
});

test('animation dependencies are exact and integrity-pinned in lockfile', () => {
  for (const [name, version] of [['gsap', '3.15.1'], ['lenis', '1.3.27']]) {
    assert.equal(pkg.dependencies[name], version);
    assert.equal(lock.packages[''].dependencies[name], version);
    assert.equal(lock.packages['node_modules/' + name].version, version);
    assert.match(lock.packages['node_modules/' + name].integrity, /^sha512-/);
  }
});

test('every scroll reveal has a corresponding home-page selector', () => {
  for (const selector of [
    'stats__grid', 'services__grid', 'competencies__rows',
    'process__timeline', 'portfolio__grid', 'team__grid', 'voices__grid',
    'hero__orb', 'hero__video', 'cta__content',
  ]) {
    assert.ok(home.includes(selector), selector + ' missing');
  }
});
