/**
 * Dependency-free browser smoke: serves Astro's exact production output, then
 * drives installed Chromium through the Chrome DevTools Protocol. It does not
 * require npm playwright/puppeteer, cross-org tokens, or downloading browsers.
 */
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const browserCandidates = [process.env.CHROME_BIN, 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'].filter(Boolean);
const browser = browserCandidates.find((candidate) =>
  spawnSync('which', [candidate], { stdio: 'ignore' }).status === 0
);
if (!browser) {
  if (process.env.CI) throw new Error('A Chromium/Chrome binary is required for the CI motion smoke test');
  console.log('SKIP browser smoke: no Chromium/Chrome available');
  process.exit(0);
}

const dist = resolve('dist');
assert.ok(readFileSync(join(dist, 'index.html'), 'utf8').includes('hero__title'), 'Production home page missing');
const bundles = readdirSync(join(dist, '_astro')).filter((name) => /^(gsap|ScrollTrigger|lenis)\.[^/]+\.js$/.test(name));
assert.equal(bundles.length, 3, 'Expected separately cached GSAP, ScrollTrigger and Lenis chunks');
const bytes = bundles.reduce((sum, name) => sum + statSync(join(dist, '_astro', name)).size, 0);
assert.ok(bytes < 200_000, `Animation engine chunks exceed 200 KB uncompressed: ${bytes}`);

const contentTypes = { '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    const file = resolve(dist, `.${pathname}`, pathname.endsWith('/') ? 'index.html' : '.');
    if (file !== dist && !file.startsWith(dist + sep)) {
      response.writeHead(403).end();
      return;
    }
    const data = await readFile(file);
    response.writeHead(200, { 'Content-Type': contentTypes[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(data);
  } catch {
    response.writeHead(404).end();
  }
});

function cdpSocket(socket) {
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener('message', ({ data }) => {
    const result = JSON.parse(String(data));
    const waiter = pending.get(result.id);
    if (!waiter) return;
    pending.delete(result.id);
    clearTimeout(waiter.timer);
    if (result.error) waiter.reject(new Error(result.error.message));
    else waiter.resolve(result.result);
  });
  return (method, params = {}) => new Promise((accept, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15_000);
    pending.set(id, { resolve: accept, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function eventually(check, name, timeout = 10_000) {
  const end = Date.now() + timeout;
  let last;
  while (Date.now() < end) {
    last = await check();
    if (last) return;
    await sleep(150);
  }
  throw new Error(`Timed out checking ${name}`);
}

let chrome;
let socket;
let profile;
try {
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const { port } = server.address();
  profile = mkdtempSync(join(tmpdir(), 'benefactor-chrome-'));
  chrome = spawn(browser, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--disable-background-networking', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: 'ignore' });

  let cdpPort = 0;
  await eventually(async () => {
    try {
      cdpPort = Number(readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]);
      return Number.isInteger(cdpPort) && cdpPort > 0;
    } catch {
      return false;
    }
  }, 'Chrome DevTools startup', 15_000);

  const tabs = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
  const tab = tabs.find((entry) => entry.type === 'page');
  assert.ok(tab?.webSocketDebuggerUrl, 'No Chromium page target');
  socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((ok, bad) => {
    socket.addEventListener('open', ok, { once: true });
    socket.addEventListener('error', bad, { once: true });
  });
  const send = cdpSocket(socket);
  const evaluate = async (expression) => {
    const value = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (value.exceptionDetails) throw new Error(value.exceptionDetails.text);
    return value.result.value;
  };
  const flags = () => evaluate(`({
    animated: document.documentElement.classList.contains('motion-enhanced'),
    lenis: document.documentElement.classList.contains('lenis'),
    titleVisible: !!document.querySelector('.hero__title') &&
      Number(getComputedStyle(document.querySelector('.hero__title')).opacity) > 0.95,
    serviceVisible: !!document.querySelector('.services__card') &&
      Number(getComputedStyle(document.querySelector('.services__card')).opacity) > 0.95,
    viewportWidth: innerWidth,
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches
  })`);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 860, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/` });
  await eventually(async () => (await flags())?.animated, 'desktop motion bootstrap');
  await eventually(async () => (await flags())?.titleVisible, 'visible hero after entrance');
  assert.equal((await flags()).reduced, false);

  // OS preference changes must reverse active GSAP styles while the page is open.
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await eventually(async () => !(await flags())?.animated, 'reduced-motion teardown');
  await eventually(async () => (await flags())?.titleVisible, 'hero visible after reduced-motion teardown');
  assert.equal((await flags()).lenis, false, 'Lenis must be destroyed under reduced motion');

  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await eventually(async () => (await flags())?.animated, 'motion re-enabled');

  // Responsive resize must recreate the mobile animation scope without Lenis.
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await eventually(async () => (await flags())?.viewportWidth === 390, 'mobile viewport');
  await eventually(async () => (await flags())?.animated, 'mobile motion scope');
  assert.equal((await flags()).lenis, false, 'Mobile must use native scroll');

  await evaluate(`window.scrollTo({top: document.getElementById('services').offsetTop, behavior: 'instant'})`);
  await eventually(async () => (await flags())?.serviceVisible, 'service card visible after scroll', 10_000);

  console.log(`PASS Chromium motion smoke: responsive, reduced-motion teardown/restart, content visible; bundle ${bytes} bytes`);
} finally {
  socket?.close();
  if (chrome && chrome.exitCode === null) chrome.kill('SIGTERM');
  await new Promise((ok) => server.close(ok));
  if (profile) await rm(profile, { recursive: true, force: true, maxRetries: 12, retryDelay: 200 }).catch(() => {});
}
